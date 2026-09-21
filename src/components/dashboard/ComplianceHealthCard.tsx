import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  AlertTriangle,
  FileQuestion,
  CheckCircle2,
  FileCheck2,
  Filter,
  ArrowRight,
  ExternalLink,
  Search,
  FileText,
  Clock,
  Sparkles,
  ShieldAlert,
  Send,
  Check,
} from 'lucide-react';
import { Expenditure } from '../../types';

export const ComplianceHealthCard: React.FC = () => {
  const { expenditures, addToast, recordAuditAction } = useApp();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MISSING_DOCS' | 'NON_STANDARD' | 'HELD'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [requestedDocIds, setRequestedDocIds] = useState<Set<string>>(new Set());

  // Automatically scan expenditures for compliance issues
  const complianceAudit = useMemo(() => {
    const totalCount = expenditures.length;
    let missingDocsCount = 0;
    let nonStandardCount = 0;
    let heldCount = 0;

    const actionItems: Array<{
      expenditure: Expenditure;
      issueType: 'MISSING_DOCS' | 'NON_STANDARD' | 'HELD';
      severity: 'CRITICAL' | 'WARNING' | 'ATTENTION';
      reason: string;
      suggestedAction: string;
    }> = [];

    expenditures.forEach(exp => {
      if (resolvedIds.has(exp.id)) return;

      const isHighValue = exp.amount >= 12; // Above ₹12 Cr
      const isSensitiveCategory = exp.category === 'CONSULTING' || exp.category === 'GRANTS';
      const isHeldOrFlagged = exp.paymentStatus === 'HELD' || exp.verificationStatus === 'FLAGGED';
      const isPendingAudit = exp.verificationStatus === 'UNDER_AUDIT' || exp.verificationStatus === 'PENDING';
      
      // Check for missing documentation flags
      const hasMissingDocFlag = 
        !exp.invoiceNumber || 
        exp.invoiceNumber.includes('TMP') || 
        (exp.amount > 5 && exp.verificationStatus !== 'VERIFIED');

      if (exp.paymentStatus === 'HELD') {
        heldCount++;
        actionItems.push({
          expenditure: exp,
          issueType: 'HELD',
          severity: 'CRITICAL',
          reason: 'Voucher payment suspended by treasury gateway pending milestone clearance certificate.',
          suggestedAction: 'Require DDO to upload physical works measurement certificate.',
        });
      } else if (hasMissingDocFlag && isPendingAudit) {
        missingDocsCount++;
        actionItems.push({
          expenditure: exp,
          issueType: 'MISSING_DOCS',
          severity: isHighValue ? 'CRITICAL' : 'WARNING',
          reason: `Missing signed delivery receipt / GeM e-Invoice for ₹${exp.amount} Cr allocation.`,
          suggestedAction: 'Dispatch electronic documentation request to Drawing & Disbursing Officer.',
        });
      } else if (isHighValue && isSensitiveCategory) {
        nonStandardCount++;
        actionItems.push({
          expenditure: exp,
          issueType: 'NON_STANDARD',
          severity: 'WARNING',
          reason: `Non-standard outlay under ${exp.category} head exceeding ₹10 Cr GFR Rule 170 scrutiny limit.`,
          suggestedAction: 'Verify Technical Evaluation Committee sanction order and CVC clearance.',
        });
      } else if (isHeldOrFlagged) {
        nonStandardCount++;
        actionItems.push({
          expenditure: exp,
          issueType: 'NON_STANDARD',
          severity: 'CRITICAL',
          reason: `Flagged during automated surveillance for potential rapid disbursement velocity.`,
          suggestedAction: 'Assign internal vigilance auditor for pre-settlement verification.',
        });
      }
    });

    const flaggedCount = actionItems.length;
    const cleanCount = Math.max(0, totalCount - flaggedCount);
    const healthScore = totalCount > 0 ? Math.round((cleanCount / totalCount) * 100) : 100;

    return {
      totalCount,
      cleanCount,
      missingDocsCount,
      nonStandardCount,
      heldCount,
      flaggedCount,
      healthScore,
      actionItems,
    };
  }, [expenditures, resolvedIds]);

  // Filtered action items
  const displayedItems = useMemo(() => {
    return complianceAudit.actionItems.filter(item => {
      const matchFilter = activeFilter === 'ALL' || item.issueType === activeFilter;
      const matchSearch =
        item.expenditure.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.expenditure.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.expenditure.vendorAgency.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [complianceAudit.actionItems, activeFilter, searchQuery]);

  const handleRequestDocs = (item: (typeof complianceAudit.actionItems)[0]) => {
    setRequestedDocIds(prev => new Set(prev).add(item.expenditure.id));
    recordAuditAction({
      user: 'Vigilance Controller',
      userRole: 'AUDITOR',
      action: `Requested Missing Documentation: ${item.expenditure.transactionId}`,
      recordType: 'EXPENDITURE_COMPLIANCE',
      recordId: item.expenditure.transactionId,
      status: 'VERIFIED',
      description: `Formal GFR notice dispatched to DDO of ${item.expenditure.departmentName} for voucher ₹${item.expenditure.amount} Cr.`,
      ipAddress: '10.24.1.5',
    });
    addToast(
      'Documentation Notice Dispatched',
      `Official GFR Rule 52 compliance request dispatched to ${item.expenditure.departmentName}.`,
      'INFO'
    );
  };

  const handleVerifyAndClear = (item: (typeof complianceAudit.actionItems)[0]) => {
    setResolvedIds(prev => new Set(prev).add(item.expenditure.id));
    recordAuditAction({
      user: 'Senior Financial Advisor',
      userRole: 'FINANCE_OFFICER',
      action: `Cleared Compliance Flag: ${item.expenditure.transactionId}`,
      recordType: 'EXPENDITURE_COMPLIANCE',
      recordId: item.expenditure.transactionId,
      status: 'SUCCESS',
      description: `Voucher certified after manual inspection of supporting documentation.`,
      ipAddress: '10.24.1.5',
    });
    addToast(
      'Compliance Cleared',
      `Voucher ${item.expenditure.transactionId} marked fully verified and cleared from Action Required queue.`,
      'SUCCESS'
    );
  };

  const handleEscalateToAudit = (item: (typeof complianceAudit.actionItems)[0]) => {
    setResolvedIds(prev => new Set(prev).add(item.expenditure.id));
    recordAuditAction({
      user: 'Vigilance Officer',
      userRole: 'AUDITOR',
      action: `Escalated to CAG Special Audit: ${item.expenditure.transactionId}`,
      recordType: 'STATUTORY_AUDIT',
      recordId: item.expenditure.transactionId,
      status: 'FLAGGED',
      description: `Voucher referred for comprehensive statutory audit investigation: ${item.reason}`,
      ipAddress: '10.24.1.5',
    });
    addToast(
      'Referred to Statutory Audit',
      `Transaction ${item.expenditure.transactionId} escalated to CAG internal audit register.`,
      'WARNING'
    );
  };

  return (
    <div className="lg:col-span-4 p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-6">
      {/* Top Header & Score Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Expenditure Surveillance Engine
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Live Scan Active
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Compliance Health & Action Required Register
            </h2>
            <p className="text-xs text-zinc-400">
              Autonomous scan of recent disbursements detecting missing vouchers, split thresholds, and non-standard GFR heads.
            </p>
          </div>
        </div>

        {/* Health Score Meter */}
        <div className="flex items-center gap-4 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/90 self-start md:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">
              Compliance Health
            </span>
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="text-2xl font-extrabold text-white tracking-tight">
                {complianceAudit.healthScore}%
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  complianceAudit.healthScore >= 90
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : complianceAudit.healthScore >= 75
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {complianceAudit.healthScore >= 90
                  ? 'Grade A'
                  : complianceAudit.healthScore >= 75
                  ? 'Grade B'
                  : 'Needs Action'}
              </span>
            </div>
          </div>

          <div className="w-12 h-12 relative flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-zinc-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${
                  complianceAudit.healthScore >= 90
                    ? 'text-emerald-400'
                    : complianceAudit.healthScore >= 75
                    ? 'text-amber-400'
                    : 'text-rose-400'
                } transition-all duration-700`}
                strokeDasharray={`${complianceAudit.healthScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-300">
              {complianceAudit.cleanCount}/{complianceAudit.totalCount}
            </div>
          </div>
        </div>
      </div>

      {/* Metric Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Total Checked</span>
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <p className="text-lg font-bold text-white">{complianceAudit.totalCount}</p>
          <span className="text-[10px] text-zinc-500">PFMS Vouchers Scanned</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span>Fully Compliant</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400">{complianceAudit.cleanCount}</p>
          <span className="text-[10px] text-zinc-500">Standard GFR Clearance</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span>Missing Docs</span>
            <FileQuestion className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-lg font-bold text-amber-400">{complianceAudit.missingDocsCount}</p>
          <span className="text-[10px] text-zinc-500">Uncertified / No GeM Link</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span>Non-Standard / Held</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <p className="text-lg font-bold text-rose-400">
            {complianceAudit.nonStandardCount + complianceAudit.heldCount}
          </p>
          <span className="text-[10px] text-zinc-500">Requires Pre-Audit Action</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-800 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'ALL'
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Flagged ({complianceAudit.actionItems.length})
          </button>
          <button
            onClick={() => setActiveFilter('MISSING_DOCS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'MISSING_DOCS'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Missing Docs ({complianceAudit.missingDocsCount})
          </button>
          <button
            onClick={() => setActiveFilter('NON_STANDARD')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'NON_STANDARD'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Non-Standard Entries ({complianceAudit.nonStandardCount})
          </button>
          <button
            onClick={() => setActiveFilter('HELD')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeFilter === 'HELD'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Held Outlays ({complianceAudit.heldCount})
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ID, department, vendor..."
            className="w-full pl-8 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Action Required Items List */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {displayedItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-zinc-200">
              No Action Required for this Filter
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              All monitored transactions conform to General Financial Rules (GFR 2017) standards.
            </p>
          </div>
        ) : (
          displayedItems.map(item => {
            const hasRequested = requestedDocIds.has(item.expenditure.id);
            return (
              <div
                key={item.expenditure.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[11px] text-indigo-400">
                      {item.expenditure.transactionId}
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        item.severity === 'CRITICAL'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.issueType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {item.expenditure.date}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono">
                      {item.expenditure.category}
                    </span>
                  </div>

                  <p className="font-semibold text-zinc-200 leading-snug">
                    {item.reason}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 flex-wrap">
                    <span>
                      Dept: <strong className="text-zinc-300">{item.expenditure.departmentName}</strong>
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-[200px]">
                      Vendor: <span className="text-zinc-300">{item.expenditure.vendorAgency}</span>
                    </span>
                    <span>•</span>
                    <span className="text-zinc-500 font-mono">
                      Invoice: {item.expenditure.invoiceNumber || 'PENDING'}
                    </span>
                  </div>

                  <div className="pt-1 text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>
                      <strong className="text-indigo-300">Recommended:</strong> {item.suggestedAction}
                    </span>
                  </div>
                </div>

                {/* Amount and Action Controls */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/80">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                      Transaction Outlay
                    </span>
                    <span className="text-base font-extrabold text-white">
                      ₹{item.expenditure.amount.toFixed(2)} Cr
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      onClick={() => handleRequestDocs(item)}
                      disabled={hasRequested}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all ${
                        hasRequested
                          ? 'bg-zinc-800 text-zinc-400 cursor-default'
                          : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30'
                      }`}
                      title="Dispatch automated GFR documentation request to DDO"
                    >
                      {hasRequested ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Notice Sent</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Request Docs</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleVerifyAndClear(item)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all shadow-xs"
                      title="Confirm receipt of documentation and mark compliant"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Clear</span>
                    </button>

                    <button
                      onClick={() => handleEscalateToAudit(item)}
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-700/60 transition-colors"
                      title="Escalate to CAG Audit Register"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
