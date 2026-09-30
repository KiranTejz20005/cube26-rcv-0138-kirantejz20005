import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filename = body?.filename || 'image.jpg';
    const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageKey = `uploads/${Date.now()}-${cleanFilename}`;
    const uploadUrl = `/api/uploads`; // Standard fallback upload endpoint

    return NextResponse.json({
      success: true,
      data: {
        uploadUrl,
        storageKey,
        publicUrl: `/uploads/${cleanFilename}`,
      },
    });
  } catch (error: unknown) {
    console.error('Presign error:', error);
    return NextResponse.json(
      { success: false, error: 'Presign failed.' },
      { status: 500 }
    );
  }
}
