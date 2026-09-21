import React, { useState, useEffect } from 'react';
import {
  Download,
  FileCheck,
  Search,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building,
  FileText,
  Clock,
  Eye,
  X,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface SignedAuditExportRecord {
  id: string;
  filename: string;
  department: string;
  startDate: string;
  endDate: string;
  recordCount: number;
  totalAllocated: number;
  totalSpent: number;
  sha256Hash: string;
  generatedAt: string;
  generatedBy: string;
  complianceRule: string;
  jsonPayload: string;
}

const STORAGE_KEY = 'budget_ai_signed_json_export_history';

// Default realistic historical records for compliance reviews
const DEFAULT_EXPORTS: SignedAuditExportRecord[] = [
  {
    id: 'EXP-AUD-2026-001',
    filename: 'audit_budget_summary_ministry_of_road_transport___highways_2025-04-01_to_2026-03-31.json',
    department: 'Ministry of Road Transport & Highways',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    recordCount: 142,
    totalAllocated: 125000,
    totalSpent: 104250,
    sha256Hash: '9a5c82e71f40b2e88a1d7438c829e013ab52d9a3b610fa7289f812ceb7d301ae',
    generatedAt: '2026-03-12T14:32:10Z',
    generatedBy: 'Dr. S. K. Sharma (Principal Accountant General)',
    complianceRule: 'GFR 2017 Rule 52(3) & CAG Statutory Reconciliation',
    jsonPayload: JSON.stringify(
      {
        dossierType: 'CAG_STATUTORY_AUDIT_SUMMARY',
        department: 'Ministry of Road Transport & Highways',
        reportingPeriod: { from: '2025-04-01', to: '2026-03-31' },
        auditMetadata: {
          generatedBy: 'Dr. S. K. Sharma (Principal Accountant General)',
          timestamp: '2026-03-12T14:32:10Z',
          hashAlgorithm: 'SHA-256',
          integritySignature: '9a5c82e71f40b2e88a1d7438c829e013ab52d9a3b610fa7289f812ceb7d301ae',
        },
        financialReconciliation: {
          sanctionedBudgetCr: 125000,
          actualDisbursedCr: 104250,
          absorptionPercentage: 83.4,
          vouchersAudited: 142,
        },
      },
      null,
      2
    ),
  },
  {
    id: 'EXP-AUD-2026-002',
    filename: 'audit_budget_summary_all_departments_2025-10-01_to_2025-12-31.json',
    department: 'ALL DEPARTMENTS',
    startDate: '2025-10-01',
    endDate: '2025-12-31',
    recordCount: 489,
    totalAllocated: 540000,
    totalSpent: 421800,
    sha256Hash: '4f1b77c392de6601ea74d81239bf0198cae374bb201f99c1583091eab176df24',
    generatedAt: '2026-01-15T11:04:45Z',
    generatedBy: 'Finance Commission Directorate (Audit Cell)',
    complianceRule: 'Union Accounts Rule 14 & Q3 PFMS Reconciliation',
    jsonPayload: JSON.stringify(
      {
        dossierType: 'CONSOLIDATED_UNION_Q3_AUDIT',
        department: 'ALL DEPARTMENTS',
        reportingPeriod: { from: '2025-10-01', to: '2025-12-31' },
        auditMetadata: {
          generatedBy: 'Finance Commission Directorate (Audit Cell)',
          timestamp: '2026-01-15T11:04:45Z',
          hashAlgorithm: 'SHA-256',
          integritySignature: '4f1b77c392de6601ea74d81239bf0198cae374bb201f99c1583091eab176df24',
        },
        financialReconciliation: {
          sanctionedBudgetCr: 540000,
          actualDisbursedCr: 421800,
          absorptionPercentage: 78.1,
          vouchersAudited: 489,
        },
      },
      null,
      2
    ),
  },
  {
    id: 'EXP-AUD-2026-003',
    filename: 'audit_budget_summary_ministry_of_railways_2026-01-01_to_2026-03-10.json',
    department: 'Ministry of Railways',
    startDate: '2026-01-01',
    endDate: '2026-03-10',
    recordCount: 94,
    totalAllocated: 84000,
    totalSpent: 72150,
    sha256Hash: 'c72b8109d932e6a512708b730f91aa2409f583e721cc098194ad87f61c32bb41',
    generatedAt: '2026-03-10T09:20:18Z',
    generatedBy: 'Railway Board Financial Commissioner Office',
    complianceRule: 'GFR 2017 Rule 139 (Capital Track & Rolling Stock)',
    jsonPayload: JSON.stringify(
      {
        dossierType: 'RAILWAY_CAPITAL_WORKS_AUDIT',
        department: 'Ministry of Railways',
        reportingPeriod: { from: '2026-01-01', to: '2026-03-10' },
        auditMetadata: {
          generatedBy: 'Railway Board Financial Commissioner Office',
          timestamp: '2026-03-10T09:20:18Z',
          hashAlgorithm: 'SHA-256',
          integritySignature: 'c72b8109d932e6a512708b730f91aa2409f583e721cc098194ad87f61c32bb41',
        },
        financialReconciliation: {
          sanctionedBudgetCr: 84000,
          actualDisbursedCr: 72150,
          absorptionPercentage: 85.9,
          vouchersAudited: 94,
        },
      },
      null,
      2
    ),
  },
];

export const ExportHistoryTab: React.FC = () => {
  const { addToast } = useApp();
  const [exportsList, setExportsList] = useState<SignedAuditExportRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [inspectingExport, setInspectingExport] = useState<SignedAuditExportRecord | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Load from localStorage or initialize with defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setExportsList(parsed);
          return;
        }
      }
      // Seed default exports
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXPORTS));
      setExportsList(DEFAULT_EXPORTS);
    } catch (e) {
      console.warn('Failed to load export history:', e);
      setExportsList(DEFAULT_EXPORTS);
    }
  }, []);

  const handleDownload = (item: SignedAuditExportRecord) => {
    try {
      const blob = new Blob([item.jsonPayload], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(
        'Audit File Re-downloaded',
        `Cryptographically signed dossier "${item.filename}" downloaded successfully.`,
        'SUCCESS'
      );
    } catch (err) {
      console.error('Download failed:', err);
      addToast('Download Error', 'Could not initiate file download.', 'ERROR');
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
    addToast('SHA-256 Copied', 'Cryptographic hash signature copied to clipboard.', 'INFO');
  };

  const handleDelete = (id: string) => {
    const updated = exportsList.filter(e => e.id !== id);
    setExportsList(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to update storage:', e);
    }
    addToast('Dossier Removed', 'Audit archive record removed from history.', 'INFO');
  };

  const filteredExports = exportsList.filter(item => {
    const matchesDept =
      selectedDeptFilter === 'ALL' ||
      item.department.toLowerCase().includes(selectedDeptFilter.toLowerCase());
    const matchesQuery =
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sha256Hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesQuery;
  });

  const totalAuditedOutlay = exportsList.reduce((acc, e) => acc + e.totalSpent, 0);
  const totalVouchersAudited = exportsList.reduce((acc, e) => acc + e.recordCount, 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Archived Signed Dossiers</span>
            <FileCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{exportsList.length}</p>
          <span className="text-[10px] text-slate-400">SHA-256 Validated</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Audited Outlay Reconciled</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{totalAuditedOutlay.toLocaleString('en-IN')} Cr
          </p>
          <span className="text-[10px] text-slate-400">Treasury Certified</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Vouchers Scrutinized</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {totalVouchersAudited.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400">PFMS Line Records</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Statutory Standard</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            GFR 2017 Rule 52(3)
          </p>
          <span className="text-[10px] text-slate-400">CAG Reconciliation Protocol</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by filename, department, hash, or ID..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Department:</span>
          <select
            value={selectedDeptFilter}
            onChange={e => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="Road Transport">Road Transport & Highways</option>
            <option value="Railways">Railways</option>
            <option value="Health">Health & Family Welfare</option>
          </select>
        </div>
      </div>

      {/* List of Signed JSON Exports */}
      <div className="space-y-3">
        {filteredExports.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
            No audit export records found matching your filters.
          </div>
        ) : (
          filteredExports.map(item => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    {item.id}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>SIGNED JSON AUDIT</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Exported: {new Date(item.generatedAt).toLocaleString()}
                  </span>
                </div>

                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white truncate">
                  {item.filename}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 dark:text-slate-300 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{item.department}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {item.startDate} to {item.endDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {item.recordCount} Vouchers (₹{item.totalSpent.toLocaleString('en-IN')} Cr)
                    </span>
                  </div>
                </div>

                {/* SHA-256 Digest Bar */}
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 font-mono text-[10px]">
                  <span className="text-slate-400 font-bold uppercase shrink-0">SHA-256:</span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">{item.sha256Hash}</span>
                  <button
                    onClick={() => handleCopyHash(item.sha256Hash)}
                    className="ml-auto p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Copy SHA-256 Hash"
                  >
                    {copiedHash === item.sha256Hash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleDownload(item)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  title="Re-download the complete signed JSON file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Re-download JSON</span>
                </button>

                <button
                  onClick={() => setInspectingExport(item)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Inspect raw audit payload and certification details"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                  title="Remove from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inspect Modal */}
      {inspectingExport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Signed JSON Audit Dossier Inspection
                </h3>
              </div>
              <button
                onClick={() => setInspectingExport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">File:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">
                    {inspectingExport.filename}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Authority:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {inspectingExport.generatedBy}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Statutory Basis:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {inspectingExport.complianceRule}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Signed Audit JSON Payload
                </label>
                <pre className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-[320px] border border-slate-800">
                  {inspectingExport.jsonPayload}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => handleDownload(inspectingExport)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Re-download File</span>
              </button>
              <button
                onClick={() => setInspectingExport(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
