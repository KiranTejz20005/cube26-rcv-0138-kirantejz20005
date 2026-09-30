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
    name: '1. Verified Clean Pass (DeWALT Cordless Drill Kit)',
    expectedResult: 'PASS',
    description: 'Exact match on SKU, quantity (10), variant, intact packaging, all components present.',
    orderNumber: 'PO-2026-PASS-01',
    sku: 'DEWALT-20V-DRILL',
    productName: 'DeWALT 20V MAX Cordless Drill Combo Kit',
    expectedQuantity: 10,
    expectedVariant: 'Yellow/Black',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
        label: 'DeWALT 20V Drill Kit Reference Sheet',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80',
        label: 'Receiving Dock Case Photo - 10 Master Units',
      },
    ],
  },
  {
    id: 'scenario-2-pass',
    name: '2. Verified Clean Pass (Sony Wireless Headphones)',
    expectedResult: 'PASS',
    description: '100% verification on Sony headphones. Intact master case, correct SKU and quantity.',
    orderNumber: 'PO-2026-PASS-02',
    sku: 'SONY-WH1000XM5',
    productName: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    expectedQuantity: 15,
    expectedVariant: 'Black',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        label: 'Sony WH-1000XM5 Spec Reference',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        label: 'Receiving Dock Photo - 15 Sealed Units',
      },
    ],
  },
  {
    id: 'scenario-3-short',
    name: '3. Short Quantity & Crushed Box (Storage Crates)',
    expectedResult: 'EXCEPTION',
    description: 'Received 16 crates out of 20 expected, lower corner of master shipping box crushed.',
    orderNumber: 'PO-2026-SHORT-03',
    sku: 'CRATE-HEAVY-50L',
    productName: 'Heavy-Duty Industrial Storage Crates 50L',
    expectedQuantity: 20,
    expectedVariant: 'Dark Grey',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
        label: 'Reference Crate Specification',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
        label: 'Damaged Master Box (Count 16/20)',
      },
    ],
  },
  {
    id: 'scenario-4-sku',
    name: '4. SKU Mismatch (Logitech Ergonomic Mouse)',
    expectedResult: 'EXCEPTION',
    description: 'Scanned shipping barcode states LOGI-MX-ANYWHERE instead of expected LOGI-MX-MASTER3.',
    orderNumber: 'PO-2026-WRONG_SKU-04',
    sku: 'LOGI-MX-MASTER3',
    productName: 'Logitech MX Master 3S Wireless Mouse',
    expectedQuantity: 12,
    expectedVariant: 'Graphite',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
        label: 'Reference MX Master 3S Spec',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
        label: 'Scanned Shipping Label (LOGI-MX-ANYWHERE)',
      },
    ],
  },
  {
    id: 'scenario-5-uncertain',
    name: '5. Insufficient Visual Evidence (Safety Helmets)',
    expectedResult: 'UNCERTAIN',
    description: 'Blurry camera focus, label obscured. System refrains from forcing PASS/FAIL decision.',
    orderNumber: 'PO-2026-UNCERTAIN-05',
    sku: 'SAFETY-HELMET-PRO',
    productName: 'Industrial Construction Safety Helmet',
    expectedQuantity: 30,
    expectedVariant: 'Yellow',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
        label: 'Safety Helmet Spec Sheet',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
        label: 'Blurry / Obscured Shipment Photo',
      },
    ],
  },
  {
    id: 'scenario-6-missing',
    name: '6. Missing Component (Flask & Accessories Kit)',
    expectedResult: 'EXCEPTION',
    description: 'Travel flask and outer sleeve present, but cleaning brush and carrying strap are missing.',
    orderNumber: 'PO-2026-MISSING-06',
    sku: 'HYDRO-FLASK-KIT',
    productName: 'Stainless Steel Insulated Travel Flask Kit',
    expectedQuantity: 8,
    expectedVariant: 'Silver Kit',
    referenceImages: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        label: 'Reference Full Kit Layout',
      },
    ],
    receivingImages: [
      {
        url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
        label: 'Kit Packaging with Empty Accessory Slots',
      },
    ],
  },
];
