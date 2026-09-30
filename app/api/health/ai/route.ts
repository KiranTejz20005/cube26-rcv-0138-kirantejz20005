import { NextResponse } from 'next/server';

export async function GET() {
  const isDemoMode = (process.env.DEMO_MODE || '').toLowerCase() === 'true';

  const nvidiaAvailable = Boolean(process.env.NVIDIA_API_KEY);
  const groqAvailable = Boolean(process.env.GROQ_API_KEY);
  const geminiAvailable = Boolean(process.env.GEMINI_API_KEY);

  return NextResponse.json({
    status: 'ok',
    demoMode: isDemoMode,
    providers: {
      nvidia: nvidiaAvailable,
      groq: groqAvailable,
      gemini: geminiAvailable,
    },
    models: {
      nvidia: process.env.NVIDIA_MODEL || 'meta/llama-3.2-90b-vision-instruct',
      groq: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
      gemini: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    },
    priority: isDemoMode ? ['demo'] : ['nvidia', 'groq', 'gemini'],
  });
}
