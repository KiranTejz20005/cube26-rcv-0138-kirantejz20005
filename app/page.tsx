import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { ScenarioSelector } from '@/components/scenario-selector';
import { FormattedDate } from '@/components/formatted-date';
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> PASS
          </span>
        );
      case 'EXCEPTION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> EXCEPTION
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <HelpCircle className="w-3 h-3" /> UNCERTAIN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Receiving Visual Inspection Control
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Perceptual AI extraction paired with deterministic business rules logic.
          </p>
        </div>

        <Link
          href="/inspections/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Inspection
        </Link>
      </div>

      {/* 1-Click Evaluation Presets Bar */}
      <ScenarioSelector directRun={true} />

      {/* Real DB Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Inspections</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 border-l-3 border-l-emerald-600 shadow-2xs">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Passed</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{passCount}</p>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 border-l-3 border-l-rose-600 shadow-2xs">
          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Exceptions</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{exceptionCount}</p>
        </div>

        <div className="bg-white p-4 rounded border border-slate-200 border-l-3 border-l-amber-600 shadow-2xs">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Needs Review</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{uncertainCount}</p>
        </div>
      </div>

      {/* Enforced Principle Banner */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex items-start gap-2.5 shadow-2xs">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-900">Core Principle Enforced:</span> AI observes visual facts; application deterministically decides overall business outcomes. UNCERTAIN status is assigned whenever visual evidence is insufficient, preventing arbitrary AI acceptance or false rejections.
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Recent Shipment Inspections
            </h2>
          </div>
          <Link
            href="/inspections"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {inspections.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-2">
            <PackageCheck className="w-10 h-10 mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-800">No inspections yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first receiving inspection to start verifying shipments against Purchase Orders.
            </p>
            <div className="pt-2">
              <Link
                href="/inspections/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> New Inspection
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">SKU &amp; Product</th>
                  <th className="py-3 px-4">Expected Qty / Var</th>
                  <th className="py-3 px-4">Overall Decision</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {insp.purchaseOrder?.orderNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono">{insp.purchaseOrder?.sku}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {insp.purchaseOrder?.productName || 'Standard Item'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>Qty: <span className="font-bold text-slate-900">{insp.purchaseOrder?.expectedQuantity}</span></div>
                      <div className="text-slate-500">{insp.purchaseOrder?.expectedVariant || 'Default'}</div>
                    </td>
                    <td className="py-3 px-4">{getDecisionBadge(insp.overallDecision)}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <FormattedDate date={insp.createdAt} format="time" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/inspections/${insp.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 transition-colors"
                      >
                        View Report <ArrowRight className="w-3 h-3" />
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
