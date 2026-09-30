import { VisionProvider } from './provider';
import { GeminiVisionProvider } from './gemini';
import { DemoVisionProvider } from './demo';

export function getVisionProvider(): VisionProvider {
  const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.GEMINI_API_KEY;

  if (isDemoMode) {
    return new DemoVisionProvider();
  }

  return new GeminiVisionProvider();
}
