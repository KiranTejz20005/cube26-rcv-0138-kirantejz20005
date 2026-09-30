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
        { success: false, error: 'Inspection result not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        inspectionId: inspection.id,
        status: inspection.status,
        overallDecision: inspection.overallDecision,
        purchaseOrder: inspection.purchaseOrder,
        checks: inspection.checks,
        updatedAt: inspection.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch result.' },
      { status: 500 }
    );
  }
}
