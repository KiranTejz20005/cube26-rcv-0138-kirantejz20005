export interface DemoScenario {
  id: string;
  name: string;
  expectedResult: 'PASS' | 'EXCEPTION' | 'UNCERTAIN';
  description: string;
  orderNumber: string;
  sku: string;
  productName: string;
  expectedQuantity: number;
  expectedVariant: string;
  referenceImages: Array<{ url: string; label: string }>;
  receivingImages: Array<{ url: string; label: string }>;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'scenario-1-pass',
    name: '1. Perfect Shipment',
    expectedResult: 'PASS',
    description: 'Exact match on SKU, quantity, variant, zero damage, all components present.',
    orderNumber: 'PO-2026-PASS-01',
    sku: 'BLUE-BOTTLE-001',
    productName: 'Eco-Friendly Steel Water Bottle',
    expectedQuantity: 24,
    expectedVariant: 'Blue',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        label: 'Blue Steel Bottle Spec Sheet',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        label: 'Receiving Dock Case Photo - 24 Units',
      },
    ],
  },
  {
    id: 'scenario-2-short',
    name: '2. Short Quantity & Damaged Carton',
    expectedResult: 'EXCEPTION',
    description: 'Received 22 units out of 24 expected, lower corner of carton crushed.',
    orderNumber: 'PO-2026-SHORT-02',
    sku: 'BLUE-BOTTLE-001',
    productName: 'Eco-Friendly Steel Water Bottle',
    expectedQuantity: 24,
    expectedVariant: 'Blue',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        label: 'Reference Spec Sheet',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
        label: 'Damaged Receiving Box (22 count)',
      },
    ],
  },
  {
    id: 'scenario-3-variant',
    name: '3. Wrong Variant (Red instead of Blue)',
    expectedResult: 'EXCEPTION',
    description: 'Received Red variant bottles while PO expects Blue.',
    orderNumber: 'PO-2026-WRONG_VAR-03',
    sku: 'BLUE-BOTTLE-001',
    productName: 'Eco-Friendly Steel Water Bottle',
    expectedQuantity: 24,
    expectedVariant: 'Blue',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        label: 'Reference Blue Variant',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
        label: 'Receiving Red Variant Shipment',
      },
    ],
  },
  {
    id: 'scenario-4-sku',
    name: '4. Wrong SKU Mismatch',
    expectedResult: 'EXCEPTION',
    description: 'Shipping label states RED-BOTTLE-001 instead of BLUE-BOTTLE-001.',
    orderNumber: 'PO-2026-WRONG_SKU-04',
    sku: 'BLUE-BOTTLE-001',
    productName: 'Eco-Friendly Steel Water Bottle',
    expectedQuantity: 24,
    expectedVariant: 'Blue',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        label: 'Reference SKU Spec',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
        label: 'Scanned Shipping Box (RED-BOTTLE-001)',
      },
    ],
  },
  {
    id: 'scenario-5-uncertain',
    name: '5. Insufficient Visual Evidence',
    expectedResult: 'UNCERTAIN',
    description: 'Blurry barcode, obscured box angle. System refrains from forcing PASS/FAIL.',
    orderNumber: 'PO-2026-UNCERTAIN-05',
    sku: 'BLUE-BOTTLE-001',
    productName: 'Eco-Friendly Steel Water Bottle',
    expectedQuantity: 24,
    expectedVariant: 'Blue',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        label: 'Reference Image',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
        label: 'Blurry / Obscured Shipment Photo',
      },
    ],
  },
  {
    id: 'scenario-6-missing',
    name: '6. Missing Component (No User Manual)',
    expectedResult: 'EXCEPTION',
    description: 'Bottle and packaging present, but user manual/safety key is missing.',
    orderNumber: 'PO-2026-MISSING-06',
    sku: 'BLUE-BOTTLE-001',
    productName: 'Eco-Friendly Steel Water Bottle Kit',
    expectedQuantity: 12,
    expectedVariant: 'Standard Kit',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        label: 'Reference Full Kit View',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        label: 'Kit Box with Empty Manual Slot',
      },
    ],
  },
];
