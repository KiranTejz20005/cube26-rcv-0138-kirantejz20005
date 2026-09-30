import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { DEMO_SCENARIOS } from '@/lib/inspection/fixtures';
import { runInspectionPipeline } from '@/lib/inspection/analyzer';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const scenarioId = body.scenarioId as string | undefined;

    // Force DEMO_MODE=true for seed operations
    const originalDemoMode = process.env.DEMO_MODE;
    process.env.DEMO_MODE = 'true';

    const scenariosToRun = scenarioId
      ? DEMO_SCENARIOS.filter((s) => s.id === scenarioId)
      : DEMO_SCENARIOS;

    if (scenariosToRun.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Scenario ID not found' },
        { status: 404 }
      );
    }

    const createdIds: string[] = [];

    for (const scenario of scenariosToRun) {
      const inspection = await prisma.inspection.create({
        data: {
          status: 'DRAFT',
          purchaseOrder: {
            create: {
              orderNumber: scenario.orderNumber,
              sku: scenario.sku,
              productName: scenario.productName,
              expectedQuantity: scenario.expectedQuantity,
              expectedVariant: scenario.expectedVariant,
            },
          },
          images: {
            create: [
              ...scenario.referenceImages.map((img) => ({
                type: 'REFERENCE',
                storageKey: `fixtures/${img.label.replace(/\s+/g, '_')}`,
                url: img.url,
              })),
              ...scenario.receivingImages.map((img) => ({
                type: 'RECEIVING',
                storageKey: `fixtures/${img.label.replace(/\s+/g, '_')}`,
                url: img.url,
              })),
            ],
          },
        },
      });

      await runInspectionPipeline(inspection.id);
      createdIds.push(inspection.id);
    }

    // Restore DEMO_MODE
    process.env.DEMO_MODE = originalDemoMode;

    return NextResponse.json({
      success: true,
      count: createdIds.length,
      inspectionIds: createdIds,
      singleInspectionId: createdIds.length === 1 ? createdIds[0] : undefined,
    });
  } catch (error: unknown) {
    console.error('Seed API error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to execute scenario seed';
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
