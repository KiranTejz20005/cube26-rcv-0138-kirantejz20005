import { GoogleGenAI } from '@google/genai';
import { VisionProvider, InspectionInput } from '../provider';
import { VisionObservationSchema, VisionInspection } from '../schemas';
import { RECEIVING_INSPECTION_SYSTEM_PROMPT, buildUserPrompt } from '../prompts';
import { loadImagePart } from '../image-loader';

export class GeminiVisionProvider implements VisionProvider {
  readonly name = 'Gemini';
  readonly model: string;
  private apiKey: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    this.model = model || process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is missing. Please set GEMINI_API_KEY in your .env file.');
    }
  }

  async inspect(input: InspectionInput): Promise<VisionInspection> {
    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    const refImageIds = input.referenceImages.map((i) => i.id);
    const recImageIds = input.receivingImages.map((i) => i.id);
    const userPromptText = buildUserPrompt(input.purchaseOrder, refImageIds, recImageIds);

    const allImages = [...input.referenceImages, ...input.receivingImages];
    const imageParts = await Promise.all(allImages.map((img) => loadImagePart(img)));

    const inlineParts = imageParts.map((img) => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType,
      },
    }));

    const contents = [
      {
        role: 'user',
        parts: [
          { text: RECEIVING_INSPECTION_SYSTEM_PROMPT },
          { text: userPromptText },
          ...inlineParts,
        ],
      },
    ];

    const fallbackModel = 'gemini-2.5-flash-lite';
    let responseText = '';

    try {
      const response = await ai.models.generateContent({
        model: this.model,
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      responseText = response.text || '';
    } catch (primaryErr: unknown) {
      const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      console.warn(`Gemini primary model (${this.model}) failed or rate-limited:`, errMsg);
      try {
        const response = await ai.models.generateContent({
          model: fallbackModel,
          contents,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        });
        responseText = response.text || '';
      } catch (fallbackErr: unknown) {
        const fallMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        console.error(`Gemini fallback model (${fallbackModel}) also failed:`, fallMsg);
        throw new Error(`Gemini API Error: Quota limits exceeded or API request failed. Message: ${fallMsg}`);
      }
    }

    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse Gemini JSON output:', cleanJson);
      throw new Error('Gemini Provider returned invalid JSON structure.');
    }

    const validationResult = VisionObservationSchema.safeParse(parsedData);
    if (!validationResult.success) {
      console.error('Zod schema validation failed for Gemini response:', validationResult.error.format());
      throw new Error(`Gemini response structure did not match expected schema: ${validationResult.error.issues[0]?.message}`);
    }

    return validationResult.data;
  }
}
