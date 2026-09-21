import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Shield,
  Sliders,
  Server,
  Users,
  RotateCcw,
  CheckCircle,
  Activity,
  Calendar,
  Lock,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { financialYear, setFinancialYear, switchScenario, scenario, refreshAll } = useApp();
  const { user } = useAuth();

  const [marchRushThreshold, setMarchRushThreshold] = useState(30);
  const [mismatchThreshold, setMismatchThreshold] = useState(25);
  const [tenderExemptLimit, setTenderExemptLimit] = useState(5.0);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleResetBaseline = async () => {
    await switchScenario('BASELINE');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            System Administration & Policy Controls
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure financial thresholds, compliance bounds, user directories, and external treasury integration connectors.
          </p>
        </div>

        <button
          onClick={handleResetBaseline}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Baseline Data</span>
        </button>
      </div>

      {/* Grid of Admin Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: System Status & FY */}
        <div className="space-y-6">
          {/* Active Financial Year Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-xs text-slate-900 dark:text-white">
                Active Financial Year Cycle
              </h2>
            </div>
            <p className="text-[11px] text-slate-500">
              Active operating fiscal year for appropriation accounts and parliamentary sanctions.
            </p>

            <div className="flex items-center gap-2">
              <select
                value={financialYear}
                onChange={e => setFinancialYear(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="2025-26">FY 2025-26 (Union Current Budget)</option>
                <option value="2024-25">FY 2024-25 (Audited Financial Year)</option>
                <option value="2026-27">FY 2026-27 (Upcoming Appropriation)</option>
              </select>
            </div>
          </div>

          {/* Infrastructure Health */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-xs text-slate-900 dark:text-white">
                System Health & Bridges
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-850">
                <span className="text-slate-600 dark:text-slate-300">Gemini 3.8 Flash AI Model</span>
                <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> OPERATIONAL
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-850">
                <span className="text-slate-600 dark:text-slate-300">PFMS Treasury Core Feed</span>
                <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> CONNECTED
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-850">
                <span className="text-slate-600 dark:text-slate-300">GeM Procurement Gateway</span>
                <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> CONNECTED
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-850">
                <span className="text-slate-600 dark:text-slate-300">CAG Audit Ledger Vault</span>
                <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> SYNCHRONIZED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle/Right Column: Compliance Thresholds & RBAC */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-xs text-slate-900 dark:text-white">
                  Compliance Rule Engine & AI Thresholds (GFR 2017)
                </h2>
              </div>
              {isSaved && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Settings Saved!
                </span>
              )}
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                  <span>March Rush Q4 Velocity Threshold:</span>
                  <span className="font-bold">{marchRushThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={marchRushThreshold}
                  onChange={e => setMarchRushThreshold(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Flags an alert if more than {marchRushThreshold}% of annual budget is spent in Q4/March.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                  <span>Physical vs. Financial Divergence Limit:</span>
                  <span className="font-bold">{mismatchThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={mismatchThreshold}
                  onChange={e => setMismatchThreshold(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Triggers an audit flag when financial disbursement exceeds physical completion by {mismatchThreshold}%.
                </p>
              </div>

              <div>
                <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                  <span>Mandatory e-Tendering Ceiling (GFR Rule 149):</span>
                  <span className="font-bold">₹{tenderExemptLimit} Lakhs</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={tenderExemptLimit}
                  onChange={e => setTenderExemptLimit(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Repeated purchases right under ₹{tenderExemptLimit} Lakhs are scrutinized for artificial tender splitting.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Commit Rule Parameters
              </button>
            </div>
          </form>

          {/* User Directory & Role Matrix */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-xs text-slate-900 dark:text-white">
                Institutional Role Authorization (RBAC)
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">SUPER_ADMIN / GOV_ADMIN</p>
                  <p className="text-[10px] text-slate-400">Full system override, budget freeze/unfreeze, GFR policy updates.</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 font-bold">
                  UNRESTRICTED
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">FINANCE_OFFICER</p>
                  <p className="text-[10px] text-slate-400">Budget approval, tranche release authorization, allocation reviews.</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 font-bold">
                  APPROVER
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">AUDITOR (CAG)</p>
                  <p className="text-[10px] text-slate-400">Audit investigations, anomaly resolution, compliance dossier export.</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 font-bold">
                  INSPECTOR
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
