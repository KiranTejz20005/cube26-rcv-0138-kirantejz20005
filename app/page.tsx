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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> PASS
          </span>
        );
      case 'EXCEPTION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800">
            <AlertTriangle className="w-3 h-3" /> EXCEPTION
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
            <HelpCircle className="w-3 h-3" /> UNCERTAIN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-gray-800 text-gray-400 border border-gray-700">
            DRAFT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-900 p-5 rounded border border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-white">
            Receiving Visual Inspection Control
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Perceptual AI extraction paired with deterministic business rules logic.
          </p>
        </div>

        <Link
          href="/inspections/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Inspection
        </Link>
      </div>

      {/* 1-Click Evaluation Presets Bar */}
      <ScenarioSelector directRun={true} />

      {/* Real DB Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-900 p-4 rounded border border-gray-800">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Inspections</p>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
        </div>

        <div className="bg-gray-900 p-4 rounded border border-gray-800 border-l-2 border-l-emerald-500">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Passed</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{passCount}</p>
        </div>

        <div className="bg-gray-900 p-4 rounded border border-gray-800 border-l-2 border-l-rose-500">
          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Exceptions</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{exceptionCount}</p>
        </div>

        <div className="bg-gray-900 p-4 rounded border border-gray-800 border-l-2 border-l-amber-500">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Needs Review</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{uncertainCount}</p>
        </div>
      </div>

      {/* Enforced Principle Banner */}
      <div className="bg-gray-900 border border-gray-800 rounded p-3.5 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-300 leading-relaxed">
          <span className="font-semibold text-white">Core Principle Enforced:</span> AI observes visual facts; application deterministically decides overall business outcomes. UNCERTAIN status is assigned whenever visual evidence is insufficient, preventing arbitrary AI acceptance or false rejections.
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="bg-gray-900 rounded border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Recent Shipment Inspections
            </h2>
          </div>
          <Link
            href="/inspections"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {inspections.length === 0 ? (
          <div className="p-10 text-center text-gray-400 space-y-2">
            <PackageCheck className="w-10 h-10 mx-auto text-gray-600" />
            <p className="text-sm font-bold text-gray-200">No inspections yet</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Create your first receiving inspection to start verifying shipments against Purchase Orders.
            </p>
            <div className="pt-2">
              <Link
                href="/inspections/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-blue-600 text-white hover:bg-blue-500"
              >
                <PlusCircle className="w-3.5 h-3.5" /> New Inspection
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-950 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">SKU &amp; Product</th>
                  <th className="py-3 px-4">Expected Qty / Var</th>
                  <th className="py-3 px-4">Overall Decision</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {inspections.map((insp) => (
                  <tr key={insp.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-200">
                      {insp.purchaseOrder?.orderNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white font-mono">{insp.purchaseOrder?.sku}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-xs">
                        {insp.purchaseOrder?.productName || 'Standard Item'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      <div>Qty: <span className="font-bold text-white">{insp.purchaseOrder?.expectedQuantity}</span></div>
                      <div className="text-gray-400">{insp.purchaseOrder?.expectedVariant || 'Default'}</div>
                    </td>
                    <td className="py-3 px-4">{getDecisionBadge(insp.overallDecision)}</td>
                    <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                      {new Date(insp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/inspections/${insp.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-gray-800 px-2.5 py-1 rounded border border-gray-700 transition-colors"
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
