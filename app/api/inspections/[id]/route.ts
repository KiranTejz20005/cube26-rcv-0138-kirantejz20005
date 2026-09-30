import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        purchaseOrder: true,
        images: true,
        checks: {
          include: {
            evidence: {
              include: {
                image: true,
              },
            },
          },
        },
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: 'Inspection not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: inspection });
  } catch (error: any) {
    console.error('Error fetching inspection details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inspection details.' },
      { status: 500 }
    );
  }
}
