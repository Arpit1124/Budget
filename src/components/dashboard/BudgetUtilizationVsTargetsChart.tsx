import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Department, SpendingForecast } from '../../types';
import { TrendingUp, Target, AlertCircle, CheckCircle2, ChevronRight, BarChart2 } from 'lucide-react';

interface BudgetUtilizationVsTargetsChartProps {
  departments: Department[];
  forecast: SpendingForecast;
  onNavigate?: (route: string) => void;
}

type ViewMode = 'BY_DEPARTMENT' | 'BY_QUARTER' | 'BY_SECTOR';

export const BudgetUtilizationVsTargetsChart: React.FC<BudgetUtilizationVsTargetsChartProps> = ({
  departments,
  forecast,
  onNavigate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('BY_DEPARTMENT');

  // Statutory benchmark for the current fiscal period (Q3 statutory threshold is 70% per GFR Rule 63)
  const STATUTORY_BENCHMARK_PCT = 70.0;

  // 1. Department-level Data: Current Budget Utilization vs Projected Targets
  const departmentChartData = useMemo(() => {
    return departments.slice(0, 8).map((dept) => {
      const allocated = dept.allocatedBudget;
      const currentUtilization = dept.utilizedBudget;
      // Projected target is calculated based on statutory absorption schedule for current fiscal stage
      const targetPercent = STATUTORY_BENCHMARK_PCT;
      const projectedTarget = Math.round((allocated * targetPercent) / 100);
      const variance = currentUtilization - projectedTarget;
      const variancePct = Number((dept.utilizationPercentage - targetPercent).toFixed(1));

      return {
        id: dept.id,
        name: dept.code || dept.name.split(' ')[0],
        fullName: dept.name,
        allocated,
        currentUtilization,
        projectedTarget,
        currentPercent: dept.utilizationPercentage,
        targetPercent,
        variance,
        variancePct,
        status: variance >= 0 ? 'ON_TRACK' : 'LAGGING',
      };
    });
  }, [departments]);

  // 2. Quarterly Milestones Data: Current Utilization vs Projected Targets
  const quarterlyChartData = useMemo(() => {
    return [
      {
        name: 'Q1 (Apr–Jun)',
        period: 'Q1',
        currentUtilization: 2440,
        projectedTarget: 2490,
        currentPercent: 19.6,
        targetPercent: 20.0,
        variance: -50,
        variancePct: -0.4,
        status: 'ON_TRACK',
      },
      {
        name: 'Q2 (Jul–Sep)',
        period: 'Q2',
        currentUtilization: 3340,
        projectedTarget: 3110,
        currentPercent: 26.8,
        targetPercent: 25.0,
        variance: 230,
        variancePct: 1.8,
        status: 'ON_TRACK',
      },
      {
        name: 'Q3 (Oct–Dec)',
        period: 'Q3 (Active)',
        currentUtilization: 3140,
        projectedTarget: 3115,
        currentPercent: 25.2,
        targetPercent: 25.0,
        variance: 25,
        variancePct: 0.2,
        status: 'ON_TRACK',
      },
      {
        name: 'Q4 (Jan–Mar)',
        period: 'Q4 (Projected)',
        currentUtilization: 1920, // Estimated current tranche execution
        projectedTarget: 3735,
        currentPercent: 15.4,
        targetPercent: 30.0,
        variance: -1815,
        variancePct: -14.6,
        status: 'LAGGING',
      },
    ];
  }, []);

  // 3. Sector-level Data: Current Budget Utilization vs Projected Targets
  const sectorChartData = useMemo(() => {
    const sectors = [
      { name: 'Transport & Roads', allocated: 4250, utilized: 3410, targetPct: 75.0 },
      { name: 'Health & Welfare', allocated: 2150, utilized: 1720, targetPct: 75.0 },
      { name: 'Education & Skills', allocated: 2740, utilized: 2110, targetPct: 72.0 },
      { name: 'Water & Sanitation', allocated: 1040, utilized: 566, targetPct: 70.0 },
      { name: 'Electronics & IT', allocated: 1000, utilized: 775, targetPct: 70.0 },
      { name: 'Agri & Allied', allocated: 1270, utilized: 989, targetPct: 72.0 },
    ];

    return sectors.map((s) => {
      const projectedTarget = Math.round((s.allocated * s.targetPct) / 100);
      const currentPercent = Number(((s.utilized / s.allocated) * 100).toFixed(1));
      const variance = s.utilized - projectedTarget;
      const variancePct = Number((currentPercent - s.targetPct).toFixed(1));

      return {
        name: s.name,
        fullName: s.name,
        allocated: s.allocated,
        currentUtilization: s.utilized,
        projectedTarget,
        currentPercent,
        targetPercent: s.targetPct,
        variance,
        variancePct,
        status: variance >= 0 ? 'ON_TRACK' : 'LAGGING',
      };
    });
  }, []);

  // Active dataset based on selected view mode
  const activeData = useMemo(() => {
    switch (viewMode) {
      case 'BY_QUARTER':
        return quarterlyChartData;
      case 'BY_SECTOR':
        return sectorChartData;
      case 'BY_DEPARTMENT':
      default:
        return departmentChartData;
    }
  }, [viewMode, quarterlyChartData, sectorChartData, departmentChartData]);

  // Aggregate calculations for high-level oversight
  const totalAllocated = useMemo(() => {
    return departments.reduce((acc, d) => acc + d.allocatedBudget, 0);
  }, [departments]);

  const totalCurrentUtilized = useMemo(() => {
    return departments.reduce((acc, d) => acc + d.utilizedBudget, 0);
  }, [departments]);

  const totalProjectedTarget = useMemo(() => {
    return Math.round((totalAllocated * STATUTORY_BENCHMARK_PCT) / 100);
  }, [totalAllocated]);

  const aggregateVariance = totalCurrentUtilized - totalProjectedTarget;
  const aggregateVariancePct = Number(
    ((totalCurrentUtilized / totalAllocated) * 100 - STATUTORY_BENCHMARK_PCT).toFixed(1)
  );

  const departmentsMeetingTarget = useMemo(() => {
    return departments.filter((d) => d.utilizationPercentage >= STATUTORY_BENCHMARK_PCT).length;
  }, [departments]);

  // Custom high-contrast tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isAhead = data.variance >= 0;

      return (
        <div className="bg-zinc-950 border border-zinc-700/80 rounded-2xl p-3.5 shadow-2xl text-xs text-white max-w-xs backdrop-blur-md">
          <div className="font-bold text-sm text-zinc-100 border-b border-zinc-800 pb-2 mb-2 flex items-center justify-between gap-2">
            <span className="truncate">{data.fullName || label}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                isAhead
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isAhead ? 'Ahead of Target' : 'Lagging Target'}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                Current Budget Utilization:
              </span>
              <span className="font-bold text-white">
                ₹{data.currentUtilization?.toLocaleString('en-IN')} Cr ({data.currentPercent}%)
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Projected Targets:
              </span>
              <span className="font-bold text-zinc-200">
                ₹{data.projectedTarget?.toLocaleString('en-IN')} Cr ({data.targetPercent}%)
              </span>
            </div>

            {data.allocated && (
              <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1">
                <span>Total Approved Allocation:</span>
                <span>₹{data.allocated?.toLocaleString('en-IN')} Cr</span>
              </div>
            )}

            <div className="pt-2 mt-1 border-t border-zinc-800 flex items-center justify-between text-[11px]">
              <span className="text-zinc-400">Net Target Variance:</span>
              <span className={`font-bold ${isAhead ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isAhead ? '+' : ''}₹{data.variance?.toLocaleString('en-IN')} Cr ({isAhead ? '+' : ''}
                {data.variancePct}%)
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="chart-budget-utilization-vs-targets"
      className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
              <BarChart2 className="w-3 h-3" />
              High-Level Oversight
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Statutory Benchmark: {STATUTORY_BENCHMARK_PCT}%
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-white mt-1">
            Current Budget Utilization vs. Projected Targets
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Multi-dimensional oversight comparing real-time fiscal disbursements against statutory targets (₹ in Crores).
          </p>
        </div>

        {/* View Mode Switcher and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="p-1 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-1 text-xs">
            <button
              id="btn-target-view-depts"
              onClick={() => setViewMode('BY_DEPARTMENT')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'BY_DEPARTMENT'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Top Ministries
            </button>
            <button
              id="btn-target-view-quarters"
              onClick={() => setViewMode('BY_QUARTER')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'BY_QUARTER'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Quarterly Trajectory
            </button>
            <button
              id="btn-target-view-sectors"
              onClick={() => setViewMode('BY_SECTOR')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                viewMode === 'BY_SECTOR'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Key Sectors
            </button>
          </div>

          {onNavigate && (
            <button
              id="btn-target-review-all"
              onClick={() => onNavigate('/budget-utilization')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/50 transition-colors"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Immediate High-Level Oversight KPI Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
            Current Utilization
          </span>
          <div className="text-base sm:text-lg font-extrabold text-indigo-400 mt-0.5">
            ₹{totalCurrentUtilized.toLocaleString('en-IN')} Cr
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {((totalCurrentUtilized / totalAllocated) * 100).toFixed(1)}% of Outlay
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
            Projected Target
          </span>
          <div className="text-base sm:text-lg font-extrabold text-emerald-400 mt-0.5">
            ₹{totalProjectedTarget.toLocaleString('en-IN')} Cr
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {STATUTORY_BENCHMARK_PCT}% Statutory Threshold
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
            Net Fiscal Variance
          </span>
          <div
            className={`text-base sm:text-lg font-extrabold mt-0.5 flex items-center gap-1 ${
              aggregateVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {aggregateVariance >= 0 ? '+' : ''}₹{aggregateVariance.toLocaleString('en-IN')} Cr
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            {aggregateVariancePct >= 0 ? '+' : ''}
            {aggregateVariancePct}% Ahead of Benchmark
          </span>
        </div>

        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
            Target Compliance
          </span>
          <div className="text-base sm:text-lg font-extrabold text-white mt-0.5">
            {departmentsMeetingTarget} / {departments.length}
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">
            {Math.round((departmentsMeetingTarget / departments.length) * 100)}% Departments on Track
          </span>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={activeData}
            margin={{ top: 15, right: 15, left: -10, bottom: 25 }}
            barGap={6}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              interval={0}
              angle={viewMode === 'BY_SECTOR' ? -15 : 0}
              textAnchor={viewMode === 'BY_SECTOR' ? 'end' : 'middle'}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              tickFormatter={(val) => `₹${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
              iconType="circle"
              iconSize={8}
            />

            {/* Current Budget Utilization Bar */}
            <Bar
              dataKey="currentUtilization"
              name="Current Budget Utilization"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />

            {/* Projected Targets Bar */}
            <Bar
              dataKey="projectedTarget"
              name="Projected Targets"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Insights Footer */}
      <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-zinc-400 gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            Infrastructure and Health ministries are executing at{' '}
            <strong className="text-zinc-200">104% of quarterly target</strong>. Water Resources requires target acceleration.
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            Current Utilization
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Projected Target
          </span>
        </div>
      </div>
    </div>
  );
};
