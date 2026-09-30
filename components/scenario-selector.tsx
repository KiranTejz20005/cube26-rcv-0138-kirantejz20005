'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_SCENARIOS, DemoScenario } from '@/lib/inspection/fixtures';
import { Play, CheckCircle2, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

interface ScenarioSelectorProps {
  onSelectPreset?: (scenario: DemoScenario) => void;
  directRun?: boolean;
}

export function ScenarioSelector({ onSelectPreset, directRun = false }: ScenarioSelectorProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRunScenario = async (scenario: DemoScenario) => {
    if (onSelectPreset && !directRun) {
      onSelectPreset(scenario);
      return;
    }

    setLoadingId(scenario.id);
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenario.id }),
      });

      const data = await res.json();
      if (data.success && data.singleInspectionId) {
        router.push(`/inspections/${data.singleInspectionId}`);
      } else {
        alert('Failed to trigger scenario execution.');
      }
    } catch (err) {
      console.error('Scenario error:', err);
      alert('Error triggering scenario.');
    } finally {
      setLoadingId(null);
    }
  };

  const getResultBadge = (result: 'PASS' | 'EXCEPTION' | 'UNCERTAIN') => {
    switch (result) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> PASS
          </span>
        );
      case 'EXCEPTION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> EXCEPTION
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <HelpCircle className="w-3 h-3" /> UNCERTAIN
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded border border-slate-200 p-4 mb-6 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
            Evaluation Test Scenarios (1-Click Presets)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Instantly run or prefill any of the 6 visual receiving inspection test cases.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {DEMO_SCENARIOS.map((scenario) => {
          const isLoading = loadingId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => handleRunScenario(scenario)}
              disabled={isLoading}
              className="text-left p-3 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {scenario.name}
                  </span>
                  {getResultBadge(scenario.expectedResult)}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono text-slate-600">{scenario.orderNumber}</span>
                <span className="text-blue-600 font-semibold flex items-center gap-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Running...
                    </>
                  ) : directRun ? (
                    'Run Test →'
                  ) : (
                    'Load Preset →'
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
