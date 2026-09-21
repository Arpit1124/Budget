import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { currentScenario, applyDemoScenario, resetDemoData } = useApp();

  const scenarios = [
    { id: 'NORMAL', label: 'Default Baseline' },
    { id: 'SCENARIO_1_LOW_UTILIZATION', label: 'Scenario 1: Low Budget Utilization (Jal Shakti)' },
    { id: 'SCENARIO_2_OVERSPENDING_ALERT', label: 'Scenario 2: Overspending Trajectory (Highways)' },
    { id: 'SCENARIO_3_PROGRESS_MISMATCH', label: 'Scenario 3: Progress Mismatch (NH-44)' },
    { id: 'SCENARIO_4_AI_ANOMALY', label: 'Scenario 4: AI Anomaly Surge' },
  ];

  return (
    <aside aria-label="Demonstration Notice" className="bg-zinc-900/90 border-b border-zinc-800 text-zinc-300 px-4 py-2.5 text-xs backdrop-blur-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> Demo Mode
          </span>
          <span className="text-zinc-400 text-xs">
            Interactive simulation for Internship Evaluation. Simulated multi-department dataset.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-[10px] text-zinc-400 uppercase tracking-widest hidden sm:inline">Scenario:</span>
          <select
            id="demo-scenario-select"
            value={currentScenario}
            onChange={e => applyDemoScenario(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {scenarios.map(s => (
              <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-200">
                {s.label}
              </option>
            ))}
          </select>

          <button
            id="btn-reset-demo-data"
            onClick={() => resetDemoData()}
            title="Reset to default baseline sample dataset"
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-xs font-medium"
          >
            <RotateCcw className="w-3 h-3 text-zinc-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
