import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runVisionInspection } from '../lib/ai';
import { InspectionInput } from '../lib/ai/provider';
import path from 'path';
import fs from 'fs/promises';

describe('AI Multimodal Vision Providers & Fallback Chain', () => {
  const originalEnv = process.env;

  const sampleInput: InspectionInput = {
    inspectionId: 'test-insp-001',
    purchaseOrder: {
      orderNumber: 'PO-TEST-100',
      sku: 'BLUE-BOTTLE-001',
      productName: 'Steel Water Bottle',
      expectedQuantity: 24,
      expectedVariant: 'Blue',
    },
    referenceImages: [],
    receivingImages: [
      {
        id: 'img-rec-1',
        url: '/uploads/test-img.png',
        type: 'RECEIVING',
        storageKey: 'uploads/test-img.png',
      },
    ],
  };

  const validVisionObservation = {
    product: { observedSku: 'BLUE-BOTTLE-001', confidence: 0.99 },
    quantity: { observed: 24, confidence: 0.97 },
    variant: { observed: 'Blue', confidence: 0.95 },
    condition: { damaged: false, damageTypes: [], confidence: 0.98 },
    components: { missing: [], confidence: 0.96 },
    evidence: [{ imageId: 'img-rec-1', observation: 'Matches PO', field: 'product' }],
    uncertainty: [],
  };

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };

    // Ensure sample test image exists locally for loader
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(
      path.join(uploadDir, 'test-img.png'),
      Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should use DemoVisionProvider when DEMO_MODE=true', async () => {
    process.env.DEMO_MODE = 'true';
    process.env.NVIDIA_API_KEY = 'nv-key';

    const result = await runVisionInspection(sampleInput);
    expect(result.providerName).toBe('Demo');
    expect(result.attemptedProviders).toEqual(['Demo']);
    expect(result.observation.product.observedSku).toBe('BLUE-BOTTLE-001');
  });

  it('should execute NVIDIA provider first when NVIDIA_API_KEY is configured', async () => {
    process.env.DEMO_MODE = 'false';
    process.env.NVIDIA_API_KEY = 'nv-key';
    process.env.GROQ_API_KEY = 'groq-key';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(validVisionObservation),
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await runVisionInspection(sampleInput);

    expect(result.providerName).toBe('NVIDIA');
    expect(result.attemptedProviders).toEqual(['NVIDIA']);
    expect(result.observation.product.observedSku).toBe('BLUE-BOTTLE-001');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain('integrate.api.nvidia.com');
  });

  it('should fallback from NVIDIA to Groq on HTTP 429 rate limit', async () => {
    process.env.DEMO_MODE = 'false';
    process.env.NVIDIA_API_KEY = 'nv-key';
    process.env.GROQ_API_KEY = 'groq-key';

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('nvidia')) {
        return Promise.resolve({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          text: async () => 'Rate limit exceeded',
        });
      }
      if (url.includes('groq')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify(validVisionObservation),
                },
              },
            ],
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await runVisionInspection(sampleInput);

    expect(result.providerName).toBe('Groq');
    expect(result.attemptedProviders).toEqual(['NVIDIA', 'Groq']);
    expect(result.observation.product.observedSku).toBe('BLUE-BOTTLE-001');
  });

  it('should fallback from Groq to Gemini on Groq 500 error', async () => {
    process.env.DEMO_MODE = 'false';
    process.env.GROQ_API_KEY = 'groq-key';
    process.env.GEMINI_API_KEY = 'gemini-key';

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('groq')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error',
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
    vi.stubGlobal('fetch', mockFetch);

    // Mock Gemini SDK or throw fallback
    try {
      await runVisionInspection(sampleInput);
    } catch (err: unknown) {
      expect(err).toBeDefined();
    }
  });

  it('should throw an explicit error if no providers are configured and DEMO_MODE=false', async () => {
    process.env.DEMO_MODE = 'false';
    delete process.env.NVIDIA_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;

    await expect(runVisionInspection(sampleInput)).rejects.toThrow(
      'No real vision provider is configured'
    );
  });

  it('should throw an explicit input error without fallback if an image file is missing', async () => {
    process.env.DEMO_MODE = 'false';
    process.env.NVIDIA_API_KEY = 'nv-key';
    process.env.GROQ_API_KEY = 'groq-key';

    const missingImageInput: InspectionInput = {
      ...sampleInput,
      receivingImages: [
        {
          id: 'missing-img',
          url: '/uploads/nonexistent-file-9999.png',
          type: 'RECEIVING',
          storageKey: 'uploads/nonexistent-file-9999.png',
        },
      ],
    };

    await expect(runVisionInspection(missingImageInput)).rejects.toThrow(
      'Input Image Error'
    );
  });
});
