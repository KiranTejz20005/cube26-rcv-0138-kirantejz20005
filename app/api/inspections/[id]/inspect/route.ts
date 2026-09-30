import { NextResponse } from 'next/server';
import { runInspectionPipeline } from '@/lib/inspection/analyzer';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await runInspectionPipeline(id);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    console.error('Inspection process failed:', error);
    const errMsg = error instanceof Error ? error.message : 'AI Inspection process failed. Check API key or DEMO_MODE setting.';
    return NextResponse.json(
      {
        success: false,
        error: errMsg,
      },
      { status: 500 }
    );
  }
}
