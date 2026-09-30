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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> PASS
          </span>
        );
      case 'EXCEPTION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> EXCEPTION
          </span>
        );
      case 'UNCERTAIN':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <HelpCircle className="w-3 h-3" /> UNCERTAIN
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-blue-400 fill-blue-400" />
            Evaluation Test Scenarios (1-Click Presets)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Instantly run or prefill any of the 6 core visual receiving inspection evaluation cases.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEMO_SCENARIOS.map((scenario) => {
          const isLoading = loadingId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => handleRunScenario(scenario)}
              disabled={isLoading}
              className="text-left p-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">
                    {scenario.name}
                  </span>
                  {getResultBadge(scenario.expectedResult)}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-slate-400">{scenario.orderNumber}</span>
                <span className="text-blue-400 group-hover:underline flex items-center gap-1 font-medium">
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
