import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { filename, mimeType } = await request.json();
    const cleanFilename = (filename || 'image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Presign failed.' },
      { status: 500 }
    );
  }
}
