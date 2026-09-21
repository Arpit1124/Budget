import React from 'react';
import {
  Landmark,
  TrendingUp,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Department } from '../../types';

interface HighLevelKPIDeckProps {
  departments: Department[];
  financialYear: string;
  onNavigate: (route: string) => void;
  onAskAI?: (prompt: string) => void;
}

export const HighLevelKPIDeck: React.FC<HighLevelKPIDeckProps> = ({
  departments,
  financialYear,
  onNavigate,
  onAskAI,
}) => {
  // Real-time calculation from departments dataset
  const totalAllocated = departments.reduce((acc, d) => acc + d.allocatedBudget, 0);
  const totalExpenditure = departments.reduce((acc, d) => acc + d.utilizedBudget, 0);
  const budgetVariance = totalAllocated - totalExpenditure;

  // Key derived analytical metrics
  const utilizationPercentage = totalAllocated > 0 
    ? Number(((totalExpenditure / totalAllocated) * 100).toFixed(1)) 
    : 0;
  const variancePercentage = totalAllocated > 0 
    ? Number(((budgetVariance / totalAllocated) * 100).toFixed(1)) 
    : 0;

  // Statutory mid-fiscal year target benchmark (Q3 GFR Rule 63 benchmark is 70.0%)
  const STATUTORY_BENCHMARK = 70.0;
  const targetVariance = Number((utilizationPercentage - STATUTORY_BENCHMARK).toFixed(1));
  const isAheadOfTarget = targetVariance >= 0;

  // Lapsing risk: departments tracking under 60% absorption
  const lowAbsorptionDepts = departments.filter((d) => d.utilizationPercentage < 60);

  return (
    <section aria-label="High-Level Fiscal KPI Summary" className="space-y-2">
      {/* Subtle Live Data Sync Sub-header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Real-Time Public Financial Management Intelligence</span>
          <span className="hidden sm:inline text-zinc-600">•</span>
          <span className="hidden sm:inline text-zinc-500 font-mono">GFR 2017 Fiscal Ledger</span>
        </div>
        <div className="text-[11px] font-mono text-zinc-500">
          FY {financialYear} • Q3 Active
        </div>
      </div>

      {/* 3 High-Level KPI Cards in Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        
        {/* KPI Card 1: Total Allocated Budget */}
        <div
          id="kpi-total-allocated-budget"
          className="p-5 sm:p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all flex flex-col justify-between"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-600/15 transition-all" />

          <div>
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total Allocated Budget
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                  Approved
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-xs">
                <Landmark className="w-5 h-5" />
              </div>
            </div>

            {/* Primary Value */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                ₹{totalAllocated.toLocaleString('en-IN')}
              </span>
              <span className="text-sm font-semibold text-zinc-400">Crore</span>
            </div>

            {/* Sub-Metric & Status */}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="flex items-center text-emerald-400 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                +4.2% YoY Outlay
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">
                {departments.length} Union Ministries
              </span>
            </div>
          </div>

          {/* Bottom Analytical Breakdown Footer */}
          <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <span className="font-mono text-zinc-300">Capex: 34.2%</span>
              <span className="text-zinc-600">|</span>
              <span className="font-mono text-zinc-300">Revenue: 65.8%</span>
            </div>
            <button
              onClick={() => onNavigate('/budget-utilization')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Inspect</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI Card 2: Total Expenditure */}
        <div
          id="kpi-total-expenditure"
          className="p-5 sm:p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all flex flex-col justify-between"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-600/15 transition-all" />

          <div>
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Total Expenditure
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  Disbursed
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            {/* Primary Value */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                ₹{totalExpenditure.toLocaleString('en-IN')}
              </span>
              <span className="text-sm font-semibold text-zinc-400">Crore</span>
            </div>

            {/* Sub-Metric & Status */}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="font-bold text-emerald-400">
                {utilizationPercentage}% Absorbed
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {isAheadOfTarget ? `+${targetVariance}% ahead of Q3` : `${targetVariance}% vs Q3`}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar to Target */}
          <div className="mt-4">
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden p-0.5 border border-zinc-800">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Benchmark: 70.0%</span>
              <button
                onClick={() => onNavigate('/reports')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* KPI Card 3: Budget Variance */}
        <div
          id="kpi-budget-variance"
          className="p-5 sm:p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden group hover:border-zinc-700 transition-all flex flex-col justify-between"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-600/15 transition-all" />

          <div>
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Budget Variance
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                  Net Balance
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-xs">
                <Scale className="w-5 h-5" />
              </div>
            </div>

            {/* Primary Value */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">
                ₹{budgetVariance.toLocaleString('en-IN')}
              </span>
              <span className="text-sm font-semibold text-zinc-400">Crore</span>
            </div>

            {/* Sub-Metric & Status */}
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="font-bold text-amber-300">
                {variancePercentage}% Unspent Outlay
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">
                Available Fiscal Headroom
              </span>
            </div>
          </div>

          {/* Bottom Analytical Breakdown Footer */}
          <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">
                {lowAbsorptionDepts.length} depts &lt;60% absorption
              </span>
            </div>
            <button
              onClick={() => onNavigate('/ai-forecast')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Forecast</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
