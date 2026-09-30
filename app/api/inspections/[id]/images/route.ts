import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

const AddImageSchema = z.object({
  type: z.enum(['REFERENCE', 'RECEIVING']),
  storageKey: z.string(),
  url: z.string(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = AddImageSchema.parse(body);

    const inspection = await prisma.inspection.findUnique({ where: { id } });
    if (!inspection) {
      return NextResponse.json(
        { success: false, error: 'Inspection not found.' },
        { status: 404 }
      );
    }

    const image = await prisma.inspectionImage.create({
      data: {
        inspectionId: id,
        type: validated.type,
        storageKey: validated.storageKey,
        url: validated.url,
      },
    });

    return NextResponse.json({ success: true, data: image }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    const errMsg = error instanceof Error ? error.message : 'Failed to add image.';
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
