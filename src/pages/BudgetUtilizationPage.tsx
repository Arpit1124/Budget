import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Department } from '../types';
import {
  Search,
  Filter,
  Download,
  Building2,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  PieChart,
  ArrowUpDown,
  X,
} from 'lucide-react';

export const BudgetUtilizationPage: React.FC = () => {
  const { departments, projects, schemes, financialYear } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  const sectors = Array.from(
    new Set(
      departments
        .map(d => d.sector)
        .filter((s): s is string => Boolean(s && typeof s === 'string' && s.trim().length > 0))
    )
  ).sort();

  const filtered = departments.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'ALL' || d.sector === sectorFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'LOW' && d.utilizationPercentage < 60) ||
      (statusFilter === 'ON_TRACK' && d.utilizationPercentage >= 60 && d.utilizationPercentage <= 85) ||
      (statusFilter === 'HIGH' && d.utilizationPercentage > 85);

    return matchesSearch && matchesSector && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ['Department Code', 'Department Name', 'Sector', 'Allocated Budget (Cr)', 'Utilized Budget (Cr)', 'Remaining (Cr)', 'Utilization Rate (%)', 'Risk Level'];
    const rows = filtered.map(d => [
      d.code,
      `"${(d.name || '').replace(/"/g, '""')}"`,
      d.sector,
      d.allocatedBudget,
      d.utilizedBudget,
      d.remainingBudget,
      d.utilizationPercentage,
      d.riskLevel,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BudgetAI_Gov_Utilization_FY_${financialYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Department Budget Utilization Matrix
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              FY {financialYear}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Tracking expenditure absorption across 48 ministries against Union Budget allocations.
          </p>
        </div>
        <button
          id="btn-export-utilization-csv"
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-2xl text-xs font-medium transition-colors self-start sm:self-auto shadow-md"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
          <input
            id="input-search-department"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by department name or code..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 font-medium">Sector:</span>
          <select
            id="select-filter-sector"
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option key="ALL" value="ALL" className="bg-zinc-900">All Sectors</option>
            {sectors.map(sec => (
              <option key={sec} value={sec} className="bg-zinc-900">
                {sec}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 font-medium">Status:</span>
          <select
            id="select-filter-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option key="ALL" value="ALL" className="bg-zinc-900">All Statuses</option>
            <option key="LOW" value="LOW" className="bg-zinc-900">Lagging / Low (&lt;60%)</option>
            <option key="ON_TRACK" value="ON_TRACK" className="bg-zinc-900">On Track (60%–85%)</option>
            <option key="HIGH" value="HIGH" className="bg-zinc-900">High / Surpassing (&gt;85%)</option>
          </select>
        </div>

        <div className="text-xs text-zinc-400 ml-auto font-medium">
          Showing {filtered.length} of {departments.length} departments
        </div>
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(dept => {
          const isLow = dept.utilizationPercentage < 60;
          const isHigh = dept.utilizationPercentage > 85;

          return (
            <div
              key={dept.id}
              onClick={() => setSelectedDept(dept)}
              className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                      {dept.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {dept.name}
                      </h3>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{dept.sector}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap ${
                      isLow
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : isHigh
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {dept.utilizationPercentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-950 border border-zinc-800/80 h-2.5 rounded-full overflow-hidden mt-3 mb-3 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLow ? 'bg-amber-400' : isHigh ? 'bg-indigo-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(dept.utilizationPercentage, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-3 border-t border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Allocated</span>
                    <span className="font-bold text-zinc-200">
                      ₹{dept.allocatedBudget} Cr
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Utilized</span>
                    <span className="font-bold text-emerald-400">
                      ₹{dept.utilizedBudget} Cr
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px] uppercase tracking-wider">Remaining</span>
                    <span className="font-bold text-zinc-400">
                      ₹{dept.remainingBudget} Cr
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <span>{dept.projectCount} Projects</span>
                  <span>•</span>
                  <span>{dept.schemeCount} Schemes</span>
                </div>
                <span className="text-indigo-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Deep-dive <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Deep-Dive Drawer/Modal */}
      {selectedDept && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                    {selectedDept.code}
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {selectedDept.name}
                  </h2>
                </div>
                <p className="text-xs text-zinc-400">
                  Sector: {selectedDept.sector} • FY {financialYear}
                </p>
              </div>
              <button
                onClick={() => setSelectedDept(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Allocated</p>
                  <p className="text-base font-extrabold text-white mt-1">
                    ₹{selectedDept.allocatedBudget} Cr
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Utilized</p>
                  <p className="text-base font-extrabold text-emerald-400 mt-1">
                    ₹{selectedDept.utilizedBudget} Cr
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Absorption</p>
                  <p className="text-base font-extrabold text-indigo-400 mt-1">
                    {selectedDept.utilizationPercentage}%
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Risk Rating</p>
                  <p
                    className={`text-base font-extrabold mt-1 ${
                      selectedDept.riskLevel === 'CRITICAL'
                        ? 'text-rose-400'
                        : selectedDept.riskLevel === 'HIGH'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedDept.riskLevel}
                  </p>
                </div>
              </div>

              {/* Associated Schemes */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300 mb-3">
                  Key Department Schemes
                </h3>
                <div className="space-y-2">
                  {schemes
                    .filter(s => s.departmentId === selectedDept.id)
                    .map(s => (
                      <div
                        key={s.id}
                        className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{s.name}</p>
                          <p className="text-[11px] text-zinc-500">{((s.type || s.category) || '').replace(/_/g, ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-400">
                            {s.utilizationPercentage}% Utilized
                          </p>
                          <p className="text-[10px] text-zinc-500">
                            ₹{s.utilizedBudget} of ₹{s.allocatedBudget} Cr
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Major Projects Under this Department */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300 mb-3">
                  Major Active Projects
                </h3>
                <div className="space-y-2">
                  {projects
                    .filter(p => p.departmentId === selectedDept.id)
                    .slice(0, 4)
                    .map(p => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-white">{p.name}</span>
                          <span className="text-[10px] text-zinc-500">{p.location}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>Physical: <strong className="text-zinc-200">{p.physicalProgress}%</strong></span>
                          <span>Financial: <strong className="text-zinc-200">{p.financialProgress}%</strong></span>
                          <span>Sanctioned: <strong className="text-indigo-400">₹{p.sanctionedCost} Cr</strong></span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedDept(null)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Deep-Dive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
