import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { checkAllDepartmentThresholds, ThresholdAlertItem } from '../../utils/thresholdAlerts';
import {
  AlertTriangle,
  AlertOctagon,
  BellRing,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  CheckCircle2,
  TrendingUp,
  X,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

interface BudgetThresholdAlertBannerProps {
  onNavigate?: (route: string) => void;
}

export const BudgetThresholdAlertBanner: React.FC<BudgetThresholdAlertBannerProps> = ({
  onNavigate,
}) => {
  const { departments, addToast, runBudgetThresholdAudit, addExpenditure } = useApp();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-41'); // DAE at 79.4% or similar
  const [simAmount, setSimAmount] = useState<number>(20);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  // Evaluate current department threshold alerts
  const alerts: ThresholdAlertItem[] = checkAllDepartmentThresholds(departments);
  const criticalAlerts = alerts.filter((a) => a.level === 'CRITICAL_95');
  const warningAlerts = alerts.filter((a) => a.level === 'WARNING_80');

  // Trigger manual threshold audit with toasts
  const handleTriggerAudit = () => {
    setIsAuditing(true);
    runBudgetThresholdAudit(true);
    setTimeout(() => setIsAuditing(false), 800);
  };

  // Simulate an expenditure to cross a threshold in real-time
  const handleSimulateDisbursement = async () => {
    const targetDept = departments.find((d) => d.id === selectedDeptId);
    if (!targetDept) return;

    await addExpenditure({
      departmentId: targetDept.id,
      departmentCode: targetDept.code,
      departmentName: targetDept.name,
      amount: simAmount,
      purpose: `Automated PFMS Threshold Stress Test Disbursement`,
      category: 'CAPEX',
      schemeName: 'Infrastructure Emergency Sanction',
    });

    addToast(
      'Test Disbursement Executed',
      `Disbursed ₹${simAmount} Cr to ${targetDept.code}. Department utilization recomputed.`,
      'INFO'
    );
  };

  if (alerts.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-emerald-500/20 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span className="font-semibold">All Departments Within Safe Thresholds (&lt;80% Absorbed)</span>
        </div>
        <button
          onClick={handleTriggerAudit}
          className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-1.5"
        >
          <BellRing className="w-3.5 h-3.5 text-indigo-400" />
          <span>Audit Thresholds</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="budget-threshold-alert-banner"
      className="rounded-3xl border border-rose-500/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 shadow-2xl overflow-hidden transition-all"
    >
      {/* Top Alert Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0 mt-0.5 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Budget Threshold Alert Active
              </span>
              <span className="text-xs text-zinc-400">
                GFR Rule 60 Compliance Surveillance
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-1 flex items-center gap-2">
              <span>
                {criticalAlerts.length} Critical (&gt;95%) & {warningAlerts.length} Warning (&gt;80%) Department Thresholds Exceeded
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
              Automated fiscal ceiling triggers notify financial advisors when expenditures breach statutory milestones.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0 flex-wrap">
          <button
            id="trigger-threshold-toasts-btn"
            onClick={handleTriggerAudit}
            disabled={isAuditing}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            title="Fire toast notifications for all departments exceeding 80% or 95% budget limits"
          >
            <BellRing className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>Trigger Toast Alerts</span>
          </button>

          <button
            onClick={() => setIsSimulatorOpen((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Threshold Crossing</span>
          </button>

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
            aria-label={isExpanded ? 'Collapse Alert Panel' : 'Expand Alert Panel'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Interactive Threshold Simulator Flyout */}
      {isSimulatorOpen && (
        <div className="p-4 bg-zinc-950/90 border-b border-zinc-800/80 animate-fadeIn">
          <div className="max-w-2xl flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Select Department to Test Real-Time Threshold Alert
              </label>
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {departments.map((d) => {
                  const pct = ((d.utilizedBudget / d.allocatedBudget) * 100).toFixed(1);
                  return (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name} ({pct}% utilized, ₹{d.utilizedBudget}/₹{d.allocatedBudget} Cr)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="w-28">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Amount (₹ Cr)
              </label>
              <input
                type="number"
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                min={5}
                max={500}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="sm:self-end">
              <button
                onClick={handleSimulateDisbursement}
                className="w-full px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate & Fire Alert</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Breakdown Cards */}
      {isExpanded && (
        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Critical 95%+ Exceeded Departments */}
          {criticalAlerts.map((alert) => (
            <div
              key={alert.departmentId}
              className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 relative overflow-hidden group hover:border-rose-500 transition-all shadow-md"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  <span>CRITICAL (95%+)</span>
                </span>
                <span className="text-sm font-black text-rose-400 font-mono">
                  {alert.utilizationPercentage}%
                </span>
              </div>

              <h4 className="text-xs font-bold text-zinc-100 truncate">{alert.departmentName}</h4>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Code: {alert.code}</p>

              {/* Progress bar */}
              <div className="w-full bg-zinc-900 rounded-full h-2 my-2.5 overflow-hidden border border-zinc-800">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, alert.utilizationPercentage)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2">
                <span>
                  Exp: <strong className="text-rose-300 font-mono">₹{alert.utilizedBudget} Cr</strong>
                </span>
                <span>
                  Budget: <strong className="text-zinc-200 font-mono">₹{alert.allocatedBudget} Cr</strong>
                </span>
              </div>

              <div className="text-[10px] text-rose-300/90 mt-2 bg-rose-950/40 p-2 rounded-xl border border-rose-900/50">
                <strong>Deficit Threat:</strong> Buffer remaining is only ₹{alert.remainingBudget} Cr. Immediate statutory fund freeze or reappropriation warrant required.
              </div>
            </div>
          ))}

          {/* Warning 80%+ Exceeded Departments */}
          {warningAlerts.map((alert) => (
            <div
              key={alert.departmentId}
              className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 hover:border-amber-500/60 transition-all shadow-md"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>WARNING (80%+)</span>
                </span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  {alert.utilizationPercentage}%
                </span>
              </div>

              <h4 className="text-xs font-bold text-zinc-100 truncate">{alert.departmentName}</h4>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Code: {alert.code}</p>

              {/* Progress bar */}
              <div className="w-full bg-zinc-900 rounded-full h-2 my-2.5 overflow-hidden border border-zinc-800">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, alert.utilizationPercentage)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 border-t border-zinc-800/80 pt-2">
                <span>
                  Exp: <strong className="text-amber-300 font-mono">₹{alert.utilizedBudget} Cr</strong>
                </span>
                <span>
                  Budget: <strong className="text-zinc-200 font-mono">₹{alert.allocatedBudget} Cr</strong>
                </span>
              </div>

              <div className="text-[10px] text-amber-300/80 mt-2 bg-amber-950/30 p-2 rounded-xl border border-amber-900/40">
                <strong>Advisory:</strong> Nearing statutory Q4 limit. Buffer remaining: ₹{alert.remainingBudget} Cr.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer bar with quick navigation */}
      <div className="px-5 py-2.5 bg-zinc-950/70 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Toast notifications will automatically pop whenever any department crosses 80% or 95%.
        </span>
        {onNavigate && (
          <button
            onClick={() => onNavigate('/budget-utilization')}
            className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>Review Full Ministry Ledgers</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
