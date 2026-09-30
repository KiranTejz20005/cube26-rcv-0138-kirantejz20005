import { VisionInspection } from './schemas';

export interface ImageInput {
  id: string;
  url: string;
  type: 'REFERENCE' | 'RECEIVING';
  storageKey: string;
  base64Data?: string; // Optional raw base64 data if available
  mimeType?: string;
}

export interface PurchaseOrderInput {
  orderNumber: string;
  sku: string;
  productName?: string | null;
  expectedQuantity: number;
  expectedVariant?: string | null;
}

export interface InspectionInput {
  inspectionId: string;
  purchaseOrder: PurchaseOrderInput;
  referenceImages: ImageInput[];
  receivingImages: ImageInput[];
}

export interface VisionProvider {
  inspect(input: InspectionInput): Promise<VisionInspection>;
}
