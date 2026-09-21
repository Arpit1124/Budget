import React, { useState, useMemo } from 'react';
import { Department } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ArrowLeftRight,
  BarChart2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  ChevronDown,
  Info,
  Building2,
  Scale,
} from 'lucide-react';

interface DepartmentComparisonChartProps {
  departments: Department[];
  onNavigate?: (route: string) => void;
}

export const DepartmentComparisonChart: React.FC<DepartmentComparisonChartProps> = ({
  departments,
  onNavigate,
}) => {
  // Sort departments by name for clean dropdowns
  const sortedDepts = useMemo(() => {
    return [...departments].sort((a, b) => a.name.localeCompare(b.name));
  }, [departments]);

  // Default selections: pick two prominent departments if available
  const [deptAId, setDeptAId] = useState<string>(() => {
    return departments[0]?.id || 'dept-01';
  });
  const [deptBId, setDeptBId] = useState<string>(() => {
    return departments[1]?.id || (departments.length > 1 ? departments[1].id : departments[0]?.id || 'dept-02');
  });

  const [comparisonMetricMode, setComparisonMetricMode] = useState<'PERCENTAGE' | 'VOLUME'>('PERCENTAGE');

  const deptA = useMemo(() => {
    return departments.find(d => d.id === deptAId) || departments[0];
  }, [departments, deptAId]);

  const deptB = useMemo(() => {
    return departments.find(d => d.id === deptBId) || departments[1] || departments[0];
  }, [departments, deptBId]);

  // Swap Dept A and Dept B
  const handleSwap = () => {
    const temp = deptAId;
    setDeptAId(deptBId);
    setDeptBId(temp);
  };

  // Preset selector
  const handleApplyPreset = (presetType: 'HIGHEST_LOWEST' | 'HEALTH_EDU' | 'TRANSPORT_RAIL' | 'AGRI_RURAL') => {
    if (departments.length < 2) return;
    if (presetType === 'HIGHEST_LOWEST') {
      const sortedByUtil = [...departments].sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
      setDeptAId(sortedByUtil[0].id);
      setDeptBId(sortedByUtil[sortedByUtil.length - 1].id);
    } else if (presetType === 'HEALTH_EDU') {
      const health = departments.find(d => d.name.toLowerCase().includes('health'));
      const edu = departments.find(d => d.name.toLowerCase().includes('education'));
      if (health) setDeptAId(health.id);
      if (edu) setDeptBId(edu.id);
    } else if (presetType === 'TRANSPORT_RAIL') {
      const road = departments.find(d => d.name.toLowerCase().includes('road') || d.name.toLowerCase().includes('transport'));
      const rail = departments.find(d => d.name.toLowerCase().includes('rail'));
      if (road) setDeptAId(road.id);
      if (rail) setDeptBId(rail.id);
    } else if (presetType === 'AGRI_RURAL') {
      const agri = departments.find(d => d.name.toLowerCase().includes('agri'));
      const rural = departments.find(d => d.name.toLowerCase().includes('rural'));
      if (agri) setDeptAId(agri.id);
      if (rural) setDeptBId(rural.id);
    }
  };

  // Compute side-by-side grouped data
  const comparisonData = useMemo(() => {
    if (!deptA || !deptB) return [];

    // Synthesize quarterly and projected absorption for multi-metric grouped bar comparison
    // Grounded on overall utilization percentage with standard government fiscal rhythm
    const utilA = deptA.utilizationPercentage;
    const utilB = deptB.utilizationPercentage;

    const q1A = Number((utilA * 0.28).toFixed(1));
    const q1B = Number((utilB * 0.28).toFixed(1));

    const q2A = Number((utilA * 0.62).toFixed(1));
    const q2B = Number((utilB * 0.62).toFixed(1));

    const q3A = Number(utilA.toFixed(1));
    const q3B = Number(utilB.toFixed(1));

    const projectedA = Number(Math.min(utilA * 1.35, 100).toFixed(1));
    const projectedB = Number(Math.min(utilB * 1.35, 100).toFixed(1));

    if (comparisonMetricMode === 'PERCENTAGE') {
      return [
        {
          category: 'Overall Utilization',
          deptAValue: utilA,
          deptBValue: utilB,
          benchmark: 75.0,
          unit: '%',
        },
        {
          category: 'Q1 Cumulative',
          deptAValue: q1A,
          deptBValue: q1B,
          benchmark: 25.0,
          unit: '%',
        },
        {
          category: 'Q2 Cumulative',
          deptAValue: q2A,
          deptBValue: q2B,
          benchmark: 50.0,
          unit: '%',
        },
        {
          category: 'Q3 Benchmark',
          deptAValue: q3A,
          deptBValue: q3B,
          benchmark: 75.0,
          unit: '%',
        },
        {
          category: 'Projected EOY',
          deptAValue: projectedA,
          deptBValue: projectedB,
          benchmark: 100.0,
          unit: '%',
        },
      ];
    } else {
      // Volume in ₹ Crore
      return [
        {
          category: 'Allocated Outlay',
          deptAValue: deptA.allocatedBudget,
          deptBValue: deptB.allocatedBudget,
          unit: '₹ Cr',
        },
        {
          category: 'Utilized Funds',
          deptAValue: deptA.utilizedBudget,
          deptBValue: deptB.utilizedBudget,
          unit: '₹ Cr',
        },
        {
          category: 'Remaining Outlay',
          deptAValue: deptA.remainingBudget,
          deptBValue: deptB.remainingBudget,
          unit: '₹ Cr',
        },
        {
          category: 'Active Projects Count',
          deptAValue: deptA.projectCount,
          deptBValue: deptB.projectCount,
          unit: 'Count',
        },
      ];
    }
  }, [deptA, deptB, comparisonMetricMode]);

  // Delta calculations
  const utilDelta = useMemo(() => {
    if (!deptA || !deptB) return 0;
    return Number((deptA.utilizationPercentage - deptB.utilizationPercentage).toFixed(1));
  }, [deptA, deptB]);

  const outlayDelta = useMemo(() => {
    if (!deptA || !deptB) return 0;
    return deptA.allocatedBudget - deptB.allocatedBudget;
  }, [deptA, deptB]);

  const spentDelta = useMemo(() => {
    if (!deptA || !deptB) return 0;
    return deptA.utilizedBudget - deptB.utilizedBudget;
  }, [deptA, deptB]);

  if (!deptA || !deptB) {
    return null;
  }

  return (
    <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Departmental Benchmarking & Surveillance
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              Grouped Comparative
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <span>Side-by-Side Budget Utilization Comparison</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Select any two central ministries to evaluate expenditure velocity, allocation absorption rates, and fiscal divergence.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs">
            <button
              id="btn-metric-percentage"
              onClick={() => setComparisonMetricMode('PERCENTAGE')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                comparisonMetricMode === 'PERCENTAGE'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Utilization Rate (%)
            </button>
            <button
              id="btn-metric-volume"
              onClick={() => setComparisonMetricMode('VOLUME')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                comparisonMetricMode === 'VOLUME'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Outlay Volume (₹ Cr)
            </button>
          </div>

          <button
            id="btn-swap-departments"
            onClick={handleSwap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-300 font-semibold transition-colors"
            title="Swap Department A and Department B"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
            <span>Swap</span>
          </button>
        </div>
      </div>

      {/* Department Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Department A Selector */}
        <div className="md:col-span-5 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Department A (Primary)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-indigo-300">
              {deptA.utilizationPercentage}% Utilized
            </span>
          </div>

          <div className="relative">
            <select
              id="select-dept-a"
              value={deptAId}
              onChange={(e) => setDeptAId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-zinc-900 border border-indigo-500/40 rounded-xl text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              {sortedDepts.map((d) => (
                <option key={`dept-a-${d.id}`} value={d.id} className="bg-zinc-900 text-white">
                  {d.name} ({d.utilizationPercentage}% — ₹{d.allocatedBudget.toLocaleString('en-IN')} Cr)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-indigo-500/20 text-[11px]">
            <div>
              <span className="text-zinc-500 block">Outlay</span>
              <span className="font-semibold text-white">₹{deptA.allocatedBudget.toLocaleString('en-IN')} Cr</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Disbursed</span>
              <span className="font-semibold text-emerald-400">₹{deptA.utilizedBudget.toLocaleString('en-IN')} Cr</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Unspent</span>
              <span className="font-semibold text-amber-400">₹{deptA.remainingBudget.toLocaleString('en-IN')} Cr</span>
            </div>
          </div>
        </div>

        {/* Center Comparison Delta Badge */}
        <div className="md:col-span-2 flex flex-col items-center justify-center p-3 rounded-2xl bg-zinc-800/40 border border-zinc-800 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Divergence</span>
          <div className="flex items-center gap-1 my-1">
            <span
              className={`text-lg font-black ${
                utilDelta > 0 ? 'text-indigo-400' : utilDelta < 0 ? 'text-emerald-400' : 'text-zinc-300'
              }`}
            >
              {utilDelta > 0 ? `+${utilDelta}%` : utilDelta < 0 ? `${utilDelta}%` : '0%'}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 leading-tight">
            {utilDelta > 0 ? (
              <span className="text-indigo-400 font-semibold">{deptA.code} leads</span>
            ) : utilDelta < 0 ? (
              <span className="text-emerald-400 font-semibold">{deptB.code} leads</span>
            ) : (
              <span>Equally balanced</span>
            )}
          </span>
        </div>

        {/* Department B Selector */}
        <div className="md:col-span-5 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Department B (Benchmark)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-300">
              {deptB.utilizationPercentage}% Utilized
            </span>
          </div>

          <div className="relative">
            <select
              id="select-dept-b"
              value={deptBId}
              onChange={(e) => setDeptBId(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-zinc-900 border border-emerald-500/40 rounded-xl text-xs text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
            >
              {sortedDepts.map((d) => (
                <option key={`dept-b-${d.id}`} value={d.id} className="bg-zinc-900 text-white">
                  {d.name} ({d.utilizationPercentage}% — ₹{d.allocatedBudget.toLocaleString('en-IN')} Cr)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-emerald-500/20 text-[11px]">
            <div>
              <span className="text-zinc-500 block">Outlay</span>
              <span className="font-semibold text-white">₹{deptB.allocatedBudget.toLocaleString('en-IN')} Cr</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Disbursed</span>
              <span className="font-semibold text-emerald-400">₹{deptB.utilizedBudget.toLocaleString('en-IN')} Cr</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Unspent</span>
              <span className="font-semibold text-amber-400">₹{deptB.remainingBudget.toLocaleString('en-IN')} Cr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Comparison Presets */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Quick Presets:</span>
        <button
          onClick={() => handleApplyPreset('HIGHEST_LOWEST')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-[11px] font-medium"
        >
          🏆 Highest vs Lowest Utilization
        </button>
        <button
          onClick={() => handleApplyPreset('HEALTH_EDU')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-[11px] font-medium"
        >
          🏥 Health vs 📚 Education
        </button>
        <button
          onClick={() => handleApplyPreset('TRANSPORT_RAIL')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-[11px] font-medium"
        >
          🛣️ Road Transport vs 🚆 Railways
        </button>
        <button
          onClick={() => handleApplyPreset('AGRI_RURAL')}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors text-[11px] font-medium"
        >
          🌾 Agriculture vs 🏡 Rural Dev
        </button>
      </div>

      {/* Grouped Bar Chart */}
      <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-indigo-500" />
              <span className="text-white">{deptA.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-white">{deptB.name}</span>
            </div>
          </div>
          {comparisonMetricMode === 'PERCENTAGE' && (
            <span className="text-[10px] font-mono text-zinc-400">
              Target Reference: 75% Q3 Benchmark
            </span>
          )}
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonData}
              margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
                unit={comparisonMetricMode === 'PERCENTAGE' ? '%' : ''}
                domain={comparisonMetricMode === 'PERCENTAGE' ? [0, 100] : ['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  color: '#f4f4f5',
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                }}
                formatter={(val: any, name: any, item: any) => {
                  const unit = item.payload.unit || '';
                  const formatted = unit === '₹ Cr' ? `₹${val.toLocaleString('en-IN')} Cr` : `${val}${unit}`;
                  return [formatted, name];
                }}
                labelStyle={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}
              />
              {comparisonMetricMode === 'PERCENTAGE' && (
                <ReferenceLine
                  y={75}
                  stroke="#eab308"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Q3 Target (75%)',
                    fill: '#eab308',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}
              <Bar
                dataKey="deptAValue"
                name={deptA.name}
                fill="#6366f1"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
              <Bar
                dataKey="deptBValue"
                name={deptB.name}
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                maxBarSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparative Analytical Digest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <Building2 className="w-4 h-4" />
            <span>{deptA.name} Absorption Profile</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Operating at <strong className="text-white">{deptA.utilizationPercentage}%</strong> utilization with ₹{deptA.remainingBudget.toLocaleString('en-IN')} Cr remaining out of ₹{deptA.allocatedBudget.toLocaleString('en-IN')} Cr.
            {deptA.utilizationPercentage < 60 ? (
              <span className="text-amber-400 font-medium"> Currently classified as lagging under standard expenditure milestones, indicating high surrender risk under GFR Rule 63.</span>
            ) : (
              <span className="text-emerald-400 font-medium"> Absorption velocity is robust, tracking aligned with annual ministerial milestones.</span>
            )}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-800/40 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Building2 className="w-4 h-4" />
            <span>{deptB.name} Absorption Profile</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Operating at <strong className="text-white">{deptB.utilizationPercentage}%</strong> utilization with ₹{deptB.remainingBudget.toLocaleString('en-IN')} Cr remaining out of ₹{deptB.allocatedBudget.toLocaleString('en-IN')} Cr.
            {deptB.utilizationPercentage < 60 ? (
              <span className="text-amber-400 font-medium"> Currently classified as lagging under standard expenditure milestones, indicating high surrender risk under GFR Rule 63.</span>
            ) : (
              <span className="text-emerald-400 font-medium"> Absorption velocity is robust, tracking aligned with annual ministerial milestones.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
