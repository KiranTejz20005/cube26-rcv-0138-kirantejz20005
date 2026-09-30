import { VisionProvider, InspectionInput, VisionInspectionResult } from './provider';
import { NvidiaVisionProvider } from './providers/nvidia';
import { GroqVisionProvider } from './providers/groq';
import { GeminiVisionProvider } from './providers/gemini';
import { DemoVisionProvider } from './providers/demo';

export { NvidiaVisionProvider } from './providers/nvidia';
export { GroqVisionProvider } from './providers/groq';
export { GeminiVisionProvider } from './providers/gemini';
export { DemoVisionProvider } from './providers/demo';

export function getAvailableProviders(): VisionProvider[] {
  const isDemoMode = (process.env.DEMO_MODE || '').toLowerCase() === 'true';

  if (isDemoMode) {
    return [new DemoVisionProvider()];
  }

  const providers: VisionProvider[] = [];

  if (process.env.NVIDIA_API_KEY) {
    try {
      providers.push(new NvidiaVisionProvider());
    } catch (err) {
      console.warn('Failed to initialize NVIDIA provider:', err);
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      providers.push(new GroqVisionProvider());
    } catch (err) {
      console.warn('Failed to initialize Groq provider:', err);
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      providers.push(new GeminiVisionProvider());
    } catch (err) {
      console.warn('Failed to initialize Gemini provider:', err);
    }
  }

  return providers;
}

export async function runVisionInspection(input: InspectionInput): Promise<VisionInspectionResult> {
  const isDemoMode = (process.env.DEMO_MODE || '').toLowerCase() === 'true';

  if (isDemoMode) {
    const demo = new DemoVisionProvider();
    const obs = await demo.inspect(input);
    return {
      observation: obs,
      providerName: demo.name,
      providerModel: demo.model,
      attemptedProviders: [demo.name],
    };
  }

  const providers = getAvailableProviders();

  if (providers.length === 0) {
    throw new Error('No real vision provider is configured. Please add NVIDIA_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY to your .env file or set DEMO_MODE=true.');
  }

  const attemptedProviders: string[] = [];
  const errors: string[] = [];

  for (const provider of providers) {
    attemptedProviders.push(provider.name);
    try {
      const obs = await provider.inspect(input);
      return {
        observation: obs,
        providerName: provider.name,
        providerModel: provider.model,
        attemptedProviders,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`Vision Provider ${provider.name} (${provider.model}) failed: ${errMsg}`);
      errors.push(`${provider.name}: ${errMsg}`);

      // If missing image binary data or local input error, do not retry another provider blindly
      if (errMsg.includes('Failed to load uploaded image binary data')) {
        throw new Error(`Input Image Error: ${errMsg}`);
      }
    }
  }

  throw new Error(`All configured vision providers failed. Attempted: [${attemptedProviders.join(', ')}]. Errors: ${errors.join(' | ')}`);
}

// Fallback compatibility wrapper for single provider getter
export function getVisionProvider(): VisionProvider {
  const providers = getAvailableProviders();
  if (providers.length > 0) {
    return providers[0];
  }
  return new DemoVisionProvider();
}
