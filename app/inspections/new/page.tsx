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
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-blue-600" />
          Create Receiving Inspection
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter Purchase Order expectations and upload shipment photographs for visual verification.
        </p>
      </div>

      {/* Preset Scenario Selector */}
      <ScenarioSelector onSelectPreset={handleSelectPreset} />

      {/* Step Stepper Indicator */}
      <div className="bg-white rounded border border-slate-200 p-3 flex items-center justify-between text-xs shadow-2xs">
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
                ? 'bg-slate-100 text-slate-800 font-semibold border border-slate-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center border ${
              step === s.num ? 'border-white bg-blue-700' : 'border-slate-300 bg-slate-50'
            }`}>
              {s.num}
            </span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {/* Error Alert Message */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Error: </span>
            {errorMsg}
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Submitting Loading Overlay */}
      {submitting && (
        <div className="bg-white border border-slate-200 p-8 rounded text-center space-y-4 shadow-2xs">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Processing Visual Inspection Pipeline</h3>
            <p className="text-xs text-slate-500 mt-1">
              Current Stage: <span className="font-mono text-blue-600 font-bold">{processingStatus}</span>
            </p>
          </div>
          <p className="text-[11px] text-slate-500">
            Analyzing shipment photographs &bull; Zod validation &bull; Deterministic business rules
          </p>
        </div>
      )}

      {!submitting && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: PO DETAILS */}
          {step === 1 && (
            <div className="bg-white rounded border border-slate-200 p-5 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Step 1: Purchase Order Expectations
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PO Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. PO-2026-001"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected SKU <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. BLUE-BOTTLE-001"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Eco Stainless Water Bottle"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Expected Qty <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={expectedQuantity}
                      onChange={(e) => setExpectedQuantity(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Variant</label>
                    <input
                      type="text"
                      value={expectedVariant}
                      onChange={(e) => setExpectedVariant(e.target.value)}
                      placeholder="e.g. Blue"
                      className="w-full bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REFERENCE IMAGES */}
          {step === 2 && (
            <div className="bg-white rounded border border-slate-200 p-5 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Step 2: Upload Product Reference Images (Optional)
              </h2>
              <p className="text-xs text-slate-500">
                Upload official product spec sheets, standard packaging photos, or master reference diagrams.
              </p>

              <div className="border border-dashed border-slate-300 hover:border-slate-400 rounded p-6 text-center bg-slate-50">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'REFERENCE')}
                  id="ref-upload-file"
                  className="hidden"
                />
                <label htmlFor="ref-upload-file" className="cursor-pointer space-y-2 block">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                  <span className="text-xs text-blue-600 font-bold block">Click to upload reference image</span>
                  <span className="text-[10px] text-slate-500 block">PNG, JPG, WebP up to 10MB</span>
                </label>
              </div>

              {/* Reference thumbnails */}
              <div className="flex flex-wrap gap-2 pt-2">
                {refImages.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded border border-slate-200 overflow-hidden bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="Ref" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(images.indexOf(img))}
                      className="absolute top-1 right-1 p-0.5 rounded bg-white text-rose-600 hover:bg-rose-600 hover:text-white border border-slate-200 shadow-2xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-slate-100 text-[9px] text-center text-slate-700 py-0.5 font-mono font-medium border-t border-slate-200">
                      Reference
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: RECEIVING IMAGES */}
          {step === 3 && (
            <div className="bg-white rounded border border-slate-200 p-5 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Step 3: Upload Receiving / Shipment Evidence Photos <span className="text-rose-600">*</span>
              </h2>
              <p className="text-xs text-slate-500">
                Upload photographs of the received shipment carton, barcode shipping label, contents, or damaged packaging.
              </p>

              <div className="border border-dashed border-slate-300 hover:border-slate-400 rounded p-6 text-center bg-slate-50">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'RECEIVING')}
                  id="rec-upload-file"
                  className="hidden"
                />
                <label htmlFor="rec-upload-file" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <span className="text-xs text-blue-600 font-bold block">Click to upload receiving shipment photo</span>
                  <span className="text-[10px] text-slate-500 block">Box, shipping label, contents photo</span>
                </label>
              </div>

              {/* Receiving thumbnails */}
              <div className="flex flex-wrap gap-2 pt-2">
                {recImages.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded border border-slate-200 overflow-hidden bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="Rec" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(images.indexOf(img))}
                      className="absolute top-1 right-1 p-0.5 rounded bg-white text-rose-600 hover:bg-rose-600 hover:text-white border border-slate-200 shadow-2xs transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-blue-50 text-[9px] text-center text-blue-700 py-0.5 font-mono font-bold border-t border-blue-200">
                      Shipment
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === 4 && (
            <div className="bg-white rounded border border-slate-200 p-5 space-y-5 shadow-2xs">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Step 4: Review Inputs &amp; Confirm Execution
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-1.5">
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">PO Expectations:</span>
                  <div><span className="text-slate-600">PO Number:</span> <span className="text-slate-900 font-mono font-bold">{orderNumber || 'N/A'}</span></div>
                  <div><span className="text-slate-600">SKU:</span> <span className="text-blue-700 font-mono font-bold">{sku || 'N/A'}</span></div>
                  <div><span className="text-slate-600">Product:</span> <span className="text-slate-800">{productName || 'Standard Item'}</span></div>
                  <div><span className="text-slate-600">Expected Quantity:</span> <span className="text-slate-900 font-bold">{expectedQuantity}</span></div>
                  <div><span className="text-slate-600">Expected Variant:</span> <span className="text-slate-900">{expectedVariant || 'Standard'}</span></div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded border border-slate-200 space-y-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px] block">Attached Images:</span>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Reference Specs:</span>
                    <span className="font-mono font-bold text-slate-900">{refImages.length} images</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Shipment Evidence:</span>
                    <span className="font-mono font-bold text-blue-700">{recImages.length} images</span>
                  </div>
                  {recImages.length === 0 && (
                    <p className="text-rose-600 text-[11px] font-semibold mt-1">
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
                className="flex items-center gap-1 px-4 py-2 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Step
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleStepNext}
                className="flex items-center gap-1 px-5 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex items-center gap-2 px-6 py-2.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors disabled:opacity-50"
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
