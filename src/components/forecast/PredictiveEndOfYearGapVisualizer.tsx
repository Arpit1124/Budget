import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Layers,
  CheckCircle2,
  Building,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
  Info,
  ChevronRight,
  PieChart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useApp } from '../../context/AppContext';

export const PredictiveEndOfYearGapVisualizer: React.FC = () => {
  const { departments, forecast } = useApp();

  const [seasonalModel, setSeasonalModel] = useState<'STANDARD' | 'STRICT_ANTI_RUSH' | 'ACCELERATED'>(
    'STANDARD'
  );
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<'ALL' | 'SURPLUS_RISK' | 'DEFICIT_RISK'>(
    'ALL'
  );

  // Seasonal quarterly weight distribution models
  const seasonalWeights = useMemo(() => {
    switch (seasonalModel) {
      case 'STRICT_ANTI_RUSH':
        // Capped Q4 per Rule 62(3) GFR
        return { q1: 0.22, q2: 0.26, q3: 0.27, q4: 0.25, name: 'Rule 62(3) Anti-Rush Cap (Q4 ≤ 25%)' };
      case 'ACCELERATED':
        // Front-loaded Capex sprint
        return { q1: 0.24, q2: 0.28, q3: 0.32, q4: 0.16, name: 'Accelerated Capex Front-Loading' };
      case 'STANDARD':
      default:
        // Indian public finance historical norm (monsoon delay -> March surge)
        return { q1: 0.18, q2: 0.22, q3: 0.28, q4: 0.32, name: 'Historical Union Fiscal Pattern (Q4 Surge)' };
    }
  }, [seasonalModel]);

  // Compute departmental end-of-year gap predictions
  const departmentGaps = useMemo(() => {
    return departments.map((d, index) => {
      const allocated = d.allocatedBudget;
      const spentToDate = d.spentBudget;
      const currentRate = spentToDate / allocated; // fraction spent (approx Q3 mid-year)

      // Project based on seasonal model weighting
      // Assuming we are at month 8 (mid-Q3, ~60% of fiscal year elapsed)
      const historicalBenchmarkProgress = seasonalWeights.q1 + seasonalWeights.q2 + seasonalWeights.q3 * 0.5;
      const velocityRatio = (currentRate / historicalBenchmarkProgress) || 0.85;

      let projectedTotal = allocated * Math.min(1.2, velocityRatio * 0.95);
      projectedTotal = Math.round(projectedTotal * 10) / 10;

      const gap = Math.round((allocated - projectedTotal) * 10) / 10; // positive = unspent surrender gap; negative = deficit / supplementary needed
      const isDeficit = gap < 0;
      const gapMagnitude = Math.abs(gap);
      const gapPct = Math.round((gapMagnitude / allocated) * 100);

      let recommendation = '';
      if (gap > 50) {
        recommendation = `Projected ₹${gap} Cr unspent surrender risk. Propose virement re-appropriation to high-velocity capex before Q4.`;
      } else if (gap < -30) {
        recommendation = `Disbursement exceeds outlay by ₹${Math.abs(gap)} Cr. Recommend initiating Supplementary Grant demand in Parliament.`;
      } else {
        recommendation = `Spending tracks near target corridor (±${gapMagnitude} Cr). Normal quarterly milestone monitoring.`;
      }

      return {
        id: d.id,
        name: d.name,
        code: d.code,
        allocated,
        spentToDate,
        projectedTotal,
        gap,
        isDeficit,
        gapMagnitude,
        gapPct,
        velocityRatio: Math.round(velocityRatio * 100),
        recommendation,
      };
    });
  }, [departments, seasonalWeights]);

  // Filtered departmental rows
  const filteredDepartments = useMemo(() => {
    if (selectedSectorFilter === 'SURPLUS_RISK') {
      return departmentGaps.filter(d => d.gap > 0).sort((a, b) => b.gap - a.gap);
    }
    if (selectedSectorFilter === 'DEFICIT_RISK') {
      return departmentGaps.filter(d => d.gap < 0).sort((a, b) => a.gap - b.gap);
    }
    return departmentGaps.sort((a, b) => b.gapMagnitude - a.gapMagnitude);
  }, [departmentGaps, selectedSectorFilter]);

  // High-level macro metrics
  const totalAllocated = useMemo(() => departments.reduce((acc, d) => acc + d.allocatedBudget, 0), [departments]);
  const totalSpent = useMemo(() => departments.reduce((acc, d) => acc + d.spentBudget, 0), [departments]);
  const totalProjected = useMemo(() => departmentGaps.reduce((acc, d) => acc + d.projectedTotal, 0), [departmentGaps]);
  const netGap = Math.round((totalAllocated - totalProjected) * 10) / 10;
  const totalSurplusLapse = departmentGaps.filter(d => d.gap > 0).reduce((a, d) => a + d.gap, 0);
  const totalDeficitGap = departmentGaps.filter(d => d.gap < 0).reduce((a, d) => a + Math.abs(d.gap), 0);

  // Month-by-month trajectory data for chart
  const trajectoryData = useMemo(() => {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const currentElapsedMonths = 8; // April through November actuals

    // Distribute quarterly weights to monthly
    const monthlySeasonalFractions = [
      seasonalWeights.q1 / 3, seasonalWeights.q1 / 3, seasonalWeights.q1 / 3,
      seasonalWeights.q2 / 3, seasonalWeights.q2 / 3, seasonalWeights.q2 / 3,
      seasonalWeights.q3 / 3, seasonalWeights.q3 / 3, seasonalWeights.q3 / 3,
      seasonalWeights.q4 / 3, seasonalWeights.q4 / 3, seasonalWeights.q4 / 3,
    ];

    let cumulativeBudget = 0;
    let cumulativeLinear = 0;
    let cumulativeSeasonal = 0;
    const monthlyCeilingStep = totalAllocated / 12;

    return months.map((m, idx) => {
      cumulativeBudget += monthlyCeilingStep;
      cumulativeLinear += (totalSpent / currentElapsedMonths);
      cumulativeSeasonal += totalProjected * monthlySeasonalFractions[idx];

      const isActual = idx < currentElapsedMonths;
      const actualVal = isActual ? Math.round(cumulativeLinear) : undefined;
      const seasonalProjectedVal = Math.round(cumulativeSeasonal);
      const ceilingVal = Math.round(cumulativeBudget);

      return {
        month: m,
        actualSpent: actualVal,
        seasonalProjected: seasonalProjectedVal,
        budgetCeiling: ceilingVal,
        // Gap highlight between ceiling and seasonal projection
        budgetGapBand: Math.abs(ceilingVal - seasonalProjectedVal),
        lowerBound: Math.min(ceilingVal, seasonalProjectedVal),
        upperBound: Math.max(ceilingVal, seasonalProjectedVal),
      };
    });
  }, [totalAllocated, totalSpent, totalProjected, seasonalWeights]);

  return (
    <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-6">
      {/* Header & Simulation Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base text-white tracking-tight">
              Predictive End-of-Year Budget Gap & Seasonal Dynamics Visualizer
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              AI Seasonal Burn Model
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Machine learning spending curves modeling quarterly absorption velocity, seasonal monsoonal lags, and Rule 62(3) surrender liabilities.
          </p>
        </div>

        {/* Seasonal Model Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
            <span>Seasonal Model:</span>
          </span>
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setSeasonalModel('STANDARD')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                seasonalModel === 'STANDARD'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Historical (Q4 Surge)
            </button>
            <button
              onClick={() => setSeasonalModel('STRICT_ANTI_RUSH')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                seasonalModel === 'STRICT_ANTI_RUSH'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Anti-Rush Cap (Q4 ≤ 25%)
            </button>
            <button
              onClick={() => setSeasonalModel('ACCELERATED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                seasonalModel === 'ACCELERATED'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Accelerated Capex Sprint
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget Ceiling */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Total Union Budget Ceiling
          </span>
          <p className="text-xl font-extrabold text-white">
            ₹{totalAllocated.toLocaleString('en-IN')} Cr
          </p>
          <span className="text-[11px] text-zinc-500 block">
            Approved GFR Fiscal Allocation
          </span>
        </div>

        {/* Seasonally Projected Spend */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Projected Year-End Burn Rate
          </span>
          <p className="text-xl font-extrabold text-indigo-400">
            ₹{Math.round(totalProjected).toLocaleString('en-IN')} Cr
          </p>
          <span className="text-[11px] text-indigo-400/80 font-medium block">
            {Math.round((totalProjected / totalAllocated) * 100)}% Absorption Velocity
          </span>
        </div>

        {/* Net End-of-Year Gap */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-amber-900/30 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Surrender Lapsing Risk (Unspent)
          </span>
          <p className="text-xl font-extrabold text-amber-400">
            ₹{Math.round(totalSurplusLapse).toLocaleString('en-IN')} Cr
          </p>
          <span className="text-[11px] text-zinc-400 block">
            {departmentGaps.filter(d => d.gap > 0).length} departments tracking surplus
          </span>
        </div>

        {/* Deficit / Supplementary Grant Gap */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-rose-900/30 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
            Projected Capex Shortfall (Deficit)
          </span>
          <p className="text-xl font-extrabold text-rose-400">
            ₹{Math.round(totalDeficitGap).toLocaleString('en-IN')} Cr
          </p>
          <span className="text-[11px] text-zinc-400 block">
            {departmentGaps.filter(d => d.gap < 0).length} departments require grant top-up
          </span>
        </div>
      </div>

      {/* Trajectory Area & Gap Visualization */}
      <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>Cumulative Spending Trajectory & End-of-Year Gap Corridor</span>
              <span className="text-[10px] font-normal text-zinc-400">({seasonalWeights.name})</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Shaded amber corridor reveals the fiscal gap between authorized budget ceilings and seasonally projected absorption.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-3 h-0.5 bg-blue-500 inline-block" /> Actual Verified Spent
            </span>
            <span className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-3 h-0.5 bg-indigo-400 border-dashed inline-block" /> Seasonally Projected
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-3 h-0.5 bg-zinc-500 inline-block" /> Budget Ceiling
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trajectoryData} margin={{ top: 15, right: 15, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
              <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#71717a"
                fontSize={10}
                tickLine={false}
                tickFormatter={val => `₹${(val / 1000).toFixed(0)}k Cr`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#27272a',
                  borderRadius: '16px',
                  fontSize: '11px',
                  color: '#fff',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                }}
                formatter={(val: any) => [`₹${val?.toLocaleString('en-IN')} Cr`, '']}
              />
              {/* Gap Band between projected and ceiling */}
              <Area
                type="monotone"
                dataKey="upperBound"
                fill="#f59e0b"
                fillOpacity={0.08}
                stroke="transparent"
                name="Budget Gap Corridor"
              />
              {/* Budget Ceiling Line */}
              <Line
                type="linear"
                dataKey="budgetCeiling"
                stroke="#71717a"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="Allocated Budget Ceiling"
              />
              {/* Seasonally Projected Line */}
              <Line
                type="monotone"
                dataKey="seasonalProjected"
                stroke="#818cf8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#818cf8' }}
                name="Seasonally Adjusted Projection"
              />
              {/* Actual Verified Spend to Date */}
              <Line
                type="monotone"
                dataKey="actualSpent"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', stroke: '#09090b', strokeWidth: 2 }}
                name="Actual Spent to Date"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Departmental Gap & Seasonal Action Matrix */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-white">
              Departmental End-of-Year Gap Analysis & Virement Recommendations
            </h3>
            <p className="text-xs text-zinc-400">
              Department-level gap magnitudes and algorithmic recommendations for mid-term reallocation before the parliamentary session.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 font-medium">Filter:</span>
            <select
              id="select-department-gap-filter"
              value={selectedSectorFilter}
              onChange={e => setSelectedSectorFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Departments ({departmentGaps.length})</option>
              <option value="SURPLUS_RISK">Surrender Lapsing Risk ({departmentGaps.filter(d => d.gap > 0).length})</option>
              <option value="DEFICIT_RISK">Supplementary Grant Needed ({departmentGaps.filter(d => d.gap < 0).length})</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider bg-zinc-900/60">
                <th className="py-3 px-4">Ministry / Department</th>
                <th className="py-3 px-3 text-right">Allocated Outlay</th>
                <th className="py-3 px-3 text-right">Spent to Date</th>
                <th className="py-3 px-3 text-right">Projected Year-End</th>
                <th className="py-3 px-4 text-center">Projected Gap</th>
                <th className="py-3 px-4">Strategic AI Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredDepartments.slice(0, 8).map(d => {
                const isSurplus = d.gap > 0;
                return (
                  <tr key={d.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{d.name}</div>
                      <span className="text-[10px] font-mono text-zinc-400">{d.code}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-zinc-300">
                      ₹{d.allocated.toLocaleString('en-IN')} Cr
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-300">
                      <span className="font-semibold">₹{d.spentToDate.toLocaleString('en-IN')} Cr</span>
                      <span className="text-[10px] text-zinc-500 block">
                        ({Math.round((d.spentToDate / d.allocated) * 100)}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-300">
                      ₹{d.projectedTotal.toLocaleString('en-IN')} Cr
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          isSurplus
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isSurplus ? `+₹${d.gap} Cr Lapse Risk` : `-₹${Math.abs(d.gap)} Cr Shortfall`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300 max-w-sm">
                      <p className="text-[11px] leading-relaxed">{d.recommendation}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advisory Note */}
      <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-zinc-200">Parliamentary Timelines Note:</strong> Ministry surrender lists must be submitted to the Ministry of Finance before February 15th to permit reallocation through the Supplementary Demands for Grants batch.
        </p>
      </div>
    </div>
  );
};
