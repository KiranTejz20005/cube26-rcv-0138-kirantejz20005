'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ImageModal } from '@/components/image-modal';
import { FormattedDate } from '@/components/formatted-date';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  Maximize2,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface InspectionData {
  id: string;
  status: string;
  overallDecision: string | null;
  aiProvider?: string | null;
  aiModel?: string | null;
  createdAt: string;
  updatedAt: string;
  purchaseOrder: {
    orderNumber: string;
    sku: string;
    productName: string | null;
    expectedQuantity: number;
    expectedVariant: string | null;
  } | null;
  images: Array<{
    id: string;
    type: 'REFERENCE' | 'RECEIVING';
    storageKey: string;
    url: string;
  }>;
  checks: Array<{
    id: string;
    type: 'SKU' | 'QUANTITY' | 'VARIANT' | 'DAMAGE' | 'COMPONENTS';
    status: 'PASS' | 'FAIL' | 'UNCERTAIN';
    expectedValue: string;
    observedValue: string | null;
    confidence: number;
    reason: string;
    evidence: Array<{
      id: string;
      observation: string;
      image: {
        id: string;
        url: string;
        type: string;
      } | null;
    }>;
  }>;
}

export default function InspectionReportClientPage() {
  const params = useParams();
  const id = params.id as string;

  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Image Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch(`/api/inspections/${id}`);
        const data = await res.json();
        if (isMounted) {
          if (data.success && data.data) {
            setInspection(data.data);
          } else {
            setErrorMsg('Inspection record not found.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Fetch error:', err);
          setErrorMsg('Failed to load inspection details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleRetryInspect = async () => {
    setRetrying(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/inspections/${id}/inspect`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        const getRes = await fetch(`/api/inspections/${id}`);
        const getData = await getRes.json();
        if (getData.success && getData.data) {
          setInspection(getData.data);
        }
      } else {
        setErrorMsg(`Retry failed: ${data.error || 'Server error'}`);
      }
    } catch (err: unknown) {
      console.error('Retry error:', err);
      setErrorMsg('Error retrying inspection.');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading inspection audit record...</p>
      </div>
    );
  }

  if (!inspection || !inspection.purchaseOrder) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Inspection Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested inspection ID &quot;{id}&quot; does not exist.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const po = inspection.purchaseOrder;
  const decision = inspection.overallDecision;

  const getDecisionHeader = () => {
    switch (decision) {
      case 'PASS':
        return {
          title: 'SHIPMENT VERIFIED: PASS',
          subtitle: 'All visual and purchase order checks passed deterministic validation criteria.',
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badge: 'bg-emerald-600 text-white',
          icon: CheckCircle2,
        };
      case 'EXCEPTION':
        return {
          title: 'SHIPMENT REJECTED: EXCEPTION',
          subtitle: 'One or more deterministic business rule failures were detected. Action required.',
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          badge: 'bg-rose-600 text-white',
          icon: AlertTriangle,
        };
      case 'UNCERTAIN':
      default:
        return {
          title: 'VERIFICATION UNCERTAIN: MANUAL REVIEW REQUIRED',
          subtitle:
            'Visual evidence is insufficient to complete deterministic verification. System refrains from forcing a decision.',
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          badge: 'bg-amber-600 text-white',
          icon: HelpCircle,
        };
    }
  };

  const headerInfo = getDecisionHeader();
  const HeaderIcon = headerInfo.icon;

  const getCheckStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3" /> FAIL
          </span>
        );
      case 'UNCERTAIN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3 h-3" /> UNCERTAIN
          </span>
        );
    }
  };

  const allGalleryImages = inspection.images.map((img) => ({
    url: img.url,
    label: `${img.type} - ${img.storageKey}`,
  }));

  const openImageModal = (url: string) => {
    const idx = allGalleryImages.findIndex((i) => i.url === url);
    setModalIndex(idx >= 0 ? idx : 0);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Back button & top metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <FormattedDate date={inspection.createdAt} format="full" />
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            ID: {inspection.id}
          </span>
        </div>
      </div>

      {/* OVERALL DECISION BANNER */}
      <div className={`p-5 rounded border ${headerInfo.bg} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs`}>
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded bg-white border border-slate-200 shadow-2xs">
            <HeaderIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${headerInfo.badge}`}>
                {decision || 'IN PROGRESS'}
              </span>
              <span className="text-xs font-mono text-slate-700 font-bold">PO: {po.orderNumber}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-1">{headerInfo.title}</h1>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{headerInfo.subtitle}</p>
          </div>
        </div>

        {/* Retry / Pipeline Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRetryInspect}
            disabled={retrying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Re-analyzing...' : 'Re-run Engine'}
          </button>
        </div>
      </div>

      {/* Error Alert if retry failed */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 p-3 rounded text-xs text-rose-800 flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* PO SPECIFICATIONS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-bold uppercase text-[10px] block">PO Reference</span>
          <span className="text-sm font-bold text-slate-900 block mt-0.5 font-mono">{po.orderNumber}</span>
          <span className="text-slate-500 block truncate">{po.productName || 'Standard Item'}</span>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-bold uppercase text-[10px] block">Expected SKU &amp; Quantity</span>
          <span className="text-sm font-bold text-blue-700 block mt-0.5 font-mono">{po.sku}</span>
          <span className="text-slate-700 block">
            Quantity: <span className="font-bold text-slate-900">{po.expectedQuantity}</span> | Variant: <span className="font-bold text-slate-900">{po.expectedVariant || 'Default'}</span>
          </span>
        </div>

        <div className="bg-white p-3.5 rounded border border-slate-200 shadow-2xs">
          <span className="text-slate-500 font-bold uppercase text-[10px] block">Verification Engine &amp; AI Provider</span>
          <span className="text-xs font-bold text-emerald-700 block mt-0.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Deterministic Rules + {inspection.aiProvider || 'Vision AI'}
          </span>
          <span className="text-slate-500 block truncate text-[11px] font-mono mt-0.5">
            Model: {inspection.aiModel || 'Multimodal Observation Engine'}
          </span>
        </div>
      </div>

      {/* PARAMETER CHECKS COMPARISON TABLE */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          5-Parameter Inspection Audit
        </h2>

        <div className="space-y-3">
          {inspection.checks.map((check) => {
            const confidencePct = Math.round((check.confidence || 1.0) * 100);

            return (
              <div
                key={check.id}
                className={`bg-white rounded border p-4 space-y-3 shadow-2xs ${
                  check.status === 'FAIL'
                    ? 'border-rose-300 bg-rose-50/40'
                    : check.status === 'UNCERTAIN'
                    ? 'border-amber-300 bg-amber-50/40'
                    : 'border-slate-200'
                }`}
              >
                {/* Header line */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] font-bold border border-slate-200">
                      {check.type}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {check.type === 'SKU'
                        ? 'Product Identity / SKU'
                        : check.type === 'QUANTITY'
                        ? 'Quantity Count'
                        : check.type === 'VARIANT'
                        ? 'Variant / Color'
                        : check.type === 'DAMAGE'
                        ? 'Packaging Condition'
                        : 'Component Presence'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Confidence: <span className="font-bold text-slate-800">{confidencePct}%</span>
                    </span>
                    {getCheckStatusBadge(check.status)}
                  </div>
                </div>

                {/* Expected vs Observed Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Expected (PO):</span>
                    <span className="font-mono font-semibold text-slate-800">{check.expectedValue}</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-slate-500 font-bold uppercase text-[10px] block">Observed (AI):</span>
                    <span
                      className={`font-mono font-semibold ${
                        check.status === 'FAIL'
                          ? 'text-rose-700 font-bold'
                          : check.status === 'UNCERTAIN'
                          ? 'text-amber-700 italic'
                          : 'text-emerald-700'
                      }`}
                    >
                      {check.observedValue || 'Unable to determine'}
                    </span>
                  </div>
                </div>

                {/* Rule explanation */}
                <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="font-bold text-slate-900">Rule Logic Reason: </span>
                  {check.reason}
                </div>

                {/* Evidence References */}
                {check.evidence && check.evidence.length > 0 && (
                  <div className="pt-1 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-blue-700 block mb-2">
                      Supporting Evidence Items:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {check.evidence.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => ev.image && openImageModal(ev.image.url)}
                          className="flex items-center gap-2.5 bg-slate-50 p-2 rounded border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                        >
                          {ev.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={ev.image.url}
                              alt="Evidence thumbnail"
                              className="w-12 h-12 object-cover rounded border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                              <Maximize2 className="w-4 h-4" />
                            </div>
                          )}
                          <div className="text-[11px] text-slate-700 leading-snug">
                            <p className="line-clamp-2">{ev.observation}</p>
                            {ev.image && (
                              <span className="text-[9px] text-blue-600 font-mono font-semibold block mt-0.5">
                                Click to enlarge
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ATTACHED INSPECTION PHOTOGRAPHS GALLERY */}
      <div className="bg-white rounded border border-slate-200 p-4 space-y-3 shadow-2xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Maximize2 className="w-4 h-4 text-slate-500" />
          Attached Inspection Photographs ({inspection.images.length})
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {inspection.images.map((img) => (
            <div
              key={img.id}
              onClick={() => openImageModal(img.url)}
              className="group relative bg-slate-50 rounded overflow-hidden border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.type}
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-x-0 bottom-0 bg-white/95 p-1.5 border-t border-slate-200">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  {img.type}
                </span>
                <p className="text-[9px] font-mono text-slate-500 truncate mt-0.5">{img.storageKey}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full-screen Image Viewer Modal */}
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        images={allGalleryImages}
        currentIndex={modalIndex}
        onIndexChange={setModalIndex}
      />
    </div>
  );
}
