import { describe, it, expect } from 'vitest';
import { evaluateInspection } from '../lib/inspection/decision-engine';
import { VisionInspection } from '../lib/ai/schemas';
import { PurchaseOrderInput } from '../lib/ai/provider';

describe('Deterministic Decision Engine', () => {
  const basePO: PurchaseOrderInput = {
    orderNumber: 'PO-2026-001',
    sku: 'BLUE-BOTTLE-001',
    productName: 'Blue Premium Water Bottle',
    expectedQuantity: 24,
    expectedVariant: 'Blue',
  };

  it('Scenario 1: Correct shipment yields PASS overall', () => {
    const vision: VisionInspection = {
      product: { observedSku: 'BLUE-BOTTLE-001', confidence: 0.99 },
      quantity: { observed: 24, confidence: 0.98 },
      variant: { observed: 'Blue', confidence: 0.95 },
      condition: { damaged: false, damageTypes: [], confidence: 0.98 },
      components: { missing: [], confidence: 0.95 },
      evidence: [
        { imageId: 'img_rec_1', observation: 'Barcode label matches BLUE-BOTTLE-001', field: 'product' },
        { imageId: 'img_rec_1', observation: 'Counted 24 units in master case', field: 'quantity' },
      ],
      uncertainty: [],
    };

    const result = evaluateInspection(basePO, vision);

    expect(result.overallDecision).toBe('PASS');
    expect(result.checks.find((c) => c.type === 'SKU')?.status).toBe('PASS');
    expect(result.checks.find((c) => c.type === 'QUANTITY')?.status).toBe('PASS');
    expect(result.checks.find((c) => c.type === 'VARIANT')?.status).toBe('PASS');
    expect(result.checks.find((c) => c.type === 'DAMAGE')?.status).toBe('PASS');
    expect(result.checks.find((c) => c.type === 'COMPONENTS')?.status).toBe('PASS');
  });

  it('Scenario 2: Short shipment & crushed carton yields EXCEPTION', () => {
    const vision: VisionInspection = {
      product: { observedSku: 'BLUE-BOTTLE-001', confidence: 0.98 },
      quantity: { observed: 22, confidence: 0.95 }, // 22 observed vs 24 expected
      variant: { observed: 'Blue', confidence: 0.92 },
      condition: { damaged: true, damageTypes: ['crushed_carton_corner'], confidence: 0.96 },
      components: { missing: [], confidence: 0.95 },
      evidence: [
        { imageId: 'img_rec_1', observation: '22 units observed instead of 24', field: 'quantity' },
        { imageId: 'img_rec_1', observation: 'Crushed corner on outer box', field: 'condition' },
      ],
      uncertainty: [],
    };

    const result = evaluateInspection(basePO, vision);

    expect(result.overallDecision).toBe('EXCEPTION');
    expect(result.checks.find((c) => c.type === 'QUANTITY')?.status).toBe('FAIL');
    expect(result.checks.find((c) => c.type === 'DAMAGE')?.status).toBe('FAIL');
    expect(result.checks.find((c) => c.type === 'SKU')?.status).toBe('PASS');
  });

  it('Scenario 3: Wrong variant yields EXCEPTION', () => {
    const vision: VisionInspection = {
      product: { observedSku: 'BLUE-BOTTLE-001', confidence: 0.96 },
      quantity: { observed: 24, confidence: 0.95 },
      variant: { observed: 'Red', confidence: 0.93 }, // Red observed vs Blue expected
      condition: { damaged: false, damageTypes: [], confidence: 0.95 },
      components: { missing: [], confidence: 0.95 },
      evidence: [
        { imageId: 'img_rec_1', observation: 'Observed color is Red', field: 'variant' },
      ],
      uncertainty: [],
    };

    const result = evaluateInspection(basePO, vision);

    expect(result.overallDecision).toBe('EXCEPTION');
    expect(result.checks.find((c) => c.type === 'VARIANT')?.status).toBe('FAIL');
  });

  it('Scenario 4: Wrong SKU yields EXCEPTION', () => {
    const vision: VisionInspection = {
      product: { observedSku: 'RED-BOTTLE-001', confidence: 0.98 }, // Wrong SKU
      quantity: { observed: 24, confidence: 0.95 },
      variant: { observed: 'Red', confidence: 0.9 },
      condition: { damaged: false, damageTypes: [], confidence: 0.95 },
      components: { missing: [], confidence: 0.95 },
      evidence: [
        { imageId: 'img_rec_1', observation: 'Shipping label states RED-BOTTLE-001', field: 'product' },
      ],
      uncertainty: [],
    };

    const result = evaluateInspection(basePO, vision);

    expect(result.overallDecision).toBe('EXCEPTION');
    expect(result.checks.find((c) => c.type === 'SKU')?.status).toBe('FAIL');
  });

  it('Scenario 5: Insufficient evidence yields UNCERTAIN overall', () => {
    const vision: VisionInspection = {
      product: { observedSku: null, confidence: 0.3 },
      quantity: { observed: null, confidence: 0.2 },
      variant: { observed: null, confidence: 0.3 },
      condition: { damaged: null, damageTypes: [], confidence: 0.4 },
      components: { missing: [], confidence: 0.3 },
      evidence: [],
      uncertainty: [
        { field: 'product', reason: 'Barcode label out of focus and unreadable.' },
        { field: 'quantity', reason: 'Master carton sealed, contents invisible.' },
      ],
    };

    const result = evaluateInspection(basePO, vision);

    expect(result.overallDecision).toBe('UNCERTAIN');
    expect(result.checks.find((c) => c.type === 'SKU')?.status).toBe('UNCERTAIN');
    expect(result.checks.find((c) => c.type === 'QUANTITY')?.status).toBe('UNCERTAIN');
  });

  it('Scenario 6: Missing component yields EXCEPTION', () => {
    const vision: VisionInspection = {
      product: { observedSku: 'BLUE-BOTTLE-001', confidence: 0.95 },
      quantity: { observed: 24, confidence: 0.92 },
      variant: { observed: 'Blue', confidence: 0.9 },
      condition: { damaged: false, damageTypes: [], confidence: 0.95 },
      components: { missing: ['User Manual'], confidence: 0.94 },
      evidence: [
        { imageId: 'img_rec_1', observation: 'User manual slot empty', field: 'components' },
      ],
      uncertainty: [],
    };

    const result = evaluateInspection(basePO, vision);

    expect(result.overallDecision).toBe('EXCEPTION');
    expect(result.checks.find((c) => c.type === 'COMPONENTS')?.status).toBe('FAIL');
  });
});
