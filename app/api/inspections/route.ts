import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';

const CreateInspectionSchema = z.object({
  orderNumber: z.string().min(1, 'PO number is required'),
  sku: z.string().min(1, 'SKU is required'),
  productName: z.string().optional(),
  expectedQuantity: z.number().int().positive('Quantity must be greater than 0'),
  expectedVariant: z.string().optional(),
  images: z
    .array(
      z.object({
        type: z.enum(['REFERENCE', 'RECEIVING']),
        storageKey: z.string(),
        url: z.string(),
      })
    )
    .optional(),
});

export async function GET() {
  try {
    const inspections = await prisma.inspection.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        purchaseOrder: true,
        images: true,
        checks: true,
      },
    });

    return NextResponse.json({ success: true, data: inspections });
  } catch (error: unknown) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inspections.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateInspectionSchema.parse(body);

    const inspection = await prisma.inspection.create({
      data: {
        status: 'DRAFT',
        purchaseOrder: {
          create: {
            orderNumber: validated.orderNumber,
            sku: validated.sku,
            productName: validated.productName || null,
            expectedQuantity: validated.expectedQuantity,
            expectedVariant: validated.expectedVariant || null,
          },
        },
        images: validated.images && validated.images.length > 0
          ? {
              create: validated.images.map((img) => ({
                type: img.type,
                storageKey: img.storageKey,
                url: img.url,
              })),
            }
          : undefined,
      },
      include: {
        purchaseOrder: true,
        images: true,
      },
    });

    return NextResponse.json({ success: true, data: inspection }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    const errMsg = error instanceof Error ? error.message : 'Failed to create inspection.';
    console.error('Error creating inspection:', error);
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
