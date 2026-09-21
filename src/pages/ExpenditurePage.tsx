import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Expenditure, ExpenditureCategory, VerificationStatus } from '../types';
import { tagTransaction, PriorityLevel } from '../utils/aiBudgetTagger';
import {
  Receipt,
  Search,
  Filter,
  PlusCircle,
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building,
  X,
  FileCheck,
  Sparkles,
  Tag,
  CheckSquare,
  Square,
  Layers,
  ShieldCheck,
  CheckCheck,
  AlertOctagon,
} from 'lucide-react';

export const ExpenditurePage: React.FC = () => {
  const { expenditures, departments, projects, addExpenditure, bulkUpdateExpenditureStatus, financialYear, addToast } = useApp();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Bulk Selection Mode State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);
  const [batchTargetStatus, setBatchTargetStatus] = useState<VerificationStatus>('VERIFIED');
  const [batchRemarks, setBatchRemarks] = useState('');
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // New Voucher Form State
  const [deptId, setDeptId] = useState(departments[0]?.id || '');
  const [selectedPrjId, setSelectedPrjId] = useState('');
  const [vendorAgency, setVendorAgency] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenditureCategory>('CAPITAL_OUTLAY');
  const [description, setDescription] = useState('');
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>('HIGH_PRIORITY');
  const [smartTags, setSmartTags] = useState<string[]>(['CAPEX', 'INFRASTRUCTURE']);
  const [aiTagReasoning, setAiTagReasoning] = useState<string>('');

  const handleAiAutoTag = () => {
    if (!description && !vendorAgency) return;
    const result = tagTransaction({
      description,
      vendorAgency,
      amount: parseFloat(amount) || 0,
    });

    if (result.departmentId) setDeptId(result.departmentId);
    if (result.projectId) setSelectedPrjId(result.projectId);
    setCategory(result.category);
    setPriorityLevel(result.priorityLevel);
    setSmartTags(result.tags);
    setAiTagReasoning(`Auto-tagged by AI (${result.confidenceScore}% confidence): ${result.aiReasoning}`);
  };

  const filtered = expenditures.filter(e => {
    const matchesSearch =
      e.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.vendorAgency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || e.departmentId === deptFilter;
    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || e.verificationStatus === statusFilter;
    return matchesSearch && matchesDept && matchesCategory && matchesStatus;
  });

  // Bulk selection helpers
  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  const handleSelectPendingOnly = () => {
    const pendingItems = filtered.filter(e => e.verificationStatus === 'PENDING').map(e => e.id);
    setSelectedIds(new Set(pendingItems));
    if (pendingItems.length === 0) {
      addToast('No Pending Items', 'There are no pending items in the current filtered view.', 'INFO');
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const openBatchModal = (status: VerificationStatus) => {
    if (selectedIds.size === 0) {
      addToast('Selection Required', 'Select at least one voucher to perform batch transition.', 'WARNING');
      return;
    }
    setBatchTargetStatus(status);
    setBatchRemarks(`Batch updated to ${status} under GFR 2017 Chapter 6 rules.`);
    setIsBatchConfirmOpen(true);
  };

  const handleConfirmBatchUpdate = async () => {
    if (selectedIds.size === 0) return;
    setIsSubmittingBatch(true);
    try {
      await bulkUpdateExpenditureStatus(
        Array.from(selectedIds),
        batchTargetStatus,
        batchRemarks,
        user
      );
      setSelectedIds(new Set());
      setIsBatchConfirmOpen(false);
    } catch (err: any) {
      addToast('Batch Update Failed', err.message || 'Error executing batch update', 'ERROR');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const selectedExpenditures = expenditures.filter(e => selectedIds.has(e.id));
  const selectedTotalAmount = selectedExpenditures.reduce((sum, e) => sum + e.amount, 0);

  const handleRecordExpenditure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const dept = departments.find(d => d.id === deptId) || departments[0];
    const prj = projects.find(p => p.id === selectedPrjId) || projects[0];

    await addExpenditure({
      departmentId: dept.id,
      departmentName: dept.name,
      projectId: prj?.id || 'prj-gen',
      projectName: prj?.name || 'Central Infrastructure Sub-Head',
      amount: Number(amount),
      date: new Date().toISOString().split('T')[0],
      financialYear,
      quarter: 'Q3',
      category,
      vendorAgency: vendorAgency || 'Registered Central Contractor',
      voucherNumber: `VCH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentStatus: 'COMPLETED',
      verificationStatus: 'VERIFIED',
      description: `[${priorityLevel}] ${description || 'Public expenditure voucher'} (Tags: ${smartTags.join(', ')})`,
    });

    setIsModalOpen(false);
    setVendorAgency('');
    setAmount('');
    setDescription('');
    setAiTagReasoning('');
  };

  const exportCSV = () => {
    const headers = ['Transaction ID', 'Voucher Number', 'Date', 'Department', 'Project / Scheme', 'Vendor Agency', 'Category', 'Amount (Cr)', 'Status'];
    const rows = filtered.map(e => [
      e.transactionId,
      e.voucherNumber,
      e.date,
      `"${(e.departmentName || '').replace(/"/g, '""')}"`,
      `"${(e.projectName || '').replace(/"/g, '""')}"`,
      `"${(e.vendorAgency || '').replace(/"/g, '""')}"`,
      e.category,
      e.amount,
      e.verificationStatus,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Expenditures_Ledger_PFMS_${financialYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Expenditure & Voucher Ledger (PFMS)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time itemized audit register of treasury disbursements, contractor payments, and statutory grants.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="btn-toggle-bulk-mode"
            type="button"
            onClick={() => {
              setIsBulkMode(prev => !prev);
              if (isBulkMode) setSelectedIds(new Set());
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              isBulkMode
                ? 'bg-indigo-600 text-white shadow-xs hover:bg-indigo-500'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isBulkMode ? 'Exit Bulk Mode' : 'Bulk Selection Mode'}</span>
            {selectedIds.size > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-indigo-500 text-white text-[10px]">
                {selectedIds.size}
              </span>
            )}
          </button>

          <button
            id="btn-export-expenditure-csv"
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-open-record-expenditure"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Voucher</span>
          </button>
        </div>
      </div>

      {/* Bulk Selection Helper Toolbar when active */}
      {isBulkMode && (
        <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Bulk Selection Mode:</span>
            </span>
            <span className="text-indigo-800 dark:text-indigo-300">
              <strong className="font-mono">{selectedIds.size}</strong> of {filtered.length} vouchers selected
              {selectedIds.size > 0 && (
                <span className="ml-2 font-semibold text-slate-700 dark:text-slate-300">
                  (Selected Value: ₹{selectedTotalAmount.toFixed(2)} Cr)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllFiltered}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/50 transition-colors"
            >
              {selectedIds.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All Filtered'}
            </button>
            <button
              onClick={handleSelectPendingOnly}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100/50 transition-colors"
            >
              Select Pending ({filtered.filter(e => e.verificationStatus === 'PENDING').length})
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleClearSelection}
                className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-search-expenditure"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Voucher ID, Vendor, or Scheme..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Department:</span>
          <select
            id="select-exp-dept-filter"
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Category:</span>
          <select
            id="select-exp-cat-filter"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="CAPITAL_OUTLAY">Capital Outlay</option>
            <option value="OPERATIONAL">Operational</option>
            <option value="GRANT_IN_AID">Grant-in-Aid</option>
            <option value="SUBSIDY">Subsidy</option>
            <option value="PROCUREMENT">Procurement</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            id="select-exp-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending Audit</option>
            <option value="FLAGGED">Flagged Anomaly</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 ml-auto font-medium">
          Showing {filtered.length} vouchers
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                {isBulkMode && (
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title={selectedIds.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                    >
                      {selectedIds.size > 0 && selectedIds.size === filtered.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                )}
                <th className="p-3">Transaction / Voucher</th>
                <th className="p-3">Date</th>
                <th className="p-3">Department & Scheme</th>
                <th className="p-3">Vendor / Beneficiary</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Amount (₹ Cr)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.slice(0, 50).map(e => {
                const isSelected = selectedIds.has(e.id);
                return (
                  <tr
                    key={e.id}
                    onClick={() => isBulkMode && handleToggleSelectRow(e.id)}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    } ${isBulkMode ? 'cursor-pointer' : ''}`}
                  >
                    {isBulkMode && (
                      <td className="p-3 text-center" onClick={ev => ev.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(e.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                      <div>{e.transactionId}</div>
                      <span className="text-[10px] text-slate-400">{e.voucherNumber}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-500">{e.date}</td>
                    <td className="p-3 max-w-[200px]">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{e.projectName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{e.departmentName}</p>
                    </td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                      {e.vendorAgency}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                        {(e.category || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      ₹{e.amount} Cr
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold ${
                          e.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : e.verificationStatus === 'FLAGGED'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {e.verificationStatus === 'VERIFIED' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        {e.verificationStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Sticky Bulk Actions Bar */}
      {isBulkMode && selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-40 p-4 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-white shadow-2xl backdrop-blur-md border border-slate-700/80 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-sm">
              {selectedIds.size}
            </div>
            <div>
              <p className="font-semibold text-xs text-slate-100">
                {selectedIds.size} Vouchers Selected for Batch Action
              </p>
              <p className="text-[11px] text-slate-300">
                Aggregated Value: <strong className="text-emerald-400 font-mono">₹{selectedTotalAmount.toFixed(2)} Cr</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 text-xs">
            <button
              id="btn-batch-approve"
              onClick={() => openBatchModal('VERIFIED')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white shadow-sm transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark Approved (Verified)</span>
            </button>

            <button
              id="btn-batch-pending"
              onClick={() => openBatchModal('PENDING')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 font-semibold text-white shadow-sm transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Mark as Reviewed (Pending)</span>
            </button>

            <button
              id="btn-batch-flag"
              onClick={() => openBatchModal('FLAGGED')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 font-semibold text-white shadow-sm transition-colors"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Flag Anomalies</span>
            </button>

            <button
              onClick={handleClearSelection}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Record Expenditure Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  Record Expenditure Voucher
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordExpenditure} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={deptId}
                  onChange={e => setDeptId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Project / Scheme Head
                </label>
                <select
                  value={selectedPrjId}
                  onChange={e => setSelectedPrjId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vendor / Executing Agency
                </label>
                <input
                  type="text"
                  required
                  value={vendorAgency}
                  onChange={e => setVendorAgency(e.target.value)}
                  placeholder="e.g. Larsen & Toubro Construction Ltd."
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Expenditure Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="CAPITAL_OUTLAY">Capital Outlay</option>
                    <option value="OPERATIONAL">Operational</option>
                    <option value="GRANT_IN_AID">Grant-in-Aid</option>
                    <option value="SUBSIDY">Subsidy</option>
                    <option value="PROCUREMENT">Procurement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Disbursed Amount (₹ Cr)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="e.g. 12.5"
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-slate-300">
                    Disbursement Purpose / Milestone Note
                  </label>
                  <button
                    type="button"
                    onClick={handleAiAutoTag}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Auto-Categorize & Tag</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Emergency procurement of AIIMS ICU cardiac ventilators or NHAI pavement asphalt"
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Priority Level & Smart Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priorityLevel}
                    onChange={e => setPriorityLevel(e.target.value as PriorityLevel)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none text-xs font-semibold"
                  >
                    <option value="URGENT_CRITICAL">🚨 URGENT CRITICAL</option>
                    <option value="HIGH_PRIORITY">⚡ HIGH PRIORITY</option>
                    <option value="STANDARD_MEDIUM">STANDARD MEDIUM</option>
                    <option value="LOW_PRIORITY">LOW PRIORITY</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Classification Tags
                  </label>
                  <div className="flex flex-wrap gap-1 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 min-h-[38px] items-center">
                    {smartTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Reasoning Display */}
              {aiTagReasoning && (
                <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-400 mt-0.5" />
                  <p className="leading-snug text-[11px]">{aiTagReasoning}</p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Record Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Confirmation Action Modal for Batch Status Updates */}
      {isBatchConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-900 dark:text-white">
                    Confirm Batch Status Update
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    GFR 2017 Chapter 6 compliance & electronic audit trail recording
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchConfirmOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Target Status Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">
                    New Target Verification Status
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs ${
                        batchTargetStatus === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : batchTargetStatus === 'FLAGGED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                      }`}
                    >
                      {batchTargetStatus === 'VERIFIED' && <CheckCircle className="w-3.5 h-3.5" />}
                      {batchTargetStatus === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                      {batchTargetStatus === 'FLAGGED' && <AlertTriangle className="w-3.5 h-3.5" />}
                      {batchTargetStatus === 'VERIFIED'
                        ? 'APPROVED / VERIFIED'
                        : batchTargetStatus === 'PENDING'
                        ? 'REVIEWED / PENDING AUDIT'
                        : 'FLAGGED ANOMALY'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">
                    Vouchers Affected
                  </span>
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                    {selectedIds.size}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-medium">
                    Total Value
                  </span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{selectedTotalAmount.toFixed(2)} Cr
                  </span>
                </div>
              </div>

              {/* Items Preview */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-[11px]">
                  Selected Vouchers Preview ({selectedExpenditures.length}):
                </label>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {selectedExpenditures.map(item => (
                    <div key={item.id} className="p-2 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-mono font-medium text-slate-900 dark:text-white mr-2">
                          {item.voucherNumber}
                        </span>
                        <span className="text-slate-500 truncate max-w-[200px] inline-block align-bottom">
                          {item.vendorAgency}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{item.amount} Cr
                        </span>
                        <span className="text-[10px] text-slate-400">({item.verificationStatus})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Remarks */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                  Electronic Audit Trail Remark
                </label>
                <input
                  id="input-batch-remarks"
                  type="text"
                  value={batchRemarks}
                  onChange={e => setBatchRemarks(e.target.value)}
                  placeholder="Reason / circular citation for this batch status change..."
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBatchConfirmOpen(false)}
                  disabled={isSubmittingBatch}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-batch-update"
                  type="button"
                  onClick={handleConfirmBatchUpdate}
                  disabled={isSubmittingBatch}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmittingBatch ? (
                    <span>Applying Updates...</span>
                  ) : (
                    <>
                      <CheckCheck className="w-4 h-4" />
                      <span>Confirm & Apply Batch Update ({selectedIds.size})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
