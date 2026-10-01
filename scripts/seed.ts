import { prisma } from '../lib/db/prisma';
import { DEMO_SCENARIOS } from '../lib/inspection/fixtures';
import { runInspectionPipeline } from '../lib/inspection/analyzer';

async function main() {
  console.log('🌱 Seeding database with Receiving Manager scenarios...');

  // Set DEMO_MODE=true for seeding execution
  process.env.DEMO_MODE = 'true';

  for (const scenario of DEMO_SCENARIOS) {
    console.log(`Processing scenario: ${scenario.name}...`);

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
    console.log(`✓ Completed ${scenario.id} -> Inspection ID: ${inspection.id}`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
