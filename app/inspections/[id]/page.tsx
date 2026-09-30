import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  ShieldAlert,
  Search,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

export const revalidate = 0;

export default async function InspectionReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const inspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      purchaseOrder: true,
      images: true,
      checks: {
        include: {
          evidence: {
            include: {
              image: true,
            },
          },
        },
      },
    },
  });

  if (!inspection) {
    notFound();
  }

  const po = inspection.purchaseOrder;
  const decision = inspection.overallDecision;

  const getDecisionHeader = () => {
    switch (decision) {
      case 'PASS':
        return {
          title: 'SHIPMENT VERIFIED: PASS',
          subtitle: 'All visual and purchase order checks passed deterministic validation criteria.',
          bg: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 glow-pass',
          badge: 'bg-emerald-500 text-slate-950',
          icon: CheckCircle2,
        };
      case 'EXCEPTION':
        return {
          title: 'SHIPMENT REJECTED: EXCEPTION',
          subtitle: 'One or more deterministic business rule failures were detected. Action required.',
          bg: 'bg-rose-950/40 border-rose-500/40 text-rose-400 glow-exception',
          badge: 'bg-rose-500 text-white',
          icon: AlertTriangle,
        };
      case 'UNCERTAIN':
      default:
        return {
          title: 'VERIFICATION UNCERTAIN: MANUAL REVIEW REQUIRED',
          subtitle:
            'Visual evidence is insufficient to complete deterministic verification. The system refrains from forcing a decision.',
          bg: 'bg-amber-950/40 border-amber-500/40 text-amber-400 glow-uncertain',
          badge: 'bg-amber-500 text-slate-950',
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
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> FAIL
          </span>
        );
      case 'UNCERTAIN':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <HelpCircle className="w-3.5 h-3.5" /> UNCERTAIN
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Back button & top metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Operations Dashboard
        </Link>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            {new Date(inspection.createdAt).toLocaleString()}
          </span>
          <span className="flex items-center gap-1 font-mono">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            ID: {inspection.id}
          </span>
        </div>
      </div>

      {/* OVERALL DECISION BANNER */}
      <div className={`p-6 rounded-2xl border ${headerInfo.bg} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg">
            <HeaderIcon className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider ${headerInfo.badge}`}>
                {decision || 'IN PROGRESS'}
              </span>
              <span className="text-xs font-mono text-slate-400">PO: {po?.orderNumber}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {headerInfo.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {headerInfo.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* PO & INSPECTION COMPARISON SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">PO Reference</p>
          <p className="text-lg font-bold text-white mt-1">{po?.orderNumber}</p>
          <p className="text-xs text-slate-400">{po?.productName || 'Standard Product'}</p>
        </div>

        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Expected SKU &amp; Qty</p>
          <p className="text-lg font-bold text-blue-400 mt-1 font-mono">{po?.sku}</p>
          <p className="text-xs text-slate-300">
            Quantity: <span className="font-bold text-white">{po?.expectedQuantity}</span> | Variant: <span className="font-bold text-white">{po?.expectedVariant || 'Default'}</span>
          </p>
        </div>

        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Engine Status</p>
          <p className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Deterministic Business Rules
          </p>
          <p className="text-xs text-slate-400">Perceptual extraction by Gemini AI</p>
        </div>
      </div>

      {/* CHECKS BREAKDOWN SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            Inspection Parameter Verification Checks
          </h2>
          <span className="text-xs text-slate-400">5 Parameter Audit</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {inspection.checks.map((check) => {
            const confidencePct = Math.round((check.confidence || 1.0) * 100);

            return (
              <div
                key={check.id}
                className={`bg-slate-900/90 rounded-2xl border p-5 transition-all space-y-4 ${
                  check.status === 'FAIL'
                    ? 'border-rose-500/30 bg-rose-950/10'
                    : check.status === 'UNCERTAIN'
                    ? 'border-amber-500/30 bg-amber-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Check Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 text-xs font-mono font-bold tracking-wider">
                      {check.type}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {check.type === 'SKU'
                        ? 'Product Identity & SKU Barcode'
                        : check.type === 'QUANTITY'
                        ? 'Visual Quantity Count'
                        : check.type === 'VARIANT'
                        ? 'Color / Product Variant'
                        : check.type === 'DAMAGE'
                        ? 'Package & Physical Condition'
                        : 'Component Presence Verification'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Confidence Meter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Confidence:</span>
                      <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            confidencePct > 80
                              ? 'bg-emerald-500'
                              : confidencePct > 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${confidencePct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-slate-300">{confidencePct}%</span>
                    </div>

                    {getCheckStatusBadge(check.status)}
                  </div>
                </div>

                {/* Expected vs Observed comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-semibold block mb-1 uppercase text-[10px]">
                      Expected (Purchase Order):
                    </span>
                    <span className="text-sm font-semibold text-slate-200 font-mono">
                      {check.expectedValue}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 font-semibold block mb-1 uppercase text-[10px]">
                      Observed (Visual AI Perception):
                    </span>
                    <span
                      className={`text-sm font-semibold font-mono ${
                        check.status === 'FAIL'
                          ? 'text-rose-400 font-bold'
                          : check.status === 'UNCERTAIN'
                          ? 'text-amber-400 italic'
                          : 'text-emerald-400'
                      }`}
                    >
                      {check.observedValue || 'Unable to determine from evidence'}
                    </span>
                  </div>
                </div>

                {/* Reason Explanation */}
                <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                  <span className="font-bold text-slate-200">Rule Logic Reason: </span>
                  {check.reason}
                </div>

                {/* Evidence items */}
                {check.evidence && check.evidence.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Supporting Visual Evidence Items:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {check.evidence.map((ev) => (
                        <div key={ev.id} className="flex gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 items-center">
                          {ev.image ? (
                            <img
                              src={ev.image.url}
                              alt="Evidence"
                              className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                              <Maximize2 className="w-5 h-5 text-slate-500" />
                            </div>
                          )}
                          <div className="text-xs text-slate-300 leading-snug">
                            <p className="line-clamp-2">{ev.observation}</p>
                            {ev.image && (
                              <span className="text-[10px] text-blue-400 font-mono mt-1 block">
                                Image Ref: {ev.image.type}
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

      {/* VISUAL EVIDENCE IMAGE GALLERY */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-indigo-400" />
          Attached Inspection Photographs ({inspection.images.length})
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {inspection.images.map((img) => (
            <div key={img.id} className="group relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
              <img
                src={img.url}
                alt={img.type}
                className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-2.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {img.type}
                </span>
                <p className="text-[10px] font-mono text-slate-400 truncate mt-1">{img.storageKey}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
