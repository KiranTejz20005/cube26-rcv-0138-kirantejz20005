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
      } catch (err) {
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-400" />
            Inspection Audit History
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Complete records of processed Purchase Order visual receiving inspections.
          </p>
        </div>

        <Link
          href="/inspections/new"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Inspection
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-gray-900 rounded border border-gray-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1">
          {['ALL', 'PASS', 'EXCEPTION', 'UNCERTAIN'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO or SKU..."
            className="bg-gray-950 border border-gray-800 rounded pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 w-full sm:w-64 font-mono"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-gray-900 rounded border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-400" />
            <p className="text-xs">Loading inspection audit records...</p>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="p-10 text-center text-gray-400 space-y-2">
            <PackageCheck className="w-10 h-10 mx-auto text-gray-600" />
            <p className="text-sm font-bold text-gray-200">No matching inspections found</p>
            <p className="text-xs text-gray-500">Try changing your search query or status filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-950 text-[10px] uppercase font-bold text-gray-400 border-b border-gray-800">
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
              <tbody className="divide-y divide-gray-800">
                {filteredInspections.map((insp) => {
                  const passCount = insp.checks.filter((c) => c.status === 'PASS').length;
                  const totalChecks = insp.checks.length;

                  return (
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
                      <td className="py-3 px-4 font-mono text-gray-300">
                        {totalChecks > 0 ? `${passCount}/${totalChecks} PASS` : '0 checks'}
                      </td>
                      <td className="py-3 px-4">{getDecisionBadge(insp.overallDecision)}</td>
                      <td className="py-3 px-4 text-gray-400 whitespace-nowrap font-mono">
                        {new Date(insp.createdAt).toLocaleDateString()}{' '}
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
