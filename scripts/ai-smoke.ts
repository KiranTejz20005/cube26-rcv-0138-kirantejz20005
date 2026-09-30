import path from 'path';
import fs from 'fs/promises';
import { runVisionInspection } from '../lib/ai';

async function main() {
  console.log('--- RECEIVING MANAGER AI MULTIMODAL SMOKE TEST ---');

  const demoMode = (process.env.DEMO_MODE || '').toLowerCase() === 'true';
  console.log(`DEMO_MODE: ${demoMode}`);
  console.log(`NVIDIA_API_KEY: ${process.env.NVIDIA_API_KEY ? 'CONFIGURED' : 'NOT SET'}`);
  console.log(`GROQ_API_KEY: ${process.env.GROQ_API_KEY ? 'CONFIGURED' : 'NOT SET'}`);
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'NOT SET'}`);

  // Create a minimal test image buffer if public/uploads directory has no images
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });

  const testImagePath = path.join(uploadDir, 'smoke-test-sample.png');
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  try {
    await fs.writeFile(testImagePath, Buffer.from(samplePngBase64, 'base64'));
  } catch (err) {
    console.warn('Could not write smoke test sample file:', err);
  }

  const startTime = Date.now();
  console.log('\nExecuting Vision Inspection Pipeline...');

  try {
    const result = await runVisionInspection({
      inspectionId: 'smoke-test-001',
      purchaseOrder: {
        orderNumber: 'PO-SMOKE-001',
        sku: 'BLUE-BOTTLE-001',
        productName: 'Eco Steel Bottle',
        expectedQuantity: 24,
        expectedVariant: 'Blue',
      },
      referenceImages: [],
      receivingImages: [
        {
          id: 'img-smoke-1',
          url: '/uploads/smoke-test-sample.png',
          type: 'RECEIVING',
          storageKey: 'uploads/smoke-test-sample.png',
        },
      ],
    });

    const latency = Date.now() - startTime;
    console.log('\n✔ SMOKE TEST SUCCESSFUL!');
    console.log(`Provider Used: ${result.providerName}`);
    console.log(`Model Used:    ${result.providerModel}`);
    console.log(`Attempt Chain: ${result.attemptedProviders.join(' -> ')}`);
    console.log(`Latency:       ${latency} ms`);
    console.log('\nObservation Output:');
    console.log(JSON.stringify(result.observation, null, 2));
  } catch (err: unknown) {
    const latency = Date.now() - startTime;
    console.error('\n✖ SMOKE TEST FAILED');
    console.error(`Latency: ${latency} ms`);
    console.error('Error Details:', err instanceof Error ? err.message : String(err));
  }
}

main();
