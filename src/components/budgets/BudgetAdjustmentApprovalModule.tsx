import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Sliders,
  Send,
  Building,
  Check,
  X,
  ChevronRight,
  UserCheck,
  History,
  ListChecks,
  CheckSquare,
  Square,
  Download,
  Filter,
} from 'lucide-react';

export type AdjustmentStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';

export interface ApprovalStep {
  level: number;
  role: string;
  officerName: string;
  status: 'COMPLETED' | 'IN_REVIEW' | 'WAITING' | 'REJECTED';
  timestamp?: string;
  comments?: string;
}

export interface BudgetAdjustment {
  id: string;
  referenceNumber: string;
  title: string;
  type: 'VIREMENT_INTERNAL' | 'RE_APPROPRIATION' | 'SUPPLEMENTARY_DEMAND';
  sourceDepartment: string;
  targetDepartment: string;
  amount: number; // in ₹ Cr
  initiatedDate: string;
  status: AdjustmentStatus;
  currentLevel: number; // 1: Desk Officer, 2: Joint Secretary, 3: Finance Secretary
  justification: string;
  steps: ApprovalStep[];
}

export const BudgetAdjustmentApprovalModule: React.FC = () => {
  const { hasRole, user } = useAuth();
  const {
    departments,
    adjustments,
    workflowActivityLogs,
    addAdjustment,
    bulkApproveAdjustments,
    bulkRejectAdjustments,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'PROPOSALS' | 'ACTIVITY_LOG'>('PROPOSALS');
  const [selectedAdjustmentId, setSelectedAdjustmentId] = useState<string>(
    adjustments[0]?.id || 'ADJ-2026-001'
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdjustmentStatus>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Bulk action selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [logFilterAction, setLogFilterAction] = useState<string>('ALL');

  // New adjustment form state
  const [formTitle, setFormTitle] = useState('');
  const [formSourceDept, setFormSourceDept] = useState(departments[0]?.name || 'Ministry of Road Transport & Highways');
  const [formTargetDept, setFormTargetDept] = useState(departments[0]?.name || 'Ministry of Road Transport & Highways');
  const [formAmount, setFormAmount] = useState('25.0');
  const [formType, setFormType] = useState<'VIREMENT_INTERNAL' | 'RE_APPROPRIATION' | 'SUPPLEMENTARY_DEMAND'>('VIREMENT_INTERNAL');
  const [formJustification, setFormJustification] = useState('');

  const canApprove = hasRole(['SUPER_ADMIN', 'GOVERNMENT_ADMIN', 'FINANCE_OFFICER']);

  const filteredAdjustments = adjustments.filter(adj => {
    if (statusFilter === 'ALL') return true;
    return adj.status === statusFilter;
  });

  const currentSelection =
    adjustments.find(a => a.id === selectedAdjustmentId) || adjustments[0];

  // Bulk selection helpers
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const pendingIds = filteredAdjustments
      .filter(a => a.status === 'Pending Approval')
      .map(a => a.id);
    if (selectedIds.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await bulkApproveAdjustments(selectedIds, user?.name);
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const reason = prompt(
      `Enter statutory rejection reason for ${selectedIds.length} adjustments:`,
      'Non-compliant with GFR Rule 61(2): Absorption trajectory lagging statutory threshold.'
    );
    if (reason === null) return;

    setIsBulkProcessing(true);
    try {
      await bulkRejectAdjustments(selectedIds, reason, user?.name);
      setSelectedIds([]);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleAdvanceWorkflow = async (adjId: string) => {
    await bulkApproveAdjustments([adjId], user?.name);
  };

  const handleRejectWorkflow = async (adjId: string) => {
    const reason = prompt(
      'Enter statutory grounds for rejection / GFR objection:',
      'Non-compliant with GFR Rule 61(2): Expenditure ceiling exceeded for current quarter.'
    );
    if (reason === null) return;
    await bulkRejectAdjustments([adjId], reason, user?.name);
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    await addAdjustment({
      referenceNumber: `MoF/DEA/PROPOSAL-${Date.now().toString().slice(-4)}`,
      title: formTitle,
      type: formType,
      sourceDepartment: formSourceDept,
      targetDepartment: formTargetDept,
      amount: parseFloat(formAmount) || 10,
      initiatedDate: new Date().toISOString().split('T')[0],
      justification: formJustification || 'Routine quarterly alignment under GFR 2017 rules.',
    });

    setIsCreateModalOpen(false);
    setFormTitle('');
    setFormJustification('');
  };

  // Activity Log CSV Export
  const handleExportActivityLog = () => {
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Timestamp,Action,Adjustment Reference,Performed By,Role,Amount (Cr),Comments\n';
    workflowActivityLogs.forEach(log => {
      csv += `"${log.timestamp}","${log.action}","${log.referenceNumber}","${log.performedBy}","${log.role}","${log.amount || 0}","${(log.comments || '').replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Budget_Workflow_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = workflowActivityLogs.filter(log => {
    if (logFilterAction === 'ALL') return true;
    return log.action.includes(logFilterAction);
  });

  return (
    <div className="space-y-6">
      {/* Module Title & Sub-tabs */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Multi-Level Budget Adjustment & Virement Approval Workflow
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                GFR 2017 Rules 10 & 61
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              End-to-end statutory governance tracking for internal virements, re-appropriations, and parliamentary supplementary grants across 3 tiers of concurrence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-create-adjustment-proposal"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Adjustment Proposal</span>
            </button>
          </div>
        </div>

        {/* Workflow vs Activity Log Tab Switcher */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
          <button
            id="tab-sub-proposals"
            onClick={() => setActiveTab('PROPOSALS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'PROPOSALS'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Adjustment Proposals & Scrutiny Chain</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {adjustments.length}
            </span>
          </button>

          <button
            id="tab-sub-activity-log"
            onClick={() => setActiveTab('ACTIVITY_LOG')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ACTIVITY_LOG'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity Log & Chronological Audit Trail</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
              {workflowActivityLogs.length}
            </span>
          </button>
        </div>

        {/* State Metrics Counter Strip (Shown on proposals tab) */}
        {activeTab === 'PROPOSALS' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-zinc-800/80 border-zinc-600 shadow-xs'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-850'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Total Proposals</span>
              <p className="text-lg font-bold text-white mt-0.5">{adjustments.length}</p>
            </button>

            <button
              onClick={() => setStatusFilter('Draft')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                statusFilter === 'Draft'
                  ? 'bg-zinc-800/80 border-zinc-500 shadow-xs'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-850'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block" /> Draft State
              </span>
              <p className="text-lg font-bold text-zinc-300 mt-0.5">
                {adjustments.filter(a => a.status === 'Draft').length}
              </p>
            </button>

            <button
              onClick={() => setStatusFilter('Pending Approval')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                statusFilter === 'Pending Approval'
                  ? 'bg-amber-950/40 border-amber-600 shadow-xs'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-850'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> Pending Approval
              </span>
              <p className="text-lg font-bold text-amber-400 mt-0.5">
                {adjustments.filter(a => a.status === 'Pending Approval').length}
              </p>
            </button>

            <button
              onClick={() => setStatusFilter('Approved')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                statusFilter === 'Approved'
                  ? 'bg-emerald-950/40 border-emerald-600 shadow-xs'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-850'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved
              </span>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">
                {adjustments.filter(a => a.status === 'Approved').length}
              </p>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'ACTIVITY_LOG' ? (
        /* Activity Log & Audit Trail Tab View */
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Chronological Workflow Activity Log & Audit Trail</h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Immutable record of status transitions, officer concurrences, statutory GFR objections, and bulk actions.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 text-xs">
                <Filter className="w-3.5 h-3.5 text-zinc-400 mr-1.5" />
                <select
                  value={logFilterAction}
                  onChange={e => setLogFilterAction(e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-zinc-900 text-white">All Action Events</option>
                  <option value="APPROV" className="bg-zinc-900 text-white">Approvals</option>
                  <option value="REJECT" className="bg-zinc-900 text-white">Rejections</option>
                  <option value="CREATE" className="bg-zinc-900 text-white">Creations</option>
                </select>
              </div>

              <button
                id="btn-export-activity-log-csv"
                onClick={handleExportActivityLog}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Export Audit Log (CSV)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Proposal Reference</th>
                  <th className="py-3 px-4">Officer & Role</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Statutory Comments & GFR Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No activity log records found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-zinc-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            log.action.includes('APPROV')
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                              : log.action.includes('REJECT')
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                              : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-300 font-semibold whitespace-nowrap">
                        {log.referenceNumber}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.performedBy}</div>
                        <div className="text-[10px] text-zinc-400">{log.role}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                        {log.amount ? `₹${log.amount.toFixed(1)} Cr` : '-'}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 max-w-md">
                        {log.comments || 'Routine procedural workflow transition recorded.'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Main Split Interface: Left List (with Bulk Actions) + Right Interactive Multi-Level Tracker */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Proposals List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Adjustment Registry ({filteredAdjustments.length})
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">Filter: {statusFilter}</span>
            </div>

            {/* Bulk Action Controls Bar (Available to Admins & Finance Officers) */}
            {canApprove && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between gap-2 shadow-xs">
                <button
                  onClick={handleSelectAllFiltered}
                  className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white transition-colors"
                >
                  {selectedIds.length > 0 &&
                  selectedIds.length ===
                    filteredAdjustments.filter(a => a.status === 'Pending Approval').length ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500" />
                  )}
                  <span className="text-[11px] font-medium">
                    {selectedIds.length > 0 ? `Selected (${selectedIds.length})` : 'Select Pending'}
                  </span>
                </button>

                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-bulk-approve"
                      onClick={handleBulkApprove}
                      disabled={isBulkProcessing}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve ({selectedIds.length})</span>
                    </button>

                    <button
                      id="btn-bulk-reject"
                      onClick={handleBulkReject}
                      disabled={isBulkProcessing}
                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject ({selectedIds.length})</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2.5">
              {filteredAdjustments.map(adj => {
                const isSelected = currentSelection?.id === adj.id;
                const isChecked = selectedIds.includes(adj.id);
                return (
                  <div
                    key={adj.id}
                    onClick={() => setSelectedAdjustmentId(adj.id)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative ${
                      isSelected
                        ? 'bg-zinc-800/90 border-indigo-500/80 shadow-lg shadow-indigo-500/5'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {canApprove && adj.status === 'Pending Approval' && (
                          <button
                            onClick={e => handleToggleSelect(adj.id, e)}
                            className="text-zinc-400 hover:text-white"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-600" />
                            )}
                          </button>
                        )}
                        <span className="text-[10px] font-mono text-zinc-400">{adj.referenceNumber}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          adj.status === 'Draft'
                            ? 'bg-zinc-700/50 text-zinc-300 border border-zinc-600'
                            : adj.status === 'Pending Approval'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : adj.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {adj.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-white line-clamp-1">{adj.title}</h3>

                    <div className="flex items-center justify-between text-xs text-zinc-400 mt-2">
                      <span>{adj.sourceDepartment.slice(0, 22)}...</span>
                      <strong className="text-indigo-300 font-bold">₹{adj.amount.toFixed(1)} Cr</strong>
                    </div>

                    {/* Level indication */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>Current Tier: Level {adj.currentLevel} of 3</span>
                      <span>{adj.initiatedDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        {/* Right Column: Active Interactive Multi-Level Tracker */}
        {currentSelection && (
          <div className="lg:col-span-7 p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-6">
            {/* Header of Active Proposal */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-zinc-800 pb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                    {currentSelection.referenceNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                      currentSelection.status === 'Draft'
                        ? 'bg-zinc-700/50 text-zinc-300 border border-zinc-600'
                        : currentSelection.status === 'Pending Approval'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : currentSelection.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    State: {currentSelection.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">{currentSelection.title}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{currentSelection.justification}</p>
              </div>

              <div className="text-right sm:shrink-0 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Proposed Outlay
                </span>
                <span className="text-xl font-extrabold text-white">₹{currentSelection.amount.toFixed(1)} Cr</span>
              </div>
            </div>

            {/* Visual Status Stepper Tracker (Draft -> Pending Approval -> Approved / Rejected) */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Official Workflow Status Tracker
              </span>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {/* Step 1: Draft */}
                <div
                  className={`p-2.5 rounded-xl border flex flex-col items-center ${
                    currentSelection.status === 'Draft'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="text-[10px] font-mono">STAGE 1</span>
                  <span className="font-semibold text-xs mt-0.5">Draft Formulated</span>
                  <span className="text-[10px] text-zinc-500">Under Secretary</span>
                </div>

                {/* Step 2: Pending Approval */}
                <div
                  className={`p-2.5 rounded-xl border flex flex-col items-center ${
                    currentSelection.status === 'Pending Approval'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold animate-pulse'
                      : currentSelection.status === 'Approved'
                      ? 'bg-zinc-900 border-zinc-800 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="text-[10px] font-mono">STAGE 2</span>
                  <span className="font-semibold text-xs mt-0.5">Pending Approval</span>
                  <span className="text-[10px] text-zinc-500">JS&FA Technical Review</span>
                </div>

                {/* Step 3: Approved or Rejected */}
                <div
                  className={`p-2.5 rounded-xl border flex flex-col items-center ${
                    currentSelection.status === 'Approved'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : currentSelection.status === 'Rejected'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="text-[10px] font-mono">STAGE 3</span>
                  <span className="font-semibold text-xs mt-0.5">
                    {currentSelection.status === 'Rejected' ? 'Rejected' : 'Approved'}
                  </span>
                  <span className="text-[10px] text-zinc-500">Finance Secretary Sanction</span>
                </div>
              </div>
            </div>

            {/* 3-Tier Step-by-Step Approval Chain */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Multi-Level Statutory Scrutiny Chain
              </span>

              <div className="space-y-2.5">
                {currentSelection.steps.map(step => {
                  const isDone = step.status === 'COMPLETED';
                  const isCurrent = step.status === 'IN_REVIEW';
                  const isRejected = step.status === 'REJECTED';

                  return (
                    <div
                      key={step.level}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                        isCurrent
                          ? 'bg-amber-950/20 border-amber-500/50'
                          : isDone
                          ? 'bg-zinc-950 border-emerald-900/40'
                          : isRejected
                          ? 'bg-rose-950/20 border-rose-900/50'
                          : 'bg-zinc-950 border-zinc-800 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : isRejected
                            ? 'bg-rose-500 text-white'
                            : isCurrent
                            ? 'bg-amber-500 text-white animate-bounce'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {isDone ? '✓' : isRejected ? '✕' : step.level}
                      </div>

                      <div className="flex-1 space-y-0.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">
                            Level {step.level}: {step.role}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              isDone
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : isRejected
                                ? 'bg-rose-500/10 text-rose-400'
                                : isCurrent
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-400">{step.officerName}</p>

                        {step.comments && (
                          <div className="mt-1.5 p-2 rounded-xl bg-zinc-900/90 text-zinc-300 text-[11px] leading-relaxed border border-zinc-800">
                            <strong>Note:</strong> {step.comments}
                            {step.timestamp && (
                              <span className="block text-[10px] text-zinc-500 mt-0.5">
                                Timestamp: {step.timestamp}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workflow Action Controls */}
            {canApprove && (
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-zinc-400">
                  <span>Signatory Authority: </span>
                  <strong className="text-white">{user?.name}</strong> ({user?.role?.replace(/_/g, ' ')})
                </div>

                <div className="flex items-center gap-2">
                  {currentSelection.status !== 'Approved' && currentSelection.status !== 'Rejected' && (
                    <button
                      id="btn-reject-adjustment"
                      onClick={() => handleRejectWorkflow(currentSelection.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject / Issue Objection</span>
                    </button>
                  )}

                  {currentSelection.status === 'Draft' && (
                    <button
                      id="btn-submit-draft"
                      onClick={() => handleAdvanceWorkflow(currentSelection.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Draft for Level 2 Review</span>
                    </button>
                  )}

                  {currentSelection.status === 'Pending Approval' && (
                    <button
                      id="btn-advance-workflow"
                      onClick={() => handleAdvanceWorkflow(currentSelection.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {currentSelection.currentLevel === 2
                          ? 'Grant JS&FA Concurrence → Send to Secretary'
                          : 'Accord Final Finance Secretary Sanction'}
                      </span>
                    </button>
                  )}

                  {(currentSelection.status === 'Approved' || currentSelection.status === 'Rejected') && (
                    <span className="text-xs text-zinc-400 italic">Workflow Terminal State Reached</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Modal: Create New Budget Adjustment Proposal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-white">Create Budget Adjustment Proposal</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-300 mb-1">Proposal Subject / Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Virement: Express Corridor Bridge Reinforcement"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Adjustment Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="VIREMENT_INTERNAL">Internal Virement (Same Grant)</option>
                    <option value="RE_APPROPRIATION">Re-Appropriation</option>
                    <option value="SUPPLEMENTARY_DEMAND">Supplementary Demand</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Adjustment Outlay (₹ Cr)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">Target Department</label>
                <select
                  value={formTargetDept}
                  onChange={e => setFormTargetDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  GFR Justification & Expenditure Trajectory
                </label>
                <textarea
                  rows={3}
                  required
                  value={formJustification}
                  onChange={e => setFormJustification(e.target.value)}
                  placeholder="Cite GFR Rule 10/61 compliance, absorption milestones, and physical justification..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md"
                >
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
