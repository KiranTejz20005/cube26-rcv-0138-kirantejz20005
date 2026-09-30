import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  PlusCircle,
  Search,
} from 'lucide-react';

export const revalidate = 0;

export default async function InspectionHistoryPage() {
  const inspections = await prisma.inspection.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      purchaseOrder: true,
      checks: true,
    },
  });

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-blue-400" />
            Receiving Inspection History
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete audit trail of all processed purchase order visual receiving inspections.
          </p>
        </div>

        <Link
          href="/inspections/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Inspection
        </Link>
      </div>

      {/* History Table Card */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden">
        {inspections.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <PackageCheck className="w-12 h-12 mx-auto text-slate-600" />
            <p className="text-sm font-medium">No receiving inspections recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">PO Number</th>
                  <th className="py-3.5 px-5">SKU &amp; Product</th>
                  <th className="py-3.5 px-5">Expected Qty / Var</th>
                  <th className="py-3.5 px-5">Checks Summary</th>
                  <th className="py-3.5 px-5">Overall Decision</th>
                  <th className="py-3.5 px-5">Created At</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inspections.map((insp) => {
                  const passCount = insp.checks.filter((c) => c.status === 'PASS').length;
                  const totalChecks = insp.checks.length;

                  return (
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
                      <td className="py-4 px-5 text-xs font-mono text-slate-300">
                        {totalChecks > 0 ? `${passCount}/${totalChecks} PASS` : '0 checks'}
                      </td>
                      <td className="py-4 px-5">{getDecisionBadge(insp.overallDecision)}</td>
                      <td className="py-4 px-5 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(insp.createdAt).toLocaleDateString()}{' '}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
