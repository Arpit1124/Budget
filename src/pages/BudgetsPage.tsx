import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Budget, ApprovalStatus } from '../types';
import { BudgetAdjustmentApprovalModule } from '../components/budgets/BudgetAdjustmentApprovalModule';
import { BudgetComparisonTool } from '../components/budgets/BudgetComparisonTool';
import { BudgetTrendD3Chart } from '../components/budgets/BudgetTrendD3Chart';
import {
  Wallet,
  PlusCircle,
  Search,
  Filter,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  X,
  FileText,
  ShieldCheck,
  GitMerge,
  Layers,
  ArrowLeftRight,
} from 'lucide-react';

export const BudgetsPage: React.FC = () => {
  const { budgets, departments, addBudget, updateBudgetWorkflow, toggleBudgetFreeze, financialYear } = useApp();
  const { user, hasRole } = useAuth();

  const [activeTab, setActiveTab] = useState<'ALLOCATIONS' | 'ADJUSTMENTS' | 'COMPARISON'>('ALLOCATIONS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Budget Form
  const [deptId, setDeptId] = useState(departments[0]?.id || '');
  const [schemeName, setSchemeName] = useState('');
  const [headOfAccount, setHeadOfAccount] = useState('2202-General Education');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [description, setDescription] = useState('');

  const canApprove = hasRole(['SUPER_ADMIN', 'GOVERNMENT_ADMIN', 'FINANCE_OFFICER']);
  const canFreeze = hasRole(['SUPER_ADMIN', 'GOVERNMENT_ADMIN', 'FINANCE_OFFICER']);

  const filtered = budgets.filter(b => {
    const matchesSearch =
      b.budgetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.schemeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.approvalStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocatedAmount || isNaN(Number(allocatedAmount))) return;

    const dept = departments.find(d => d.id === deptId) || departments[0];

    await addBudget({
      departmentId: dept.id,
      departmentName: dept.name,
      schemeName: schemeName || 'General Administrative Outlay',
      headOfAccount,
      financialYear,
      allocatedAmount: Number(allocatedAmount),
      utilizedAmount: 0,
      description,
      submittedBy: user?.name || 'Authorized Finance Officer',
      submissionDate: new Date().toISOString().split('T')[0],
      approvalStatus: 'SUBMITTED',
      isFrozen: false,
    });

    setIsCreateModalOpen(false);
    setSchemeName('');
    setAllocatedAmount('');
    setDescription('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Budget Allocations & Approval Workflows
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage scheme sanctions, GFR heads of account, multi-level authorizations, and emergency outlay freezes.
          </p>
        </div>

        {activeTab === 'ALLOCATIONS' && (
          <button
            id="btn-open-create-budget"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Budget Proposal</span>
          </button>
        )}
      </div>

      {/* Main Module Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          id="tab-budget-allocations"
          onClick={() => setActiveTab('ALLOCATIONS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ALLOCATIONS'
              ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Primary Allocations & Outlay Sanctions</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 font-mono">
            {budgets.length}
          </span>
        </button>

        <button
          id="tab-budget-adjustments-workflow"
          onClick={() => setActiveTab('ADJUSTMENTS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ADJUSTMENTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <GitMerge className="w-4 h-4 text-indigo-300" />
          <span>Multi-Level Adjustment Workflow</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
            Pending Action
          </span>
        </button>

        <button
          id="tab-budget-comparison-tool"
          onClick={() => setActiveTab('COMPARISON')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'COMPARISON'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-emerald-300" />
          <span>Side-by-Side Comparison Tool</span>
        </button>
      </div>

      {activeTab === 'ADJUSTMENTS' ? (
        <BudgetAdjustmentApprovalModule />
      ) : activeTab === 'COMPARISON' ? (
        <BudgetComparisonTool />
      ) : (
        <>
          {/* D3 Budget Trend Chart with Entrance & Hover Storytelling Animations */}
          <BudgetTrendD3Chart />

          {/* Filter Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-search-budgets"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Budget ID, Department, or Scheme..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Workflow Status:</span>
          <select
            id="select-budget-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="RELEASED">Released</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 ml-auto font-medium">
          Showing {filtered.length} of {budgets.length} allocations
        </div>
      </div>

      {/* Budget Cards / Table */}
      <div className="space-y-3">
        {filtered.map(b => {
          return (
            <div
              key={b.id}
              className={`p-4 rounded-xl bg-white dark:bg-slate-900 border transition-all ${
                b.isFrozen
                  ? 'border-amber-400 dark:border-amber-700/80 bg-amber-50/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      {b.budgetId}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        b.approvalStatus === 'APPROVED' || b.approvalStatus === 'RELEASED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : b.approvalStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {(b.approvalStatus || '').replace(/_/g, ' ')}
                    </span>

                    {b.isFrozen && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-white font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> FROZEN
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {b.schemeName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dept: {b.departmentName} • Head: <span className="font-mono">{b.headOfAccount}</span>
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs border-y lg:border-y-0 lg:border-x border-slate-100 dark:border-slate-800 py-2 lg:py-0 lg:px-6">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Allocated</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{b.allocatedAmount} Cr
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Utilized</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{b.utilizedAmount} Cr
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Absorption</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {b.utilizationPercentage}%
                    </span>
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {canFreeze && (
                    <button
                      onClick={() => toggleBudgetFreeze(b.id)}
                      className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                        b.isFrozen
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200'
                      }`}
                      title={b.isFrozen ? 'Unfreeze budget allocation' : 'Freeze allocation to prevent outlays'}
                    >
                      {b.isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{b.isFrozen ? 'Unfreeze' : 'Freeze'}</span>
                    </button>
                  )}

                  {canApprove && b.approvalStatus === 'SUBMITTED' && (
                    <>
                      <button
                        onClick={() => updateBudgetWorkflow(b.id, 'APPROVED')}
                        className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 shadow-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => updateBudgetWorkflow(b.id, 'REJECTED')}
                        className="px-2.5 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1 shadow-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {canApprove && b.approvalStatus === 'APPROVED' && (
                    <button
                      onClick={() => updateBudgetWorkflow(b.id, 'RELEASED')}
                      className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 shadow-xs"
                    >
                      <span>Sanction Release</span>
                    </button>
                  )}

                  {b.approvalStatus === 'DRAFT' && (
                    <button
                      onClick={() => updateBudgetWorkflow(b.id, 'SUBMITTED')}
                      className="px-2.5 py-1.5 rounded bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-medium flex items-center gap-1"
                    >
                      <span>Submit for Review</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* New Budget Proposal Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  Draft Budget Sanction Proposal
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="p-5 space-y-4 text-xs">
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
                  Scheme / Sub-Program Title
                </label>
                <input
                  type="text"
                  required
                  value={schemeName}
                  onChange={e => setSchemeName(e.target.value)}
                  placeholder="e.g. Modernization of Digital Classrooms"
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Major Head of Account (GFR)
                  </label>
                  <input
                    type="text"
                    required
                    value={headOfAccount}
                    onChange={e => setHeadOfAccount(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Proposed Allocation (₹ Cr)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={allocatedAmount}
                    onChange={e => setAllocatedAmount(e.target.value)}
                    placeholder="e.g. 150.0"
                    className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Fiscal Justification & Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Provide scope, targets, and expected outcomes..."
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
