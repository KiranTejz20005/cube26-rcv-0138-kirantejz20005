import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { ScenarioSelector } from '@/components/scenario-selector';
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Boxes,
} from 'lucide-react';

export const revalidate = 0;

export default async function DashboardPage() {
  const inspections = await prisma.inspection.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      purchaseOrder: true,
      checks: true,
    },
    take: 20,
  });

  const totalCount = inspections.length;
  const passCount = inspections.filter((i) => i.overallDecision === 'PASS').length;
  const exceptionCount = inspections.filter((i) => i.overallDecision === 'EXCEPTION').length;
  const uncertainCount = inspections.filter((i) => i.overallDecision === 'UNCERTAIN').length;

  const getDecisionBadge = (decision: string | null) => {
    switch (decision) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> PASS
          </span>
        );
      case 'EXCEPTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> EXCEPTION
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <HelpCircle className="w-3.5 h-3.5" /> UNCERTAIN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4" /> Warehouse Operations Control
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Receiving Visual Inspection Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            AI-powered perceptual observation paired with deterministic business rules.
          </p>
        </div>

        <Link
          href="/inspections/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Create Inspection
        </Link>
      </div>

      {/* Evaluation Test Scenarios Quick Runner */}
      <ScenarioSelector directRun={true} />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stats */}
        <div className="glass-card p-5 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase">Total Inspections</p>
            <p className="text-3xl font-extrabold text-white mt-1">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-between justify-center text-slate-300">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        {/* PASS Stats */}
        <div className="glass-card p-5 rounded-xl flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-xs font-medium text-emerald-400 uppercase">PASS</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-1">{passCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* EXCEPTION Stats */}
        <div className="glass-card p-5 rounded-xl flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-xs font-medium text-rose-400 uppercase">EXCEPTION</p>
            <p className="text-3xl font-extrabold text-rose-400 mt-1">{exceptionCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* UNCERTAIN Stats */}
        <div className="glass-card p-5 rounded-xl flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs font-medium text-amber-400 uppercase">UNCERTAIN</p>
            <p className="text-3xl font-extrabold text-amber-400 mt-1">{uncertainCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <HelpCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Architectural Guarantee Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-white">Core Principle Enforced:</span> AI observes visual facts; application deterministically decides overall business outcomes. UNCERTAIN status is assigned whenever visual evidence is insufficient, preventing arbitrary AI acceptance or false rejections.
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Recent Shipment Inspections
            </h2>
            <p className="text-xs text-slate-400">Live feed of processed visual inspections</p>
          </div>
          <Link
            href="/inspections"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View All History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {inspections.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <PackageCheck className="w-12 h-12 mx-auto text-slate-600" />
            <p className="text-sm font-medium">No inspections created yet.</p>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Click &quot;Create Inspection&quot; or run one of the evaluation test scenarios above to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">PO Number</th>
                  <th className="py-3.5 px-5">SKU & Product</th>
                  <th className="py-3.5 px-5">Expected Qty / Var</th>
                  <th className="py-3.5 px-5">Overall Decision</th>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-5 font-mono text-xs font-semibold text-slate-200">
                      {insp.purchaseOrder?.orderNumber || 'N/A'}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white">{insp.purchaseOrder?.sku}</div>
                      <div className="text-xs text-slate-400 truncate max-w-xs">
                        {insp.purchaseOrder?.productName || 'Standard Item'}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-xs text-slate-300">
                      <div>Qty: {insp.purchaseOrder?.expectedQuantity}</div>
                      <div className="text-slate-400">{insp.purchaseOrder?.expectedVariant || 'Default'}</div>
                    </td>
                    <td className="py-4 px-5">{getDecisionBadge(insp.overallDecision)}</td>
                    <td className="py-4 px-5 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(insp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/inspections/${insp.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all"
                      >
                        View Report <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
