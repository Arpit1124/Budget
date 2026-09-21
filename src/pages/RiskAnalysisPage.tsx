import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Building,
  TrendingDown,
  Info,
} from 'lucide-react';

export const RiskAnalysisPage: React.FC = () => {
  const { riskScores } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const filtered = riskScores.filter(r => {
    const matchesSearch =
      r.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.departmentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || r.compositeRiskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Institutional Risk Score Matrix
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-medium">
              Multi-Factor Audit Index
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Synthesizing budget utilization velocity, historical lapsing tendencies, contractor audit flags, and milestone delays into composite risk ratings.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-search-risks"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search risk index by department..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Risk Level:</span>
          <select
            id="select-risk-level-filter"
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="CRITICAL">Critical (Score &gt; 80)</option>
            <option value="HIGH">High (Score 60–80)</option>
            <option value="MEDIUM">Medium (Score 40–60)</option>
            <option value="LOW">Low (Score &lt; 40)</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 ml-auto font-medium">
          Showing {filtered.length} of {riskScores.length} evaluated entities
        </div>
      </div>

      {/* Risk Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(r => (
          <div
            key={r.departmentId}
            className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                    {r.departmentCode}
                  </span>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">
                      {r.departmentName}
                    </h3>
                    <span className="text-[10px] text-slate-400">Composite Risk Score</span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      r.compositeRiskLevel === 'CRITICAL'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                        : r.compositeRiskLevel === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    }`}
                  >
                    {r.compositeRiskLevel} ({r.overallScore}/100)
                  </span>
                </div>
              </div>

              {/* Sub-scores Bars */}
              <div className="space-y-2 text-[11px] my-3">
                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-0.5">
                    <span>Utilization Risk (Lagging Absorption)</span>
                    <span className="font-semibold">{r.factors.utilizationRisk}/100</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${r.factors.utilizationRisk}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-0.5">
                    <span>Audit Irregularity Score (Voucher Flags)</span>
                    <span className="font-semibold">{r.factors.auditIrregularityScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-red-500 h-full rounded-full"
                      style={{ width: `${r.factors.auditIrregularityScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-0.5">
                    <span>Milestone Delay Risk (Site Execution)</span>
                    <span className="font-semibold">{r.factors.timelineDelayRisk}/100</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${r.factors.timelineDelayRisk}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Auditor Intervention Recommendations:
              </span>
              <ul className="text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside space-y-0.5">
                {r.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
