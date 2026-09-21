import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BellRing,
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
  Search,
  ExternalLink,
} from 'lucide-react';

interface AlertsPageProps {
  onNavigate: (route: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigate }) => {
  const { alerts, updateAlert } = useApp();
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = alerts.filter(a => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSev = severityFilter === 'ALL' || a.severity === severityFilter;
    return matchesSearch && matchesSev;
  });

  const handleMarkRead = (id: string) => {
    updateAlert(id, { isRead: true });
  };

  const handleDismiss = (id: string) => {
    updateAlert(id, { status: 'DISMISSED' });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            System Alerts & Operational Notifications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated notifications triggered by threshold breaches, milestone delays, and AI surveillance events.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-search-alerts"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search alerts by title or content..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Severity:</span>
          <select
            id="select-alert-severity"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Informational</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 ml-auto font-medium">
          Showing {filtered.length} of {alerts.length} notifications
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filtered.map(a => (
          <div
            key={a.id}
            className={`p-4 rounded-xl bg-white dark:bg-slate-900 border transition-all ${
              !a.isRead
                ? 'border-l-4 border-l-blue-600 border-slate-200 dark:border-slate-800 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 opacity-80'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      a.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                        : a.severity === 'WARNING'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                    }`}
                  >
                    {a.severity}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{a.alertCode}</span>
                  <span className="text-[10px] text-slate-400">• {a.timestamp}</span>
                </div>

                <h3 className="font-bold text-xs text-slate-900 dark:text-white">{a.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {a.message}
                </p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {!a.isRead && (
                  <button
                    onClick={() => handleMarkRead(a.id)}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium transition-colors"
                  >
                    Mark as Read
                  </button>
                )}
                {a.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleDismiss(a.id)}
                    className="px-2.5 py-1 text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
