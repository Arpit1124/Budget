import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  GitCompare,
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Download,
  CheckCircle2,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const BudgetComparisonTool: React.FC = () => {
  const { departments, financialYear } = useApp();

  const [compareMode, setCompareMode] = useState<'YEARS' | 'DEPARTMENTS'>('DEPARTMENTS');

  // Department comparison state
  const [deptAId, setDeptAId] = useState<string>(departments[0]?.id || '');
  const [deptBId, setDeptBId] = useState<string>(departments[1]?.id || '');

  // Year comparison state
  const [yearA, setYearA] = useState<string>('2026–27');
  const [yearB, setYearB] = useState<string>('2025–26');
  const [selectedDeptForYearComp, setSelectedDeptForYearComp] = useState<string>('ALL');

  const deptA = departments.find(d => d.id === deptAId) || departments[0];
  const deptB = departments.find(d => d.id === deptBId) || departments[1] || departments[0];

  // Calculations for Department Comparison
  const deptAAllocated = deptA?.allocatedBudget || 0;
  const deptBAllocated = deptB?.allocatedBudget || 0;
  const allocDiff = deptBAllocated - deptAAllocated;
  const allocPercentDiff = deptAAllocated > 0 ? ((allocDiff / deptAAllocated) * 100).toFixed(1) : '0';

  const deptAUtilized = deptA?.utilizedBudget || 0;
  const deptBUtilized = deptB?.utilizedBudget || 0;
  const utilDiff = deptBUtilized - deptAUtilized;

  const deptARate = deptA?.utilizationPercentage || 0;
  const deptBRate = deptB?.utilizationPercentage || 0;
  const rateDiff = Number((deptBRate - deptARate).toFixed(1));

  // Sector breakdown comparison data
  const comparisonBarData = [
    {
      metric: 'Allocated Outlay (₹ Cr)',
      [deptA?.code || 'Dept A']: deptAAllocated,
      [deptB?.code || 'Dept B']: deptBAllocated,
    },
    {
      metric: 'Utilized Outlay (₹ Cr)',
      [deptA?.code || 'Dept A']: deptAUtilized,
      [deptB?.code || 'Dept B']: deptBUtilized,
    },
    {
      metric: 'Unspent Balance (₹ Cr)',
      [deptA?.code || 'Dept A']: Math.max(0, deptAAllocated - deptAUtilized),
      [deptB?.code || 'Dept B']: Math.max(0, deptBAllocated - deptBUtilized),
    },
  ];

  // Year comparison simulation data
  const totalAlloc2026 = departments.reduce((acc, d) => acc + d.allocatedBudget, 0);
  const totalAlloc2025 = totalAlloc2026 * 0.912; // Simulated prior year baseline
  const totalAlloc2024 = totalAlloc2026 * 0.824;

  const getYearAlloc = (yr: string) => {
    if (yr === '2026–27') return totalAlloc2026;
    if (yr === '2025–26') return totalAlloc2025;
    return totalAlloc2024;
  };

  const yearAAlloc = getYearAlloc(yearA);
  const yearBAlloc = getYearAlloc(yearB);
  const yearDelta = yearAAlloc - yearBAlloc;
  const yearDeltaPercent = ((yearDelta / yearBAlloc) * 100).toFixed(1);

  // Top departments year comparison chart data
  const topDeptsYearData = departments.slice(0, 5).map(d => ({
    name: d.code,
    [yearA]: d.allocatedBudget,
    [yearB]: Math.round(d.allocatedBudget * (yearB === '2025–26' ? 0.91 : 0.82)),
  }));

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (compareMode === 'DEPARTMENTS') {
      csvContent += `Department Comparison Report\n`;
      csvContent += `Metric,${deptA?.name} (${deptA?.code}),${deptB?.name} (${deptB?.code}),Variance,Variance %\n`;
      csvContent += `Allocated Budget (₹ Cr),${deptAAllocated},${deptBAllocated},${allocDiff},${allocPercentDiff}%\n`;
      csvContent += `Utilized Budget (₹ Cr),${deptAUtilized},${deptBUtilized},${utilDiff},-\n`;
      csvContent += `Utilization Rate (%),${deptARate}%,${deptBRate}%,${rateDiff}%,-\n`;
      csvContent += `Sector,${deptA?.sector},${deptB?.sector},-,-\n`;
    } else {
      csvContent += `Fiscal Year Comparison Report\n`;
      csvContent += `Fiscal Year,Total Outlay (₹ Cr),Growth Trajectory\n`;
      csvContent += `${yearA},${yearAAlloc.toFixed(2)},Active Year\n`;
      csvContent += `${yearB},${yearBAlloc.toFixed(2)},Baseline Year\n`;
      csvContent += `Variance,${yearDelta.toFixed(2)} Cr,${yearDeltaPercent}%\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Budget_Comparison_${compareMode}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <GitCompare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Visual Side-by-Side Budget Comparison Tool
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Evaluate relative resource allocations, expenditure absorptions, and fiscal variances across departments or consecutive financial years.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Switcher */}
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                id="btn-comp-mode-depts"
                onClick={() => setCompareMode('DEPARTMENTS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  compareMode === 'DEPARTMENTS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Compare Departments</span>
              </button>
              <button
                id="btn-comp-mode-years"
                onClick={() => setCompareMode('YEARS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  compareMode === 'YEARS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Compare Fiscal Years</span>
              </button>
            </div>

            <button
              id="btn-export-comparison-csv"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Dynamic Selectors Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {compareMode === 'DEPARTMENTS' ? (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                  Primary Department (Entity A)
                </label>
                <select
                  id="select-dept-a"
                  value={deptAId}
                  onChange={e => setDeptAId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  Comparative Department (Entity B)
                </label>
                <select
                  id="select-dept-b"
                  value={deptBId}
                  onChange={e => setDeptBId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 w-full flex items-center justify-between">
                  <span className="text-[11px]">FY Horizon:</span>
                  <span className="font-bold text-white">{financialYear}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1">
                  Fiscal Year 1 (Current / Target)
                </label>
                <select
                  id="select-year-a"
                  value={yearA}
                  onChange={e => setYearA(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="2026–27">2026–27 (Active Budget)</option>
                  <option value="2025–26">2025–26</option>
                  <option value="2024–25">2024–25</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                  Fiscal Year 2 (Baseline)
                </label>
                <select
                  id="select-year-b"
                  value={yearB}
                  onChange={e => setYearB(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="2025–26">2025–26</option>
                  <option value="2024–25">2024–25</option>
                  <option value="2026–27">2026–27</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Department Scope
                </label>
                <select
                  id="select-scope-dept"
                  value={selectedDeptForYearComp}
                  onChange={e => setSelectedDeptForYearComp(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-zinc-700"
                >
                  <option value="ALL">All Union Departments Aggregate</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Side-by-Side Comparison Cards */}
      {compareMode === 'DEPARTMENTS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Department A */}
          <div className="p-6 rounded-3xl bg-zinc-900 border border-indigo-500/30 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Entity A
              </span>
              <span className="text-xs font-mono text-zinc-400">{deptA?.code}</span>
            </div>

            <div>
              <h3 className="font-bold text-base text-white">{deptA?.name}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Sector: {deptA?.sector}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Total Outlay:</span>
                <span className="text-base font-bold text-white">₹{deptAAllocated.toLocaleString()} Cr</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Utilized Outlay:</span>
                <span className="text-sm font-semibold text-zinc-200">₹{deptAUtilized.toLocaleString()} Cr</span>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-zinc-400">Utilization Rate:</span>
                  <span className="font-bold text-indigo-400">{deptARate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${Math.min(deptARate, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Unspent Balance:</span>
                <span className="font-mono text-zinc-300">
                  ₹{Math.max(0, deptAAllocated - deptAUtilized).toLocaleString()} Cr
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Delta / Variance Breakdown */}
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                  Variance Differential (B vs A)
                </span>
                <GitCompare className="w-4 h-4 text-zinc-500" />
              </div>

              <h4 className="text-xs font-semibold text-zinc-400">Comparative Divergence Analysis</h4>
            </div>

            <div className="space-y-4 py-4">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  Allocated Outlay Variance
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-xl font-extrabold ${
                      allocDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {allocDiff >= 0 ? '+' : ''}₹{allocDiff.toLocaleString()} Cr
                  </span>
                  <span
                    className={`text-xs font-semibold flex items-center gap-0.5 ${
                      allocDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {allocDiff >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {allocPercentDiff}%
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  Absorption Velocity Delta
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-xl font-extrabold ${
                      rateDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {rateDiff >= 0 ? '+' : ''}{rateDiff}%
                  </span>
                  <span className="text-xs text-zinc-400">
                    {rateDiff >= 0 ? 'Entity B is absorbing faster' : 'Entity A is absorbing faster'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 text-center">
              Statutory reconciliation under GFR 2017 Chapter 6
            </div>
          </div>

          {/* Card 3: Department B */}
          <div className="p-6 rounded-3xl bg-zinc-900 border border-emerald-500/30 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Entity B
              </span>
              <span className="text-xs font-mono text-zinc-400">{deptB?.code}</span>
            </div>

            <div>
              <h3 className="font-bold text-base text-white">{deptB?.name}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Sector: {deptB?.sector}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-zinc-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Total Outlay:</span>
                <span className="text-base font-bold text-white">₹{deptBAllocated.toLocaleString()} Cr</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Utilized Outlay:</span>
                <span className="text-sm font-semibold text-zinc-200">₹{deptBUtilized.toLocaleString()} Cr</span>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-zinc-400">Utilization Rate:</span>
                  <span className="font-bold text-emerald-400">{deptBRate}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(deptBRate, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-400">Unspent Balance:</span>
                <span className="font-mono text-zinc-300">
                  ₹{Math.max(0, deptBAllocated - deptBUtilized).toLocaleString()} Cr
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Fiscal Year Side-by-Side */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-zinc-900 border border-indigo-500/30 shadow-xl space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Fiscal Year {yearA}
            </span>
            <h3 className="text-xl font-extrabold text-white">₹{yearAAlloc.toLocaleString()} Cr</h3>
            <p className="text-xs text-zinc-400">
              Total Budget Outlay sanctioned across all administrative demands for grants in FY {yearA}.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl space-y-4 text-center flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Year-on-Year Expansion
            </span>
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-2xl font-extrabold ${
                  yearDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {yearDelta >= 0 ? '+' : ''}₹{yearDelta.toLocaleString()} Cr
              </span>
              <span
                className={`text-sm font-bold flex items-center ${
                  yearDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {yearDelta >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {yearDeltaPercent}%
              </span>
            </div>
            <p className="text-xs text-zinc-500">Trajectory relative to baseline year {yearB}</p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900 border border-emerald-500/30 shadow-xl space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Fiscal Year {yearB}
            </span>
            <h3 className="text-xl font-extrabold text-white">₹{yearBAlloc.toLocaleString()} Cr</h3>
            <p className="text-xs text-zinc-400">
              Baseline financial year aggregate comparison anchor.
            </p>
          </div>
        </div>
      )}

      {/* Comparative Visual Bar Chart */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              {compareMode === 'DEPARTMENTS'
                ? `Direct Metric Comparison: ${deptA?.code} vs ${deptB?.code}`
                : `Top 5 Departments Outlay Comparison: FY ${yearA} vs FY ${yearB}`}
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400">Values in ₹ Crore</span>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {compareMode === 'DEPARTMENTS' ? (
              <BarChart data={comparisonBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="metric" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey={deptA?.code || 'Dept A'} fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey={deptB?.code || 'Dept B'} fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={topDeptsYearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey={yearA} fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey={yearB} fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
