import React, { useState, useMemo } from 'react';
import {
  GitCommit,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Building,
  FileText,
  Copy,
  Check,
  PlusCircle,
  X,
  AlertTriangle,
  Download,
  Share2,
  Calendar,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DepartmentAllocationChange, AuthorizationFlowType } from '../../types';
import { INITIAL_DEPARTMENT_ALLOCATION_CHANGES } from '../../data/allocationChangesData';
import { useApp } from '../../context/AppContext';

interface Props {
  onHighlightInLog?: (refNumber: string) => void;
}

export const DepartmentAllocationChangeTracker: React.FC<Props> = ({ onHighlightInLog }) => {
  const { departments, addToast, recordAuditAction } = useApp();

  // Local state for changes (starts with INITIAL, allows adding new ones dynamically)
  const [allocationChanges, setAllocationChanges] = useState<DepartmentAllocationChange[]>(
    INITIAL_DEPARTMENT_ALLOCATION_CHANGES
  );

  // Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedFlowFilter, setSelectedFlowFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected change for detail modal
  const [selectedChange, setSelectedChange] = useState<DepartmentAllocationChange | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Modal to initiate a new allocation change simulation
  const [isNewChangeModalOpen, setIsNewChangeModalOpen] = useState(false);
  const [newChangeForm, setNewChangeForm] = useState({
    sourceDepartmentId: departments[0]?.id || 'dept-01',
    targetDepartmentId: departments[0]?.id || 'dept-01',
    amount: 50,
    changeType: 'VIREMENT_INTERNAL' as AuthorizationFlowType,
    justification: 'Accelerated civil infrastructure milestone disbursement to avoid fiscal lapse.',
    officerName: 'S. K. Verma, Under Secretary',
    remarks: 'Concurrence sought under GFR Rule 10(1).',
  });

  // Unique departments present in changes
  const departmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    allocationChanges.forEach(c => {
      map.set(c.sourceDepartmentId, c.sourceDepartmentName);
      map.set(c.targetDepartmentId, c.targetDepartmentName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allocationChanges]);

  // Filtered changes
  const filteredChanges = useMemo(() => {
    return allocationChanges.filter(c => {
      const matchesDept =
        selectedDeptFilter === 'ALL' ||
        c.sourceDepartmentId === selectedDeptFilter ||
        c.targetDepartmentId === selectedDeptFilter;
      const matchesFlow = selectedFlowFilter === 'ALL' || c.changeType === selectedFlowFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || c.status === selectedStatusFilter;

      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !searchQuery ||
        c.referenceNumber.toLowerCase().includes(q) ||
        c.sourceDepartmentName.toLowerCase().includes(q) ||
        c.targetDepartmentName.toLowerCase().includes(q) ||
        c.flowName.toLowerCase().includes(q) ||
        c.sanctionOrderNumber.toLowerCase().includes(q) ||
        c.justification.toLowerCase().includes(q);

      return matchesDept && matchesFlow && matchesStatus && matchesQuery;
    });
  }, [allocationChanges, selectedDeptFilter, selectedFlowFilter, selectedStatusFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalChanges = allocationChanges.length;
    const totalShiftedAmount = allocationChanges.reduce((sum, c) => sum + c.amount, 0);
    const approvedCount = allocationChanges.filter(c => c.status === 'APPROVED').length;
    const pendingCount = allocationChanges.filter(c => c.status === 'PENDING').length;
    const rejectedCount = allocationChanges.filter(c => c.status === 'REJECTED').length;

    const modifiedDepts = new Set<string>();
    allocationChanges.forEach(c => {
      modifiedDepts.add(c.sourceDepartmentId);
      modifiedDepts.add(c.targetDepartmentId);
    });

    return {
      totalChanges,
      totalShiftedAmount: Math.round(totalShiftedAmount * 10) / 10,
      approvedCount,
      pendingCount,
      rejectedCount,
      departmentsCount: modifiedDepts.size,
    };
  }, [allocationChanges]);

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleCreateNewChange = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceDept = departments.find(d => d.id === newChangeForm.sourceDepartmentId) || departments[0];
    const targetDept = departments.find(d => d.id === newChangeForm.targetDepartmentId) || departments[0];

    const prevSource = sourceDept.allocatedBudget;
    const prevTarget = targetDept.allocatedBudget;
    const isSameDept = sourceDept.id === targetDept.id;

    // Calculate new allocation
    const newSource = isSameDept ? prevSource + Number(newChangeForm.amount) : Math.max(0, prevSource - Number(newChangeForm.amount));
    const newTarget = isSameDept ? prevTarget + Number(newChangeForm.amount) : prevTarget + Number(newChangeForm.amount);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
    const refCode = `SAN/${now.getFullYear()}/${sourceDept.code || 'GOV'}/VIR-${Math.floor(100 + Math.random() * 900)}`;

    let flowTitle = 'Single-Grant Internal Virement Flow (GFR Rule 10)';
    if (newChangeForm.changeType === 'RE_APPROPRIATION') flowTitle = 'Inter-Head Re-appropriation Flow (GFR Rule 61)';
    if (newChangeForm.changeType === 'SUPPLEMENTARY_DEMAND') flowTitle = 'Parliamentary Supplementary Grant Flow (Article 115)';
    if (newChangeForm.changeType === 'EXECUTIVE_CONTINGENCY') flowTitle = 'Emergency Strategic Contingency Warrant (Article 267)';
    if (newChangeForm.changeType === 'TECHNICAL_REALLOCATION') flowTitle = 'Mid-Year Surrender & Central Re-allocation (GFR Rule 63)';

    // Random sha-256 like hex
    const checksum = `sha256:${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newRecord: DepartmentAllocationChange = {
      id: `ALLOC-MOD-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      referenceNumber: `${sourceDept.code || 'DEPT'}/ALLOC/${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      sourceDepartmentId: sourceDept.id,
      sourceDepartmentName: sourceDept.name,
      targetDepartmentId: targetDept.id,
      targetDepartmentName: targetDept.name,
      changeType: newChangeForm.changeType,
      flowName: flowTitle,
      amount: Number(newChangeForm.amount),
      previousSourceAllocation: prevSource,
      newSourceAllocation: newSource,
      previousTargetAllocation: prevTarget,
      newTargetAllocation: newTarget,
      initiatedDate: dateStr,
      approvedDate: dateStr,
      effectiveQuarter: 'Q4',
      status: 'APPROVED',
      authorizationFlow: {
        currentStep: 3,
        totalSteps: 3,
        steps: [
          {
            stage: 'Proposal Formulation',
            authority: 'Desk Officer / Under Secretary',
            officer: newChangeForm.officerName,
            status: 'APPROVED',
            timestamp: dateStr,
            remarks: newChangeForm.remarks,
          },
          {
            stage: 'Integrated Financial Concurrence',
            authority: 'Joint Secretary & Financial Adviser',
            officer: 'Financial Adviser (Integrated Finance Division)',
            status: 'APPROVED',
            timestamp: dateStr,
            remarks: 'Statutory concurrence verified under GFR Guidelines.',
          },
          {
            stage: 'Central Ledger Posting',
            authority: 'Controller General of Accounts (PFMS)',
            officer: 'PFMS Central Core Gateway',
            status: 'APPROVED',
            timestamp: dateStr,
            remarks: 'Enacted into Central Ledger and Demand Grant account.',
          },
        ],
      },
      sanctionOrderNumber: refCode,
      statutoryBasis: 'General Financial Rules 2017 & PFMS Central Allocation Mandate',
      integrityChecksum: checksum,
      justification: newChangeForm.justification,
    };

    setAllocationChanges(prev => [newRecord, ...prev]);
    setIsNewChangeModalOpen(false);

    recordAuditAction({
      action: 'BUDGET_ALLOCATION_MODIFIED',
      category: 'MODIFICATION',
      description: `Automated Change-Tracker: ${sourceDept.name} modified allocation by ₹${newChangeForm.amount} Cr via ${flowTitle}. Sanction Ref: ${refCode}.`,
      recordType: 'DEPARTMENT_ALLOCATION',
      recordId: newRecord.id,
      oldValue: `₹${prevSource} Cr`,
      newValue: `₹${newSource} Cr`,
      status: 'VERIFIED',
      integrityHash: checksum,
    });

    addToast(
      'Allocation Modified & Tracked',
      `Modified ${targetDept.name} budget allocation (+₹${newChangeForm.amount} Cr) via ${flowTitle}.`,
      'SUCCESS'
    );
  };

  return (
    <div className="space-y-5">
      {/* Section Header with Regulatory Badging */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <GitCommit className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Automated Department Allocation Change-Tracking System
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                GFR 10 & 61 Verified
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl">
              Chronological surveillance engine auditing which ministries modified budget outlays, timestamped execution dates, and their exact statutory authorization flows (Single-Grant Virements, Re-appropriations, Supplementary Demands, and Contingency Warrants).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-simulate-allocation-shift"
              onClick={() => setIsNewChangeModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Allocation Modification</span>
            </button>
          </div>
        </div>

        {/* Change Tracker Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
              Total Modifications
            </span>
            <span className="text-lg font-extrabold text-zinc-900 dark:text-white mt-0.5 block">
              {metrics.totalChanges} Changes
            </span>
            <span className="text-[10px] text-zinc-500">Across Central Grants</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-indigo-500 block tracking-wider">
              Capital Re-Allocated
            </span>
            <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              ₹{metrics.totalShiftedAmount.toLocaleString('en-IN')} Cr
            </span>
            <span className="text-[10px] text-zinc-500">Net outlay adjusted</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-emerald-500 block tracking-wider">
              Approved & Enacted
            </span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {metrics.approvedCount} Active Flows
            </span>
            <span className="text-[10px] text-zinc-500">PFMS Core posted</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-amber-500 block tracking-wider">
              In Review / Scrutiny
            </span>
            <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
              {metrics.pendingCount} Pending
            </span>
            <span className="text-[10px] text-zinc-500">At JS&FA / MoF level</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-rose-500 block tracking-wider">
              Rejected / Non-Compliant
            </span>
            <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 block">
              {metrics.rejectedCount} Terminated
            </span>
            <span className="text-[10px] text-zinc-500">GFR Rule 10(2) enforced</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Department Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
              Filter by Department
            </label>
            <select
              id="select-change-dept"
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Impacted Departments ({metrics.departmentsCount})</option>
              {departmentOptions.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Authorization Flow Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
              Filter by Authorization Flow
            </label>
            <select
              id="select-change-flow"
              value={selectedFlowFilter}
              onChange={e => setSelectedFlowFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Authorization Flows</option>
              <option value="VIREMENT_INTERNAL">Single-Grant Internal Virement (Rule 10)</option>
              <option value="RE_APPROPRIATION">Inter-Head Re-appropriation (Rule 61)</option>
              <option value="SUPPLEMENTARY_DEMAND">Parliamentary Supplementary Grant (Art. 115)</option>
              <option value="EXECUTIVE_CONTINGENCY">Strategic Contingency Warrant (Art. 267)</option>
              <option value="TECHNICAL_REALLOCATION">Mid-Year Surrender & Central Re-pooling</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
              Authorization Status
            </label>
            <select
              id="select-change-status"
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="APPROVED">Approved & Enacted into Ledger</option>
              <option value="PENDING">Pending Financial Concurrence</option>
              <option value="REJECTED">Rejected / Terminated</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
              Search Reference / Sanction
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                id="input-search-allocation-tracker"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search reference, officer, or keyword..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Change Cards & Authorization Flow Steppers */}
      <div className="space-y-3.5">
        {filteredChanges.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-400">
            <Filter className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="font-semibold text-sm">No allocation modifications matched the filter criteria.</p>
            <p className="text-xs text-zinc-500 mt-1">Try resetting the department or authorization flow filter.</p>
          </div>
        ) : (
          filteredChanges.map(change => {
            const isApproved = change.status === 'APPROVED';
            const isPending = change.status === 'PENDING';
            const isRejected = change.status === 'REJECTED';

            const sourceDelta = change.newSourceAllocation - change.previousSourceAllocation;
            const targetDelta = change.newTargetAllocation - change.previousTargetAllocation;

            return (
              <div
                key={change.id}
                onClick={() => setSelectedChange(change)}
                className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer space-y-4"
              >
                {/* Header Row: Reference, Date, Flow Pill, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                      {change.referenceNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {change.effectiveQuarter} 2026–27
                    </span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      {change.flowName.split('(')[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {change.initiatedDate}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isApproved
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isPending
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isApproved && <CheckCircle2 className="w-3 h-3" />}
                      {isPending && <Clock className="w-3 h-3" />}
                      {isRejected && <XCircle className="w-3 h-3" />}
                      {change.status}
                    </span>
                  </div>
                </div>

                {/* Main Content: Department Allocation Shift & Values */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Departments and Shifting Details */}
                  <div className="lg:col-span-6 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Building className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <div className="font-semibold text-zinc-900 dark:text-white">
                        {change.sourceDepartmentName}
                        {change.sourceDepartmentId !== change.targetDepartmentId && (
                          <>
                            <span className="text-zinc-400 mx-1.5 font-normal">→</span>
                            <span>{change.targetDepartmentName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {change.justification}
                    </p>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                        Sanction #{change.sanctionOrderNumber}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Authority: <strong className="text-zinc-700 dark:text-zinc-300">{change.statutoryBasis.split('&')[0]}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Allocation Figures & Delta Badge */}
                  <div className="lg:col-span-6 flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Previous Outlay</span>
                      <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-300">
                        ₹{change.previousTargetAllocation.toLocaleString('en-IN')} Cr
                      </span>
                    </div>

                    <div className="flex items-center text-zinc-400">
                      <ArrowRight className="w-4 h-4" />
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Modified Outlay</span>
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                        ₹{change.newTargetAllocation.toLocaleString('en-IN')} Cr
                      </span>
                    </div>

                    <div className="pl-3 border-l border-zinc-200 dark:border-zinc-700 text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Shift Amount</span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg inline-block ${
                          isRejected
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {isRejected ? 'BLOCKED' : `+₹${change.amount.toLocaleString('en-IN')} Cr`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Authorization Flow Pipeline Stepper */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-indigo-500" />
                      Statutory Authorization Flow: {change.flowName}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Step {change.authorizationFlow.currentStep} of {change.authorizationFlow.totalSteps}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {change.authorizationFlow.steps.map((step, idx) => {
                      const stepApproved = step.status === 'APPROVED';
                      const stepInReview = step.status === 'IN_REVIEW';
                      const stepRejected = step.status === 'REJECTED';

                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border text-xs space-y-1 transition-colors ${
                            stepApproved
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-200'
                              : stepInReview
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-200'
                              : stepRejected
                              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-950 dark:text-rose-200'
                              : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                              {stepApproved && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                              {stepInReview && <Clock className="w-3 h-3 text-amber-500 animate-pulse" />}
                              {stepRejected && <XCircle className="w-3 h-3 text-rose-500" />}
                              Step {idx + 1}: {step.stage}
                            </span>
                            <span className="text-[9px] font-mono">{step.timestamp?.slice(5, 16)}</span>
                          </div>

                          <p className="font-medium text-[11px] line-clamp-1">
                            {step.officer}
                          </p>

                          {step.remarks && (
                            <p className="text-[10px] opacity-80 line-clamp-1 italic">
                              "{step.remarks}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Bar with Cryptographic Integrity Hash */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 font-mono">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Cryptographic Audit Proof:</span>
                    <button
                      onClick={e => handleCopyHash(change.integrityChecksum, e)}
                      className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center gap-1 transition-colors"
                      title="Copy SHA-256 integrity signature"
                    >
                      <span>{change.integrityChecksum.slice(0, 16)}...</span>
                      {copiedHash === change.integrityChecksum ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-zinc-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedChange(change);
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-sans font-semibold flex items-center gap-1"
                    >
                      <span>Inspect Official Dossier</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Official Statutory Dossier Modal */}
      {selectedChange && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedChange(null)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-900 dark:text-white space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <GitCommit className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">
                    Government of India Statutory Allocation Order
                  </span>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    {selectedChange.referenceNumber}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedChange(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dossier Content */}
            <div className="space-y-4 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Source Department</span>
                  <span className="font-semibold text-zinc-900 dark:text-white block mt-0.5">
                    {selectedChange.sourceDepartmentName}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Target Department</span>
                  <span className="font-semibold text-zinc-900 dark:text-white block mt-0.5">
                    {selectedChange.targetDepartmentName}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase font-bold">Shift Amount</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 block mt-0.5 text-sm">
                    ₹{selectedChange.amount.toLocaleString('en-IN')} Cr
                  </span>
                </div>
              </div>

              {/* Statutory Basis & Justification */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">
                  Statutory Rule & Mandate
                </span>
                <p className="font-semibold text-zinc-900 dark:text-white">
                  {selectedChange.statutoryBasis}
                </p>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <strong className="text-zinc-900 dark:text-white">Executive Justification: </strong>
                  {selectedChange.justification}
                </p>
              </div>

              {/* Complete Authorization Step Chain */}
              <div className="space-y-2">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">
                  Multi-Tier Authorization Flow & Concurrence Log
                </span>
                <div className="space-y-2">
                  {selectedChange.authorizationFlow.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                          {step.status === 'APPROVED' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : step.status === 'REJECTED' ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          Level {idx + 1}: {step.stage}
                        </span>
                        <span className="font-mono text-zinc-500 text-[11px]">{step.timestamp || 'In Review'}</span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 font-medium">{step.authority} — {step.officer}</p>
                      {step.remarks && (
                        <p className="text-[11px] text-zinc-500 italic bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 mt-1">
                          "{step.remarks}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrity Verification Card */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-zinc-400 block text-[10px] uppercase font-bold">
                  PFMS Digital Certificate & Cryptographic Integrity
                </span>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono text-[11px]">
                  <span className="truncate">{selectedChange.integrityChecksum}</span>
                  <button
                    onClick={e => handleCopyHash(selectedChange.integrityChecksum, e)}
                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-900 dark:hover:text-white shrink-0"
                    title="Copy full hash"
                  >
                    {copiedHash === selectedChange.integrityChecksum ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Public Financial Management System Central Grant Ledger Validated</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] text-zinc-400 font-mono">
                Sanction No: {selectedChange.sanctionOrderNumber}
              </span>
              <button
                onClick={() => setSelectedChange(null)}
                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Log / Simulate New Department Allocation Modification */}
      {isNewChangeModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsNewChangeModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-900 dark:text-white space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">
                  Interactive Modification Simulator
                </span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Log Statutory Budget Allocation Modification
                </h3>
              </div>
              <button
                onClick={() => setIsNewChangeModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewChange} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Source Department
                </label>
                <select
                  value={newChangeForm.sourceDepartmentId}
                  onChange={e => setNewChangeForm(prev => ({ ...prev, sourceDepartmentId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Current: ₹{d.allocatedBudget} Cr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Target Department
                </label>
                <select
                  value={newChangeForm.targetDepartmentId}
                  onChange={e => setNewChangeForm(prev => ({ ...prev, targetDepartmentId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} (Current: ₹{d.allocatedBudget} Cr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                    Allocation Amount (₹ Cr)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={newChangeForm.amount}
                    onChange={e => setNewChangeForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                    Statutory Flow Type
                  </label>
                  <select
                    value={newChangeForm.changeType}
                    onChange={e => setNewChangeForm(prev => ({ ...prev, changeType: e.target.value as AuthorizationFlowType }))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="VIREMENT_INTERNAL">Single-Grant Internal Virement (Rule 10)</option>
                    <option value="RE_APPROPRIATION">Inter-Head Re-appropriation (Rule 61)</option>
                    <option value="SUPPLEMENTARY_DEMAND">Supplementary Demand (Article 115)</option>
                    <option value="EXECUTIVE_CONTINGENCY">Strategic Contingency (Article 267)</option>
                    <option value="TECHNICAL_REALLOCATION">Mid-Year Surrender & Central Re-allocation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Drafting Officer
                </label>
                <input
                  type="text"
                  value={newChangeForm.officerName}
                  onChange={e => setNewChangeForm(prev => ({ ...prev, officerName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Statutory Justification
                </label>
                <textarea
                  rows={2}
                  value={newChangeForm.justification}
                  onChange={e => setNewChangeForm(prev => ({ ...prev, justification: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewChangeModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  Authorize & Enact Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
