import { prisma } from '../db/prisma';
import { runVisionInspection } from '../ai';
import { InspectionInput, ImageInput } from '../ai/provider';
import { evaluateInspection } from './decision-engine';

export async function runInspectionPipeline(inspectionId: string) {
  // 1. Fetch inspection with relations from DB
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    include: {
      purchaseOrder: true,
      images: true,
    },
  });

  if (!inspection || !inspection.purchaseOrder) {
    throw new Error(`Inspection ${inspectionId} or associated Purchase Order not found.`);
  }

  // Update status to PROCESSING
  await prisma.inspection.update({
    where: { id: inspectionId },
    data: { status: 'PROCESSING' },
  });

  try {
    const po = inspection.purchaseOrder;

    const referenceImages: ImageInput[] = inspection.images
      .filter((i) => i.type === 'REFERENCE')
      .map((i) => ({
        id: i.id,
        url: i.url,
        type: 'REFERENCE',
        storageKey: i.storageKey,
      }));

    const receivingImages: ImageInput[] = inspection.images
      .filter((i) => i.type === 'RECEIVING')
      .map((i) => ({
        id: i.id,
        url: i.url,
        type: 'RECEIVING',
        storageKey: i.storageKey,
      }));

    const input: InspectionInput = {
      inspectionId,
      purchaseOrder: {
        orderNumber: po.orderNumber,
        sku: po.sku,
        productName: po.productName,
        expectedQuantity: po.expectedQuantity,
        expectedVariant: po.expectedVariant,
      },
      referenceImages,
      receivingImages,
    };

    // 2. Call AI Vision Provider Orchestrator (NVIDIA -> Groq -> Gemini -> Demo)
    const visionResult = await runVisionInspection(input);
    const visionObservation = visionResult.observation;

    // 3. Evaluate with Deterministic Decision Engine
    const decisionResult = evaluateInspection(input.purchaseOrder, visionObservation);

    // 4. Persist result into database within a transaction
    await prisma.$transaction(async (tx) => {
      // Clear any prior checks/evidence for retry runs
      await tx.inspectionEvidence.deleteMany({
        where: { check: { inspectionId } },
      });
      await tx.inspectionCheck.deleteMany({
        where: { inspectionId },
      });

      // Save checks & evidence
      for (const check of decisionResult.checks) {
        const createdCheck = await tx.inspectionCheck.create({
          data: {
            inspectionId,
            type: check.type,
            status: check.status,
            expectedValue: check.expectedValue,
            observedValue: check.observedValue,
            confidence: check.confidence,
            reason: check.reason,
          },
        });

        if (check.evidence && check.evidence.length > 0) {
          for (const ev of check.evidence) {
            // Find corresponding image by exact ID
            let matchingImg = inspection.images.find((img) => img.id === ev.imageId);

            // Fallback matching by index or type if AI returned relative identifier like "img-0"
            if (!matchingImg && inspection.images.length > 0) {
              const digitMatch = (ev.imageId || '').match(/\d+/);
              if (digitMatch) {
                const idx = parseInt(digitMatch[0], 10);
                if (idx >= 0 && idx < inspection.images.length) {
                  matchingImg = inspection.images[idx];
                }
              }
              if (!matchingImg) {
                matchingImg = inspection.images.find((img) => img.type === 'RECEIVING') || inspection.images[0];
              }
            }

            await tx.inspectionEvidence.create({
              data: {
                checkId: createdCheck.id,
                imageId: matchingImg ? matchingImg.id : null,
                observation: ev.observation,
              },
            });
          }
        }
      }

      // Update Inspection overall status, decision, and provider metadata
      await tx.inspection.update({
        where: { id: inspectionId },
        data: {
          status: 'COMPLETED',
          overallDecision: decisionResult.overallDecision,
          aiProvider: visionResult.providerName,
          aiModel: visionResult.providerModel,
        },
      });
    });

    return {
      success: true,
      inspectionId,
      overallDecision: decisionResult.overallDecision,
      aiProvider: visionResult.providerName,
      aiModel: visionResult.providerModel,
      checks: decisionResult.checks,
    };
  } catch (error: unknown) {
    console.error(`Inspection pipeline failed for ${inspectionId}:`, error);

    await prisma.inspection.update({
      where: { id: inspectionId },
      data: { status: 'FAILED' },
    });

    throw error;
  }
}
