import { VisionProvider, InspectionInput } from '../provider';
import { VisionInspection } from '../schemas';

export class DemoVisionProvider implements VisionProvider {
  readonly name = 'Demo';
  readonly model = 'deterministic-mock-v1';

  async inspect(input: InspectionInput): Promise<VisionInspection> {
    const { purchaseOrder, receivingImages } = input;

    // Simulate realistic AI inspection latency (800ms) for smooth UX feedback
    await new Promise((resolve) => setTimeout(resolve, 800));

    const skuUpper = (purchaseOrder.sku || '').toUpperCase();
    const poNum = (purchaseOrder.orderNumber || '').toUpperCase();
    const variantUpper = (purchaseOrder.expectedVariant || '').toLowerCase();
    const receivingImgId = receivingImages[0]?.id || 'img_rec_01';

    // Scenario 5: Insufficient evidence scenario check (PO number contains BLURRY / UNCERTAIN / INSIGNIFICANT)
    if (poNum.includes('UNCERTAIN') || poNum.includes('BLURRY') || skuUpper.includes('BLUR')) {
      return {
        product: {
          observedSku: null,
          confidence: 0.35,
        },
        quantity: {
          observed: null,
          confidence: 0.2,
        },
        variant: {
          observed: null,
          confidence: 0.3,
        },
        condition: {
          damaged: null,
          damageTypes: [],
          confidence: 0.4,
        },
        components: {
          missing: [],
          confidence: 0.3,
        },
        evidence: [
          {
            imageId: receivingImgId,
            observation: 'Visual evidence is blurry and low resolution. Barcode text is out of focus.',
            field: 'product',
          },
        ],
        uncertainty: [
          {
            field: 'product',
            reason: 'The barcode label on the receiving box is out of focus and unreadable.',
          },
          {
            field: 'quantity',
            reason: 'Shipment box is closed and sealed. Individual item units cannot be visually counted.',
          },
          {
            field: 'variant',
            reason: 'Lighting conditions and packaging cover obscure the color variant.',
          },
          {
            field: 'condition',
            reason: 'Rear side of carton is obscured from camera view.',
          },
        ],
      };
    }

    // Scenario 6: Missing component check (PO contains MISSING or COMPONENT)
    if (poNum.includes('MISSING') || skuUpper.includes('COMPONENT') || skuUpper.includes('KIT')) {
      return {
        product: {
          observedSku: purchaseOrder.sku,
          confidence: 0.95,
        },
        quantity: {
          observed: purchaseOrder.expectedQuantity,
          confidence: 0.92,
        },
        variant: {
          observed: purchaseOrder.expectedVariant || 'Default',
          confidence: 0.9,
        },
        condition: {
          damaged: false,
          damageTypes: [],
          confidence: 0.95,
        },
        components: {
          missing: ['Cleaning Brush', 'Carrying Strap'],
          confidence: 0.94,
        },
        evidence: [
          {
            imageId: receivingImgId,
            observation: 'Product container present, but cleaning brush and carrying strap slots in insert are empty.',
            field: 'components',
          },
        ],
        uncertainty: [],
      };
    }

    // Scenario 4: Wrong SKU check (PO contains WRONG_SKU or MISMATCH)
    if (poNum.includes('WRONG_SKU') || skuUpper.includes('MISMATCH')) {
      return {
        product: {
          observedSku: 'LOGI-MX-ANYWHERE',
          confidence: 0.98,
        },
        quantity: {
          observed: purchaseOrder.expectedQuantity,
          confidence: 0.95,
        },
        variant: {
          observed: purchaseOrder.expectedVariant || 'Graphite',
          confidence: 0.9,
        },
        condition: {
          damaged: false,
          damageTypes: [],
          confidence: 0.95,
        },
        components: {
          missing: [],
          confidence: 0.95,
        },
        evidence: [
          {
            imageId: receivingImgId,
            observation: 'Scanned shipping label reads LOGI-MX-ANYWHERE instead of expected LOGI-MX-MASTER3.',
            field: 'product',
          },
        ],
        uncertainty: [],
      };
    }

    // Scenario 3: Wrong variant check (PO contains WRONG_VAR or VARIANT)
    if (poNum.includes('WRONG_VAR') || (variantUpper === 'blue' && poNum.includes('RED'))) {
      return {
        product: {
          observedSku: purchaseOrder.sku,
          confidence: 0.96,
        },
        quantity: {
          observed: purchaseOrder.expectedQuantity,
          confidence: 0.95,
        },
        variant: {
          observed: 'Red',
          confidence: 0.93,
        },
        condition: {
          damaged: false,
          damageTypes: [],
          confidence: 0.95,
        },
        components: {
          missing: [],
          confidence: 0.95,
        },
        evidence: [
          {
            imageId: receivingImgId,
            observation: 'Product color visible through transparent carton window is Red, whereas PO expects Blue.',
            field: 'variant',
          },
        ],
        uncertainty: [],
      };
    }

    // Scenario 2: Short quantity + Damaged carton (PO contains SHORT or DAMAGE)
    if (poNum.includes('SHORT') || poNum.includes('DAMAGE')) {
      const observedCount = Math.max(1, purchaseOrder.expectedQuantity - 4);
      return {
        product: {
          observedSku: purchaseOrder.sku,
          confidence: 0.98,
        },
        quantity: {
          observed: observedCount,
          confidence: 0.95,
        },
        variant: {
          observed: purchaseOrder.expectedVariant || 'Dark Grey',
          confidence: 0.92,
        },
        condition: {
          damaged: true,
          damageTypes: ['crushed_carton_corner'],
          confidence: 0.96,
        },
        components: {
          missing: [],
          confidence: 0.95,
        },
        evidence: [
          {
            imageId: receivingImgId,
            observation: `Counted ${observedCount} units in master case (expected ${purchaseOrder.expectedQuantity}).`,
            field: 'quantity',
          },
          {
            imageId: receivingImgId,
            observation: 'Lower-right corner of outer shipping carton is visibly crushed and torn.',
            field: 'condition',
          },
        ],
        uncertainty: [],
      };
    }

    // Scenario 1 & Default: PERFECT MATCH / PASS
    return {
      product: {
        observedSku: purchaseOrder.sku,
        confidence: 0.99,
      },
      quantity: {
        observed: purchaseOrder.expectedQuantity,
        confidence: 0.97,
      },
      variant: {
        observed: purchaseOrder.expectedVariant || 'Standard',
        confidence: 0.95,
      },
      condition: {
        damaged: false,
        damageTypes: [],
        confidence: 0.98,
      },
      components: {
        missing: [],
        confidence: 0.96,
      },
      evidence: [
        {
          imageId: receivingImgId,
          observation: `Label matches SKU ${purchaseOrder.sku} perfectly.`,
          field: 'product',
        },
        {
          imageId: receivingImgId,
          observation: `Counted exactly ${purchaseOrder.expectedQuantity} units in full master case.`,
          field: 'quantity',
        },
        {
          imageId: receivingImgId,
          observation: 'Carton packaging intact with zero visible damage or tearing.',
          field: 'condition',
        },
      ],
      uncertainty: [],
    };
  }
}
