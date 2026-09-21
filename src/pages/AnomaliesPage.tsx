import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { AIAnomaly } from '../types';
import { HistoricalBaselineOverlayChart } from '../components/anomalies/HistoricalBaselineOverlayChart';
import { RealtimeAnomalyNotificationService } from '../components/anomalies/RealtimeAnomalyNotificationService';
import { AnomalyDeepDiveModal } from '../components/anomalies/AnomalyDeepDiveModal';
import {
  AlertOctagon,
  Sparkles,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ShieldAlert,
  Building,
  ArrowRight,
  X,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AnomaliesPage: React.FC = () => {
  const { anomalies, resolveAnomaly, expenditures } = useApp();
  const { hasRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAnomaly, setSelectedAnomaly] = useState<AIAnomaly | null>(null);
  const [deepDiveAnomaly, setDeepDiveAnomaly] = useState<AIAnomaly | null>(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [isChartVisible, setIsChartVisible] = useState(true);

  const canResolve = hasRole(['SUPER_ADMIN', 'GOVERNMENT_ADMIN', 'AUDITOR']);

  const filtered = anomalies.filter(a => {
    const matchesSearch =
      a.anomalyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleResolve = (status: 'RESOLVED' | 'DISMISSED') => {
    if (!selectedAnomaly) return;
    resolveAnomaly(selectedAnomaly.id, status);
    setSelectedAnomaly(null);
    setAuditNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              AI Anomaly & Fraud Risk Watchdog
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Automated Surveillance
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Machine intelligence models scanning vouchers for split tenders, March rushes, phantom vendors, and GFR violations.
          </p>
        </div>

        <button
          id="btn-toggle-baseline-d3-chart"
          onClick={() => setIsChartVisible(!isChartVisible)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-semibold transition-all self-start sm:self-auto shadow-md"
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>{isChartVisible ? 'Hide D3 Baseline Comparison' : 'Compare Spending vs Baseline (D3)'}</span>
          {isChartVisible ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Real-time Browser Alert & Notification Service */}
      <RealtimeAnomalyNotificationService onSelectAnomaly={dept => setSearchTerm(dept)} />

      {/* D3 Historical Baseline Area Chart Overlay */}
      {isChartVisible && (
        <HistoricalBaselineOverlayChart />
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
          <input
            id="input-search-anomalies"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search anomalies by ID, Department, or Reason..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 font-medium">Severity:</span>
          <select
            id="select-anomaly-severity-filter"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900">All Severities</option>
            <option value="CRITICAL" className="bg-zinc-900">Critical</option>
            <option value="WARNING" className="bg-zinc-900">Warning</option>
            <option value="INFO" className="bg-zinc-900">Informational</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 font-medium">Status:</span>
          <select
            id="select-anomaly-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900">All Statuses</option>
            <option value="ACTIVE" className="bg-zinc-900">Active</option>
            <option value="RESOLVED" className="bg-zinc-900">Resolved</option>
            <option value="DISMISSED" className="bg-zinc-900">Dismissed</option>
          </select>
        </div>

        <div className="text-xs text-zinc-400 ml-auto font-medium">
          Showing {filtered.length} of {anomalies.length} anomaly detections
        </div>
      </div>

      {/* Anomalies List */}
      <div className="space-y-4">
        {filtered.map(a => (
          <div
            key={a.id}
            className={`p-5 rounded-3xl bg-zinc-900 border transition-all ${
              a.status === 'RESOLVED'
                ? 'opacity-65 border-zinc-800'
                : a.severity === 'CRITICAL'
                ? 'border-rose-900/60 shadow-xl'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                    {a.anomalyId}
                  </span>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      a.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : a.severity === 'WARNING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {a.severity}
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700/50">
                    {(a.type || '').replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-zinc-500">Detected: {a.detectedAt}</span>
                </div>

                <p className="text-sm font-bold text-white tracking-tight">
                  {a.reason}
                </p>
                <p className="text-xs text-zinc-400">
                  Dept: <span className="font-semibold text-zinc-200">{a.departmentName}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Flagged Outlay</span>
                  <span className="font-extrabold text-lg text-rose-400">
                    ₹{a.amount} Cr
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeepDiveAnomaly(a)}
                    className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                    title="Run Gemini API Forensic Root-Cause Analysis"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Deep Dive</span>
                  </button>

                  <button
                    onClick={() => setSelectedAnomaly(a)}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Review Dossier
                  </button>

                  {canResolve && a.status === 'ACTIVE' && (
                    <button
                      onClick={() => resolveAnomaly(a.id, 'RESOLVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400">
              <span className="font-bold text-indigo-400">
                AI Advisory Recommendation:{' '}
              </span>
              {a.recommendedAction}
            </div>
          </div>
        ))}
      </div>

      {/* Anomaly Review & Audit Resolution Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertOctagon className="w-5 h-5 text-rose-400" />
                <h2 className="font-bold text-base text-white tracking-tight">
                  Audit Investigation Dossier
                </h2>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <p className="font-mono text-xs font-bold text-indigo-400">
                  {selectedAnomaly.anomalyId}
                </p>
                <p className="font-bold text-white text-sm">{selectedAnomaly.reason}</p>
                <p className="text-zinc-400">
                  Department: <strong className="text-zinc-200">{selectedAnomaly.departmentName}</strong> • Outlay: <strong className="text-rose-400">₹{selectedAnomaly.amount} Cr</strong>
                </p>
              </div>

              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-zinc-300 mb-1.5">
                  Surveillance Engine Finding
                </p>
                <p className="text-zinc-300 leading-relaxed bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
                  {selectedAnomaly.recommendedAction}
                </p>
              </div>

              {canResolve && selectedAnomaly.status === 'ACTIVE' && (
                <div>
                  <label className="block font-bold text-xs uppercase tracking-wider text-zinc-300 mb-1.5">
                    Auditor / Officer Resolution Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={auditNotes}
                    onChange={e => setAuditNotes(e.target.value)}
                    placeholder="Enter official justification, physical audit certificate number, or corrective action taken..."
                    className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2.5 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedAnomaly;
                    setSelectedAnomaly(null);
                    setDeepDiveAnomaly(target);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini Deep Dive</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Close
                </button>

                {canResolve && selectedAnomaly.status === 'ACTIVE' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleResolve('DISMISSED')}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium transition-colors"
                    >
                      Dismiss as False Alarm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve('RESOLVED')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                    >
                      Mark Resolved & Compliant
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Forensic Deep Dive Modal */}
      <AnomalyDeepDiveModal
        anomaly={deepDiveAnomaly}
        linkedExpenditures={
          deepDiveAnomaly
            ? expenditures.filter(
                e => e.departmentName.toLowerCase() === deepDiveAnomaly.departmentName.toLowerCase()
              )
            : []
        }
        isOpen={!!deepDiveAnomaly}
        onClose={() => setDeepDiveAnomaly(null)}
      />
    </div>
  );
};
