import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Scheme } from '../types';
import {
  Boxes,
  Search,
  Filter,
  Users,
  Building,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';

export const SchemesPage: React.FC = () => {
  const { schemes, departments, projects, financialYear } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  const filtered = schemes.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || (s.type || s.category) === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Central Sector & Sponsored Schemes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tracking program outlays, central vs. state matching shares, and beneficiary delivery targets.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-search-schemes"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search schemes by name or code..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Scheme Type:</span>
          <select
            id="select-scheme-type-filter"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="CENTRAL_SECTOR">Central Sector (100% Central)</option>
            <option value="CENTRALLY_SPONSORED">Centrally Sponsored (Cost-Sharing)</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 ml-auto font-medium">
          Showing {filtered.length} of {schemes.length} schemes
        </div>
      </div>

      {/* Scheme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => {
          const isLow = s.utilizationPercentage < 60;
          return (
            <div
              key={s.id}
              onClick={() => setSelectedScheme(s)}
              className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {s.code}
                    </span>
                    <h3 className="font-semibold text-xs text-slate-900 dark:text-white mt-1 line-clamp-1">
                      {s.name}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold whitespace-nowrap ${
                      isLow
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {s.utilizationPercentage}%
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 space-y-0.5 mb-3">
                  <p className="flex items-center gap-1 truncate">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>{s.departmentName}</span>
                  </p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                    {((s.type || s.category) || '').replace(/_/g, ' ')}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isLow ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(s.utilizationPercentage, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-850 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Allocated</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{s.allocatedBudget} Cr
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Utilized</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{s.utilizedBudget} Cr
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>Target: {s.beneficiariesTarget?.toLocaleString('en-IN') || 'N/A'}</span>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Achieved: {s.beneficiariesAchieved?.toLocaleString('en-IN') || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                <span>View Scheme Dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
