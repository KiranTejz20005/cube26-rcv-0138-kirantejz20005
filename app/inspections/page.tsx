'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  PlusCircle,
  Search,
  Loader2,
} from 'lucide-react';

interface InspectionListItem {
  id: string;
  status: string;
  overallDecision: string | null;
  createdAt: string;
  purchaseOrder: {
    orderNumber: string;
    sku: string;
    productName: string | null;
    expectedQuantity: number;
    expectedVariant: string | null;
  } | null;
  checks: Array<{ status: string }>;
}

export default function InspectionHistoryClientPage() {
  const [inspections, setInspections] = useState<InspectionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadInspections() {
      try {
        const res = await fetch('/api/inspections');
        const data = await res.json();
        if (data.success && data.data) {
          setInspections(data.data);
        }
      } catch (err: unknown) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInspections();
  }, []);

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

  const filteredInspections = inspections.filter((insp) => {
    // Decision filter
    if (filterStatus !== 'ALL' && insp.overallDecision !== filterStatus) {
      return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const poNum = (insp.purchaseOrder?.orderNumber || '').toLowerCase();
      const sku = (insp.purchaseOrder?.sku || '').toLowerCase();
      const prod = (insp.purchaseOrder?.productName || '').toLowerCase();
      return poNum.includes(q) || sku.includes(q) || prod.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-600" />
            Inspection Audit History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete records of processed Purchase Order visual receiving inspections.
          </p>
        </div>

        <Link
          href="/inspections/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Inspection
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1">
          {['ALL', 'PASS', 'EXCEPTION', 'UNCERTAIN'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO or SKU..."
            className="bg-slate-50 border border-slate-300 rounded pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 w-full sm:w-64 font-mono"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-xs">Loading inspection audit records...</p>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-2">
            <PackageCheck className="w-10 h-10 mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-800">No matching inspections found</p>
            <p className="text-xs text-slate-500">Try changing your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">SKU &amp; Product</th>
                  <th className="py-3 px-4">Expected Qty / Var</th>
                  <th className="py-3 px-4">Checks Passed</th>
                  <th className="py-3 px-4">Overall Decision</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredInspections.map((insp) => {
                  const passCount = insp.checks.filter((c) => c.status === 'PASS').length;
                  const totalChecks = insp.checks.length;

                  return (
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
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {totalChecks > 0 ? `${passCount}/${totalChecks} PASS` : '0 checks'}
                      </td>
                      <td className="py-3 px-4">{getDecisionBadge(insp.overallDecision)}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono">
                        {new Date(insp.createdAt).toLocaleDateString()}{' '}
                        {new Date(insp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
