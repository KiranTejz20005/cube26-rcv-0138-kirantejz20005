import fs from 'fs/promises';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { VisionProvider, InspectionInput } from './provider';
import { VisionObservationSchema, VisionInspection } from './schemas';
import { RECEIVING_INSPECTION_SYSTEM_PROMPT, buildUserPrompt } from './prompts';

export class GeminiVisionProvider implements VisionProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is missing. Please set GEMINI_API_KEY in your .env file or enable DEMO_MODE.');
    }
  }

  private async getImagePart(img: { id: string; url: string; storageKey: string; type: string }): Promise<{ inlineData: { data: string; mimeType: string } }> {
    let buffer: Buffer | null = null;
    let mimeType = 'image/jpeg';

    if (img.url.endsWith('.png')) mimeType = 'image/png';
    else if (img.url.endsWith('.webp')) mimeType = 'image/webp';

    // If local file path
    if (img.storageKey.startsWith('uploads/') || img.url.startsWith('/uploads/')) {
      const filename = path.basename(img.storageKey || img.url);
      const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
      try {
        buffer = await fs.readFile(filePath);
      } catch (err) {
        console.warn(`Could not read local file ${filePath}:`, err);
      }
    }

    // If HTTP URL and not local
    if (!buffer && (img.url.startsWith('http://') || img.url.startsWith('https://'))) {
      try {
        const res = await fetch(img.url);
        const arrayBuffer = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        const headerMime = res.headers.get('content-type');
        if (headerMime) mimeType = headerMime;
      } catch (err) {
        console.warn(`Could not fetch image from URL ${img.url}:`, err);
      }
    }

    if (!buffer) {
      // Create a 1x1 fallback dummy JPEG if image reading failed
      buffer = Buffer.from(
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
        'base64'
      );
    }

    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType,
      },
    };
  }

  async inspect(input: InspectionInput): Promise<VisionInspection> {
    const ai = new GoogleGenAI({ apiKey: this.apiKey });

    const refImageIds = input.referenceImages.map((i) => i.id);
    const recImageIds = input.receivingImages.map((i) => i.id);

    const userPromptText = buildUserPrompt(input.purchaseOrder, refImageIds, recImageIds);

    const allImages = [...input.referenceImages, ...input.receivingImages];
    const imageParts = await Promise.all(allImages.map((img) => this.getImagePart(img)));

    const contents: any = [
      {
        role: 'user',
        parts: [
          { text: RECEIVING_INSPECTION_SYSTEM_PROMPT },
          { text: userPromptText },
          ...imageParts,
        ],
      },
    ];

    const primaryModel = 'gemini-2.5-flash';
    const fallbackModel = 'gemini-2.5-flash-lite';

    let responseText = '';

    try {
      const response = await ai.models.generateContent({
        model: primaryModel,
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      responseText = response.text || '';
    } catch (primaryErr: any) {
      console.warn(`Gemini primary model (${primaryModel}) failed or rate-limited:`, primaryErr?.message || primaryErr);
      // Attempt fallback model
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
      } catch (fallbackErr: any) {
        console.error(`Gemini fallback model (${fallbackModel}) also failed:`, fallbackErr?.message || fallbackErr);
        throw new Error(`Gemini API Error: Quota limits exceeded or API request failed. Message: ${fallbackErr?.message || 'API Error'}`);
      }
    }

    // Clean JSON response
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch (jsonErr) {
      console.error('Failed to parse Gemini JSON output:', cleanJson);
      throw new Error('AI Provider returned invalid JSON structure.');
    }

    // Validate using Zod schema
    const validationResult = VisionObservationSchema.safeParse(parsedData);
    if (!validationResult.success) {
      console.error('Zod schema validation failed for AI response:', validationResult.error.format());
      throw new Error(`AI response structure did not match expected schema: ${validationResult.error.issues[0]?.message}`);
    }

    return validationResult.data;
  }
}
