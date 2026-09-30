import { VisionProvider, InspectionInput } from '../provider';
import { VisionObservationSchema, VisionInspection } from '../schemas';
import { RECEIVING_INSPECTION_SYSTEM_PROMPT, buildUserPrompt } from '../prompts';
import { loadImagePart } from '../image-loader';

export class NvidiaVisionProvider implements VisionProvider {
  readonly name = 'NVIDIA';
  readonly model: string;
  private apiKey: string;
  private endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.NVIDIA_API_KEY || '';
    this.model = model || process.env.NVIDIA_MODEL || 'meta/llama-3.2-90b-vision-instruct';

    if (!this.apiKey) {
      throw new Error('NVIDIA_API_KEY is missing. Please set NVIDIA_API_KEY in your .env file.');
    }
  }

  async inspect(input: InspectionInput): Promise<VisionInspection> {
    const refImageIds = input.referenceImages.map((i) => i.id);
    const recImageIds = input.receivingImages.map((i) => i.id);
    const userPromptText = buildUserPrompt(input.purchaseOrder, refImageIds, recImageIds);

    const allImages = [...input.referenceImages, ...input.receivingImages];
    const imageParts = await Promise.all(allImages.map((img) => loadImagePart(img)));

    // Construct OpenAI-compatible multimodal content array
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: 'text', text: userPromptText },
    ];

    for (const imgPart of imageParts) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: imgPart.dataUrl,
        },
      });
    }

    const payload = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: RECEIVING_INSPECTION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

    let res: Response;
    try {
      res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      const msg = isAbort ? 'NVIDIA API request timed out after 35s.' : (fetchErr instanceof Error ? fetchErr.message : String(fetchErr));
      throw new Error(`NVIDIA Provider Error: ${msg}`);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const status = res.status;
      const errorText = await res.text().catch(() => '');
      throw new Error(`NVIDIA Provider HTTP ${status} error: ${errorText || res.statusText}`);
    }

    const data = await res.json();
    const contentText = data.choices?.[0]?.message?.content || '';

    let cleanJson = contentText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse NVIDIA Vision JSON output:', cleanJson);
      throw new Error('NVIDIA Provider returned invalid JSON structure.');
    }

    const validationResult = VisionObservationSchema.safeParse(parsedData);
    if (!validationResult.success) {
      console.error('Zod validation failed for NVIDIA Vision response:', validationResult.error.format());
      throw new Error(`NVIDIA response structure did not match schema: ${validationResult.error.issues[0]?.message}`);
    }

    return validationResult.data;
  }
}
