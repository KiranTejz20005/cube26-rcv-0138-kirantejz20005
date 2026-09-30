'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScenarioSelector } from '@/components/scenario-selector';
import { DemoScenario } from '@/lib/inspection/fixtures';
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  X,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Play,
} from 'lucide-react';

interface UploadedImage {
  type: 'REFERENCE' | 'RECEIVING';
  storageKey: string;
  url: string;
}

export default function NewInspectionPage() {
  const router = useRouter();

  // Wizard Step (1: PO Details, 2: Reference Images, 3: Receiving Images, 4: Review)
  const [step, setStep] = useState<number>(1);

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
  const [processingStatus, setProcessingStatus] = useState<string>('QUEUED');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setStep(4); // Jump directly to Review step for instant execution
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'REFERENCE' | 'RECEIVING') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setErrorMsg(null);
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
          setErrorMsg(`Upload failed for ${file.name}: ${data.error || 'Server error'}`);
        }
      }
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setErrorMsg('Network error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepNext = () => {
    if (step === 1) {
      if (!orderNumber.trim() || !sku.trim() || !expectedQuantity || expectedQuantity <= 0) {
        setErrorMsg('Please fill out PO Number, SKU, and a valid Expected Quantity (> 0).');
        return;
      }
    }
    setErrorMsg(null);
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleStepPrev = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !sku || !expectedQuantity) {
      setErrorMsg('Required PO fields are missing.');
      return;
    }

    const recImages = images.filter((i) => i.type === 'RECEIVING');
    if (recImages.length === 0) {
      setErrorMsg('At least one receiving shipment photograph is required to run inspection.');
      setStep(3);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setProcessingStatus('ANALYZING');

    try {
      // 1. Create Inspection record
      const createRes = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          sku: sku.trim(),
          productName: productName.trim() || undefined,
          expectedQuantity: Number(expectedQuantity),
          expectedVariant: expectedVariant.trim() || undefined,
          images,
        }),
      });

      const createData = await createRes.json();
      if (!createData.success || !createData.data) {
        throw new Error(createData.error || 'Failed to create inspection draft.');
      }

      const inspectionId = createData.data.id;

      setProcessingStatus('VALIDATING & COMPARING');

      // 2. Execute AI inspection pipeline
      const inspectRes = await fetch(`/api/inspections/${inspectionId}/inspect`, {
        method: 'POST',
      });

      const inspectData = await inspectRes.json();
      if (!inspectData.success) {
        throw new Error(inspectData.error || 'AI Inspection process failed.');
      }

      setProcessingStatus('COMPLETED');
      router.push(`/inspections/${inspectionId}`);
    } catch (err: unknown) {
      console.error('Inspection submission error:', err);
      const errMsg = err instanceof Error ? err.message : 'Inspection failed. Please check network or GEMINI_API_KEY.';
      setErrorMsg(errMsg);
      setSubmitting(false);
      setProcessingStatus('FAILED');
    }
  };

  const refImages = images.filter((i) => i.type === 'REFERENCE');
  const recImages = images.filter((i) => i.type === 'RECEIVING');

  const wizardSteps = [
    { num: 1, title: 'Purchase Order' },
    { num: 2, title: 'Reference Photos' },
    { num: 3, title: 'Receiving Evidence' },
    { num: 4, title: 'Review & Inspect' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-400" />
          Create Receiving Inspection
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Enter Purchase Order expectations and upload shipment photographs for visual verification.
        </p>
      </div>

      {/* Preset Scenario Selector */}
      <ScenarioSelector onSelectPreset={handleSelectPreset} />

      {/* Step Stepper Indicator */}
      <div className="bg-gray-900 rounded border border-gray-800 p-3 flex items-center justify-between text-xs">
        {wizardSteps.map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => {
              if (s.num < step || (s.num > step && orderNumber && sku && expectedQuantity)) {
                setStep(s.num);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              step === s.num
                ? 'bg-blue-600 text-white font-bold'
                : step > s.num
                ? 'bg-gray-800 text-gray-200 font-semibold'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center border ${
              step === s.num ? 'border-white bg-blue-700' : 'border-gray-700 bg-gray-950'
            }`}>
              {s.num}
            </span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {/* Error Alert Message */}
      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-800 p-3 rounded text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Error: </span>
            {errorMsg}
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Submitting Loading Overlay */}
      {submitting && (
        <div className="bg-gray-900 border border-gray-800 p-8 rounded text-center space-y-4">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-white">Processing Visual Inspection Pipeline</h3>
            <p className="text-xs text-gray-400 mt-1">
              Current Stage: <span className="font-mono text-blue-400 font-bold">{processingStatus}</span>
            </p>
          </div>
          <p className="text-[11px] text-gray-500">
            Analyzing shipment photographs &bull; Zod validation &bull; Deterministic business rules
          </p>
        </div>
      )}

      {!submitting && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: PO DETAILS */}
          {step === 1 && (
            <div className="bg-gray-900 rounded border border-gray-800 p-5 space-y-4">
              <h2 className="text-sm font-bold text-white border-b border-gray-800 pb-2">
                Step 1: Purchase Order Expectations
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    PO Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. PO-2026-001"
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Expected SKU <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. BLUE-BOTTLE-001"
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Eco Stainless Water Bottle"
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">
                      Expected Qty <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={expectedQuantity}
                      onChange={(e) => setExpectedQuantity(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Expected Variant</label>
                    <input
                      type="text"
                      value={expectedVariant}
                      onChange={(e) => setExpectedVariant(e.target.value)}
                      placeholder="e.g. Blue"
                      className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REFERENCE IMAGES */}
          {step === 2 && (
            <div className="bg-gray-900 rounded border border-gray-800 p-5 space-y-4">
              <h2 className="text-sm font-bold text-white border-b border-gray-800 pb-2">
                Step 2: Upload Product Reference Images (Optional)
              </h2>
              <p className="text-xs text-gray-400">
                Upload official product spec sheets, standard packaging photos, or master reference diagrams.
              </p>

              <div className="border border-dashed border-gray-800 hover:border-gray-700 rounded p-6 text-center bg-gray-950/60">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'REFERENCE')}
                  id="ref-upload-file"
                  className="hidden"
                />
                <label htmlFor="ref-upload-file" className="cursor-pointer space-y-2 block">
                  <ImageIcon className="w-8 h-8 text-gray-500 mx-auto" />
                  <span className="text-xs text-blue-400 font-semibold block">Click to upload reference image</span>
                  <span className="text-[10px] text-gray-500 block">PNG, JPG, WebP up to 10MB</span>
                </label>
              </div>

              {/* Reference thumbnails */}
              <div className="flex flex-wrap gap-2 pt-2">
                {refImages.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded border border-gray-800 overflow-hidden bg-gray-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="Ref" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(images.indexOf(img))}
                      className="absolute top-1 right-1 p-0.5 rounded bg-gray-900 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-gray-900 text-[9px] text-center text-gray-400 py-0.5 font-mono">
                      Reference
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: RECEIVING IMAGES */}
          {step === 3 && (
            <div className="bg-gray-900 rounded border border-gray-800 p-5 space-y-4">
              <h2 className="text-sm font-bold text-white border-b border-gray-800 pb-2">
                Step 3: Upload Receiving / Shipment Evidence Photos <span className="text-rose-400">*</span>
              </h2>
              <p className="text-xs text-gray-400">
                Upload photographs of the received shipment carton, barcode shipping label, contents, or damaged packaging.
              </p>

              <div className="border border-dashed border-gray-800 hover:border-gray-700 rounded p-6 text-center bg-gray-950/60">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'RECEIVING')}
                  id="rec-upload-file"
                  className="hidden"
                />
                <label htmlFor="rec-upload-file" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-gray-500 mx-auto" />
                  <span className="text-xs text-blue-400 font-semibold block">Click to upload receiving shipment photo</span>
                  <span className="text-[10px] text-gray-500 block">Box, shipping label, contents photo</span>
                </label>
              </div>

              {/* Receiving thumbnails */}
              <div className="flex flex-wrap gap-2 pt-2">
                {recImages.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded border border-gray-800 overflow-hidden bg-gray-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="Rec" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(images.indexOf(img))}
                      className="absolute top-1 right-1 p-0.5 rounded bg-gray-900 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-gray-950 text-[9px] text-center text-blue-400 py-0.5 font-mono font-bold">
                      Shipment
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === 4 && (
            <div className="bg-gray-900 rounded border border-gray-800 p-5 space-y-5">
              <h2 className="text-sm font-bold text-white border-b border-gray-800 pb-2">
                Step 4: Review Inputs &amp; Confirm Execution
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-gray-950 p-3.5 rounded border border-gray-800 space-y-1.5">
                  <span className="text-gray-500 font-bold uppercase text-[10px] block">PO Expectations:</span>
                  <div><span className="text-gray-400">PO Number:</span> <span className="text-white font-mono font-bold">{orderNumber || 'N/A'}</span></div>
                  <div><span className="text-gray-400">SKU:</span> <span className="text-blue-400 font-mono font-bold">{sku || 'N/A'}</span></div>
                  <div><span className="text-gray-400">Product:</span> <span className="text-gray-200">{productName || 'Standard Item'}</span></div>
                  <div><span className="text-gray-400">Expected Quantity:</span> <span className="text-white font-bold">{expectedQuantity}</span></div>
                  <div><span className="text-gray-400">Expected Variant:</span> <span className="text-white">{expectedVariant || 'Standard'}</span></div>
                </div>

                <div className="bg-gray-950 p-3.5 rounded border border-gray-800 space-y-2">
                  <span className="text-gray-500 font-bold uppercase text-[10px] block">Attached Images:</span>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Reference Specs:</span>
                    <span className="font-mono font-bold text-white">{refImages.length} images</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Shipment Evidence:</span>
                    <span className="font-mono font-bold text-blue-400">{recImages.length} images</span>
                  </div>
                  {recImages.length === 0 && (
                    <p className="text-rose-400 text-[11px] mt-1">
                      ⚠️ Warning: At least 1 receiving photo is required.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleStepPrev}
                className="flex items-center gap-1 px-4 py-2 rounded text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleStepNext}
                className="flex items-center gap-1 px-5 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                Run AI Inspection Engine
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
