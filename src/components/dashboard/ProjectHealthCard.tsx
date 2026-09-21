import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Activity,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Building2,
  Filter,
} from 'lucide-react';
import { Project, Department } from '../../types';

interface ProjectHealthCardProps {
  projects: Project[];
  departments: Department[];
  onNavigate: (route: string) => void;
}

export const ProjectHealthCard: React.FC<ProjectHealthCardProps> = ({
  projects,
  departments,
  onNavigate,
}) => {
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');

  // Filter projects by department if selected
  const filteredProjects = useMemo(() => {
    if (selectedDeptId === 'ALL') return projects;
    return projects.filter((p) => p.departmentId === selectedDeptId);
  }, [projects, selectedDeptId]);

  // Calculate metrics
  const {
    avgPhysical,
    avgFinancial,
    ratio,
    donutData,
    optimalCount,
    lagCount,
    divergenceCount,
    healthStatus,
    healthColor,
  } = useMemo(() => {
    const list = filteredProjects.length > 0 ? filteredProjects : projects;
    const total = list.length || 1;

    let totalPhys = 0;
    let totalFin = 0;
    let optimal = 0;
    let minorLag = 0;
    let criticalLag = 0;

    list.forEach((p) => {
      const phys = p.physicalProgress || 0;
      const fin =
        p.financialProgress !== undefined
          ? p.financialProgress
          : p.allocatedBudget > 0
          ? Math.min(100, Math.round((p.expenditure / p.allocatedBudget) * 100))
          : 0;

      totalPhys += phys;
      totalFin += fin;

      const delta = phys - fin; // positive = ahead or synced; negative = money spent faster than physical works
      if (delta >= -3) {
        optimal++;
      } else if (delta >= -12) {
        minorLag++;
      } else {
        criticalLag++;
      }
    });

    const avgP = Math.round(totalPhys / total);
    const avgF = Math.max(1, Math.round(totalFin / total));
    const rawRatio = Number((avgP / avgF).toFixed(2));

    let status = 'BALANCED ABSORPTION';
    let color = 'text-emerald-400';
    if (rawRatio >= 1.05) {
      status = 'HIGH EXECUTION EFFICIENCY';
      color = 'text-cyan-400';
    } else if (rawRatio < 0.85) {
      status = 'PHYSICAL LAG RISK';
      color = 'text-rose-400';
    } else if (rawRatio < 0.95) {
      status = 'MODERATE EXPENDITURE GAP';
      color = 'text-amber-400';
    }

    const chartData = [
      { name: 'Optimal Physical Sync', value: optimal, color: '#10b981' },
      { name: 'Minor Velocity Gap', value: minorLag, color: '#00C9C8' },
      { name: 'Critical Physical Lag', value: criticalLag, color: '#f43f5e' },
    ].filter((d) => d.value > 0);

    return {
      avgPhysical: avgP,
      avgFinancial: avgF,
      ratio: rawRatio,
      donutData: chartData,
      optimalCount: optimal,
      lagCount: minorLag,
      divergenceCount: criticalLag,
      healthStatus: status,
      healthColor: color,
    };
  }, [filteredProjects, projects]);

  return (
    <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div>
        {/* Header & Filter */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Project Health
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              GFR Form 12-C
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              id="select-project-health-dept"
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="px-2 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 focus:outline-none focus:border-cyan-500/50 max-w-[130px] truncate"
              title="Filter by department"
            >
              <option value="ALL">All Depts ({projects.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="mt-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Completion vs Outlay Ratio
            </h3>
            <span className={`text-[10px] font-extrabold uppercase font-mono ${healthColor}`}>
              {ratio}x Index
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Ratio of physical milestone completion ({avgPhysical}%) against financial outlay ({avgFinancial}%).
          </p>
        </div>

        {/* Donut Chart with Center Metric */}
        <div className="relative my-3 h-40 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={62}
                paddingAngle={4}
                stroke="#18181b"
                strokeWidth={2}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#27272a',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  color: '#fff',
                }}
                formatter={(value: any, name: any) => [`${value} Projects`, name]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Centered Metric Label */}
          <div className="absolute inset-0 m-auto w-24 h-24 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xl font-extrabold text-white tracking-tight leading-none">
              {ratio}x
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-1">
              Sync Ratio
            </span>
          </div>
        </div>

        {/* Key Indicators Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
            <span className="text-[9px] uppercase font-bold text-emerald-400 block truncate">
              Optimal Sync
            </span>
            <span className="text-sm font-extrabold text-white mt-0.5 block font-mono">
              {optimalCount}
            </span>
            <span className="text-[9px] text-zinc-500 block">≥ Milestone</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
            <span className="text-[9px] uppercase font-bold text-cyan-400 block truncate">
              Mild Gap
            </span>
            <span className="text-sm font-extrabold text-white mt-0.5 block font-mono">
              {lagCount}
            </span>
            <span className="text-[9px] text-zinc-500 block">&lt; 10% delta</span>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 text-center">
            <span className="text-[9px] uppercase font-bold text-rose-400 block truncate">
              Physical Lag
            </span>
            <span className="text-sm font-extrabold text-rose-400 mt-0.5 block font-mono">
              {divergenceCount}
            </span>
            <span className="text-[9px] text-zinc-500 block">&gt; 12% lag</span>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-zinc-400 font-medium">{healthStatus}</span>
        </div>
        <button
          onClick={() => onNavigate('/projects')}
          className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors flex items-center gap-1 text-[11px]"
        >
          <span>Projects</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
