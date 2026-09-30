import { VisionInspection } from '../ai/schemas';
import { PurchaseOrderInput } from '../ai/provider';

export type CheckStatus = 'PASS' | 'FAIL' | 'UNCERTAIN';
export type CheckType = 'SKU' | 'QUANTITY' | 'VARIANT' | 'DAMAGE' | 'COMPONENTS';
export type OverallDecision = 'PASS' | 'EXCEPTION' | 'UNCERTAIN';

export interface EvidenceReference {
  imageId: string;
  observation: string;
}

export interface CheckResult {
  type: CheckType;
  status: CheckStatus;
  expectedValue: string;
  observedValue: string | null;
  confidence: number;
  reason: string;
  evidence: EvidenceReference[];
}

export interface DecisionEngineResult {
  overallDecision: OverallDecision;
  checks: CheckResult[];
}

export function evaluateInspection(
  purchaseOrder: PurchaseOrderInput,
  vision: VisionInspection
): DecisionEngineResult {
  const checks: CheckResult[] = [];

  // Helper to extract evidence for a specific field
  const getFieldEvidence = (field: string): EvidenceReference[] => {
    return vision.evidence
      .filter((e) => e.field.toLowerCase() === field.toLowerCase())
      .map((e) => ({ imageId: e.imageId, observation: e.observation }));
  };

  // Helper to check uncertainty reasons
  const getUncertaintyReason = (field: string): string | null => {
    const found = vision.uncertainty.find((u) => u.field.toLowerCase() === field.toLowerCase());
    return found ? found.reason : null;
  };

  // 1. SKU CHECK
  const expectedSku = (purchaseOrder.sku || '').trim();
  const observedSku = vision.product.observedSku ? vision.product.observedSku.trim() : null;
  const skuConfidence = vision.product.confidence ?? 1.0;
  const skuEvidence = getFieldEvidence('product');
  const skuUncertainty = getUncertaintyReason('product');

  if (observedSku === null || skuConfidence < 0.5) {
    checks.push({
      type: 'SKU',
      status: 'UNCERTAIN',
      expectedValue: expectedSku,
      observedValue: observedSku,
      confidence: skuConfidence,
      reason: skuUncertainty || 'Observed SKU could not be clearly identified from visual evidence.',
      evidence: skuEvidence,
    });
  } else if (observedSku.toLowerCase() === expectedSku.toLowerCase()) {
    checks.push({
      type: 'SKU',
      status: 'PASS',
      expectedValue: expectedSku,
      observedValue: observedSku,
      confidence: skuConfidence,
      reason: `Observed SKU "${observedSku}" matches expected PO SKU.`,
      evidence: skuEvidence,
    });
  } else {
    checks.push({
      type: 'SKU',
      status: 'FAIL',
      expectedValue: expectedSku,
      observedValue: observedSku,
      confidence: skuConfidence,
      reason: `Observed SKU "${observedSku}" does not match expected PO SKU "${expectedSku}".`,
      evidence: skuEvidence,
    });
  }

  // 2. QUANTITY CHECK
  const expectedQty = purchaseOrder.expectedQuantity;
  const observedQty = vision.quantity.observed;
  const qtyConfidence = vision.quantity.confidence ?? 1.0;
  const qtyEvidence = getFieldEvidence('quantity');
  const qtyUncertainty = getUncertaintyReason('quantity');

  if (observedQty === null || qtyConfidence < 0.5) {
    checks.push({
      type: 'QUANTITY',
      status: 'UNCERTAIN',
      expectedValue: String(expectedQty),
      observedValue: observedQty !== null ? String(observedQty) : null,
      confidence: qtyConfidence,
      reason: qtyUncertainty || 'Shipment quantity could not be reliably counted from visual evidence.',
      evidence: qtyEvidence,
    });
  } else if (observedQty === expectedQty) {
    checks.push({
      type: 'QUANTITY',
      status: 'PASS',
      expectedValue: String(expectedQty),
      observedValue: String(observedQty),
      confidence: qtyConfidence,
      reason: `Observed quantity (${observedQty}) matches expected PO quantity (${expectedQty}).`,
      evidence: qtyEvidence,
    });
  } else {
    checks.push({
      type: 'QUANTITY',
      status: 'FAIL',
      expectedValue: String(expectedQty),
      observedValue: String(observedQty),
      confidence: qtyConfidence,
      reason: `Observed quantity (${observedQty}) differs from expected PO quantity (${expectedQty}).`,
      evidence: qtyEvidence,
    });
  }

  // 3. VARIANT CHECK
  const expectedVariant = (purchaseOrder.expectedVariant || '').trim();
  const observedVariant = vision.variant.observed ? vision.variant.observed.trim() : null;
  const variantConfidence = vision.variant.confidence ?? 1.0;
  const variantEvidence = getFieldEvidence('variant');
  const variantUncertainty = getUncertaintyReason('variant');

  if (!expectedVariant) {
    // If PO did not specify a variant requirement
    checks.push({
      type: 'VARIANT',
      status: 'PASS',
      expectedValue: 'N/A',
      observedValue: observedVariant || 'Standard',
      confidence: 1.0,
      reason: 'No specific product variant specified in PO.',
      evidence: variantEvidence,
    });
  } else if (observedVariant === null || variantConfidence < 0.5) {
    checks.push({
      type: 'VARIANT',
      status: 'UNCERTAIN',
      expectedValue: expectedVariant,
      observedValue: observedVariant,
      confidence: variantConfidence,
      reason: variantUncertainty || 'Visual evidence is insufficient to confirm product variant.',
      evidence: variantEvidence,
    });
  } else if (observedVariant.toLowerCase() === expectedVariant.toLowerCase()) {
    checks.push({
      type: 'VARIANT',
      status: 'PASS',
      expectedValue: expectedVariant,
      observedValue: observedVariant,
      confidence: variantConfidence,
      reason: `Observed variant "${observedVariant}" matches expected PO variant "${expectedVariant}".`,
      evidence: variantEvidence,
    });
  } else {
    checks.push({
      type: 'VARIANT',
      status: 'FAIL',
      expectedValue: expectedVariant,
      observedValue: observedVariant,
      confidence: variantConfidence,
      reason: `Observed variant "${observedVariant}" does not match expected PO variant "${expectedVariant}".`,
      evidence: variantEvidence,
    });
  }

  // 4. DAMAGE CHECK
  const isDamaged = vision.condition.damaged;
  const damageTypes = vision.condition.damageTypes || [];
  const conditionConfidence = vision.condition.confidence ?? 1.0;
  const damageEvidence = getFieldEvidence('condition');
  const conditionUncertainty = getUncertaintyReason('condition');

  if (isDamaged === null || conditionConfidence < 0.5) {
    checks.push({
      type: 'DAMAGE',
      status: 'UNCERTAIN',
      expectedValue: 'Intact Packaging',
      observedValue: 'Unclear / Obscured',
      confidence: conditionConfidence,
      reason: conditionUncertainty || 'Packaging condition cannot be fully verified from available image evidence.',
      evidence: damageEvidence,
    });
  } else if (isDamaged || damageTypes.length > 0) {
    const damageDesc = damageTypes.length > 0 ? damageTypes.join(', ') : 'Physical packaging damage';
    checks.push({
      type: 'DAMAGE',
      status: 'FAIL',
      expectedValue: 'Intact Packaging',
      observedValue: `Damaged (${damageDesc})`,
      confidence: conditionConfidence,
      reason: `Visible physical damage detected: ${damageDesc}.`,
      evidence: damageEvidence,
    });
  } else {
    checks.push({
      type: 'DAMAGE',
      status: 'PASS',
      expectedValue: 'Intact Packaging',
      observedValue: 'Intact / No visible damage',
      confidence: conditionConfidence,
      reason: 'No visible damage detected on package or product.',
      evidence: damageEvidence,
    });
  }

  // 5. COMPONENTS CHECK
  const missingComponents = vision.components.missing || [];
  const compConfidence = vision.components.confidence ?? 1.0;
  const compEvidence = getFieldEvidence('components');
  const compUncertainty = getUncertaintyReason('components');

  if (compConfidence < 0.5) {
    checks.push({
      type: 'COMPONENTS',
      status: 'UNCERTAIN',
      expectedValue: 'All Standard Components',
      observedValue: 'Uncertain',
      confidence: compConfidence,
      reason: compUncertainty || 'Visual evidence cannot establish full component presence.',
      evidence: compEvidence,
    });
  } else if (missingComponents.length > 0) {
    checks.push({
      type: 'COMPONENTS',
      status: 'FAIL',
      expectedValue: 'All Standard Components',
      observedValue: `Missing: ${missingComponents.join(', ')}`,
      confidence: compConfidence,
      reason: `Visually missing components detected: ${missingComponents.join(', ')}.`,
      evidence: compEvidence,
    });
  } else {
    checks.push({
      type: 'COMPONENTS',
      status: 'PASS',
      expectedValue: 'All Standard Components',
      observedValue: 'All components present',
      confidence: compConfidence,
      reason: 'All visible required components appear present.',
      evidence: compEvidence,
    });
  }

  // OVERALL DECISION LOGIC (Requirement 12)
  // If any check status is FAIL -> EXCEPTION
  // Else if any check status is UNCERTAIN -> UNCERTAIN
  // Else -> PASS
  let overallDecision: OverallDecision = 'PASS';
  const hasFail = checks.some((c) => c.status === 'FAIL');
  const hasUncertain = checks.some((c) => c.status === 'UNCERTAIN');

  if (hasFail) {
    overallDecision = 'EXCEPTION';
  } else if (hasUncertain) {
    overallDecision = 'UNCERTAIN';
  }

  return {
    overallDecision,
    checks,
  };
}
