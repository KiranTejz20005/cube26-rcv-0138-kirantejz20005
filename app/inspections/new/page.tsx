'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScenarioSelector } from '@/components/scenario-selector';
import { DemoScenario } from '@/lib/inspection/fixtures';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  X,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

interface UploadedImage {
  type: 'REFERENCE' | 'RECEIVING';
  storageKey: string;
  url: string;
}

export default function NewInspectionPage() {
  const router = useRouter();

  // Form State
  const [orderNumber, setOrderNumber] = useState('');
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [expectedQuantity, setExpectedQuantity] = useState<number>(24);
  const [expectedVariant, setExpectedVariant] = useState('');

  // Images state
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-fill from preset scenario selector
  const handleSelectPreset = (scenario: DemoScenario) => {
    setOrderNumber(scenario.orderNumber);
    setSku(scenario.sku);
    setProductName(scenario.productName);
    setExpectedQuantity(scenario.expectedQuantity);
    setExpectedVariant(scenario.expectedVariant);

    const presetImages: UploadedImage[] = [
      ...scenario.referenceImages.map((img) => ({
        type: 'REFERENCE' as const,
        storageKey: `fixtures/${img.label.replace(/\s+/g, '_')}`,
        url: img.url,
      })),
      ...scenario.receivingImages.map((img) => ({
        type: 'RECEIVING' as const,
        storageKey: `fixtures/${img.label.replace(/\s+/g, '_')}`,
        url: img.url,
      })),
    ];
    setImages(presetImages);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'REFERENCE' | 'RECEIVING') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const res = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.data) {
          setImages((prev) => [
            ...prev,
            {
              type,
              storageKey: data.data.storageKey,
              url: data.data.url,
            },
          ]);
        } else {
          alert(`Failed to upload image: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !sku || !expectedQuantity) {
      alert('Please fill out all required PO fields.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Inspection record
      const createRes = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          sku,
          productName,
          expectedQuantity: Number(expectedQuantity),
          expectedVariant,
          images,
        }),
      });

      const createData = await createRes.json();
      if (!createData.success || !createData.data) {
        throw new Error(createData.error || 'Failed to create inspection.');
      }

      const inspectionId = createData.data.id;

      // 2. Start AI inspection pipeline immediately
      const inspectRes = await fetch(`/api/inspections/${inspectionId}/inspect`, {
        method: 'POST',
      });

      const inspectData = await inspectRes.json();
      if (!inspectData.success) {
        throw new Error(inspectData.error || 'Inspection pipeline failed.');
      }

      // 3. Navigate to report page
      router.push(`/inspections/${inspectionId}`);
    } catch (err: any) {
      console.error('Inspection submit failed:', err);
      alert(err.message || 'Error processing inspection.');
      setSubmitting(false);
    }
  };

  const refImages = images.filter((i) => i.type === 'REFERENCE');
  const recImages = images.filter((i) => i.type === 'RECEIVING');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileCheck className="w-6 h-6 text-blue-400" />
          Create New Receiving Inspection
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Enter Purchase Order details and upload shipment photos for AI visual verification.
        </p>
      </div>

      {/* Preset Scenario Quick-Fill */}
      <ScenarioSelector onSelectPreset={handleSelectPreset} />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO Form Card */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            1. Purchase Order Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                PO Number <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. PO-2026-8812"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Expected SKU <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. BLUE-BOTTLE-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name (Optional)</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Eco-Friendly Steel Water Bottle"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Expected Qty <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expectedQuantity}
                  onChange={(e) => setExpectedQuantity(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Variant / Color</label>
                <input
                  type="text"
                  value={expectedVariant}
                  onChange={(e) => setExpectedVariant(e.target.value)}
                  placeholder="e.g. Blue"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Uploads Card */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-6">
          <h2 className="text-base font-semibold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>2. Visual Evidence &amp; Shipment Uploads</span>
            {uploading && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading image...
              </span>
            )}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Reference / Product Spec Images */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Product Reference / Spec Sheet Images
              </label>

              <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-4 text-center transition-colors bg-slate-950/40">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'REFERENCE')}
                  id="ref-upload"
                  className="hidden"
                />
                <label htmlFor="ref-upload" className="cursor-pointer space-y-2 block">
                  <ImageIcon className="w-8 h-8 text-slate-500 mx-auto" />
                  <span className="text-xs text-blue-400 font-semibold block">Click to upload reference image</span>
                  <span className="text-[11px] text-slate-500 block">PNG, JPG, WebP up to 10MB</span>
                </label>
              </div>

              {/* Reference thumbnails */}
              <div className="flex flex-wrap gap-2">
                {refImages.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-lg border border-slate-700 overflow-hidden">
                    <img src={img.url} alt="Ref" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(images.indexOf(img))}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/80 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/90 text-[9px] text-center text-slate-300 py-0.5 truncate px-1">
                      Reference
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Receiving / Shipment Photos */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Receiving Shipment Photographs <span className="text-rose-400">*</span>
              </label>

              <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-xl p-4 text-center transition-colors bg-slate-950/40">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'RECEIVING')}
                  id="rec-upload"
                  className="hidden"
                />
                <label htmlFor="rec-upload" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                  <span className="text-xs text-blue-400 font-semibold block">Click to upload shipment photo</span>
                  <span className="text-[11px] text-slate-500 block">Box, barcode label, contents photo</span>
                </label>
              </div>

              {/* Receiving thumbnails */}
              <div className="flex flex-wrap gap-2">
                {recImages.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-lg border border-slate-700 overflow-hidden">
                    <img src={img.url} alt="Rec" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(images.indexOf(img))}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/80 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-blue-950/90 text-[9px] text-center text-blue-300 py-0.5 truncate px-1 font-semibold">
                      Shipment
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting || uploading}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Executing AI Visual Pipeline...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-blue-200" />
                Inspect Shipment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
