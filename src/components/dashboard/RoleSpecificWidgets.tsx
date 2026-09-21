import React, { useState, useEffect } from 'react';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Printer,
  ChevronRight,
  PlusCircle,
  FileText,
  BadgeAlert,
  SlidersHorizontal,
  XCircle,
  AlertCircle,
  Layers,
  GripVertical,
  RotateCcw,
  Move,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Department, Scheme, BudgetAdjustment, User } from '../../types';

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArr = [...array];
  const item = newArr.splice(from, 1)[0];
  newArr.splice(to, 0, item);
  return newArr;
}

interface RoleSpecificWidgetsProps {
  role: string;
  user: User | null;
  departments: Department[];
  schemes: Scheme[];
  adjustments: BudgetAdjustment[];
  onNavigate: (route: string) => void;
  onPrintDossier: () => void;
  onBulkApprove?: (ids: string[]) => void;
}

interface SortableWidgetWrapperProps {
  id: string;
  index: number;
  total: number;
  isPersonalizing: boolean;
  title: string;
  badge?: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  isDragging?: boolean;
  children: React.ReactNode;
}

const SortableWidgetWrapper: React.FC<SortableWidgetWrapperProps> = ({
  id,
  index,
  total,
  isPersonalizing,
  title,
  badge,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  children,
}) => {
  return (
    <div
      draggable={isPersonalizing}
      onDragStart={(e) => onDragStart(e, id)}
      onDragOver={(e) => onDragOver(e)}
      onDrop={(e) => onDrop(e, id)}
      className={`transition-all rounded-3xl ${
        isDragging
          ? 'ring-2 ring-indigo-500 shadow-2xl opacity-80 scale-[1.01]'
          : isPersonalizing
          ? 'ring-1 ring-indigo-500/40 hover:ring-indigo-400 bg-zinc-900/90'
          : ''
      }`}
    >
      {isPersonalizing && (
        <div className="flex items-center justify-between px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/40 rounded-t-3xl text-xs text-indigo-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{title}</span>
            {badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors"
              title="Move Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors"
              title="Move Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <div
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-[11px] cursor-grab active:cursor-grabbing transition-colors shadow-xs ml-1"
              title="Drag to reorder this widget"
            >
              <GripVertical className="w-3.5 h-3.5" />
              <span>Drag</span>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export const RoleSpecificWidgets: React.FC<RoleSpecificWidgetsProps> = ({
  role,
  user,
  departments,
  schemes,
  adjustments,
  onNavigate,
  onPrintDossier,
  onBulkApprove,
}) => {
  // Normalize role
  const isMinister = role === 'MINISTER' || role === 'SUPER_ADMIN';
  const isClerk = role === 'DEPARTMENT_CLERK';
  const isAuditor = role === 'AUDITOR';
  const isFinanceOfficer =
    role === 'FINANCE_OFFICER' || role === 'GOVERNMENT_ADMIN' || (!isMinister && !isClerk && !isAuditor);

  // Minister View personalization order
  const defaultMinisterOrder = ['minister-kpi', 'minister-schemes', 'minister-virements'];
  const [ministerWidgetOrder, setMinisterWidgetOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('budgetai_minister_widget_order');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultMinisterOrder;
  });
  const [isPersonalizingMinister, setIsPersonalizingMinister] = useState(false);
  const [draggedMinisterWidget, setDraggedMinisterWidget] = useState<string | null>(null);

  // Clerk View personalization order
  const defaultClerkOrder = ['clerk-counters', 'clerk-queue', 'clerk-reconciliation'];
  const [clerkWidgetOrder, setClerkWidgetOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('budgetai_clerk_widget_order');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return defaultClerkOrder;
  });
  const [isPersonalizingClerk, setIsPersonalizingClerk] = useState(false);
  const [draggedClerkWidget, setDraggedClerkWidget] = useState<string | null>(null);

  // Save changes
  useEffect(() => {
    localStorage.setItem('budgetai_minister_widget_order', JSON.stringify(ministerWidgetOrder));
  }, [ministerWidgetOrder]);

  useEffect(() => {
    localStorage.setItem('budgetai_clerk_widget_order', JSON.stringify(clerkWidgetOrder));
  }, [clerkWidgetOrder]);

  const handleMinisterDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedMinisterWidget(id);
  };

  const handleMinisterDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedMinisterWidget;
    setDraggedMinisterWidget(null);
    if (sourceId && sourceId !== targetId) {
      setMinisterWidgetOrder((items) => {
        const oldIndex = items.indexOf(sourceId);
        const newIndex = items.indexOf(targetId);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleClerkDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedClerkWidget(id);
  };

  const handleClerkDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedClerkWidget;
    setDraggedClerkWidget(null);
    if (sourceId && sourceId !== targetId) {
      setClerkWidgetOrder((items) => {
        const oldIndex = items.indexOf(sourceId);
        const newIndex = items.indexOf(targetId);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const moveMinisterWidget = (id: string, direction: 'up' | 'down') => {
    setMinisterWidgetOrder((items) => {
      const idx = items.indexOf(id);
      if (idx === -1) return items;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= items.length) return items;
      return arrayMove(items, idx, targetIdx);
    });
  };

  const moveClerkWidget = (id: string, direction: 'up' | 'down') => {
    setClerkWidgetOrder((items) => {
      const idx = items.indexOf(id);
      if (idx === -1) return items;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= items.length) return items;
      return arrayMove(items, idx, targetIdx);
    });
  };

  const resetMinisterLayout = () => {
    setMinisterWidgetOrder(defaultMinisterOrder);
    localStorage.removeItem('budgetai_minister_widget_order');
  };

  const resetClerkLayout = () => {
    setClerkWidgetOrder(defaultClerkOrder);
    localStorage.removeItem('budgetai_clerk_widget_order');
  };

  // Workflow Overview Metrics
  const pendingCount = adjustments.filter((a) => a.status === 'Pending Approval').length;
  const approvedCount = adjustments.filter((a) => a.status === 'Approved').length;
  const draftCount = adjustments.filter((a) => a.status === 'Draft').length;
  const rejectedCount = adjustments.filter((a) => a.status === 'Rejected').length;
  const totalAdjustments = adjustments.length || 1;

  const approvedPercent = Math.round((approvedCount / totalAdjustments) * 100);
  const pendingPercent = Math.round((pendingCount / totalAdjustments) * 100);
  const draftPercent = Math.round((draftCount / totalAdjustments) * 100);
  const rejectedPercent = Math.round((rejectedCount / totalAdjustments) * 100);

  // Simulated clerk voucher state
  const [clerkVouchers, setClerkVouchers] = useState([
    {
      id: 'VOU-2026-901',
      payee: 'Hindustan Construction Co. (NH-44)',
      head: 'Major Head 5054 (Roads & Bridges)',
      amount: '₹4.25 Cr',
      date: 'Today, 08:30 AM',
      status: 'VERIFIED',
      token: 'PFMS-TK-9021',
      auditCheck: 'PASSED',
    },
    {
      id: 'VOU-2026-902',
      payee: 'NCERT Textbook Logistics & Print',
      head: 'Major Head 2202 (Gen Education)',
      amount: '₹1.15 Cr',
      date: 'Today, 09:10 AM',
      status: 'PENDING_DDO',
      token: 'PFMS-TK-9022',
      auditCheck: 'PASSED',
    },
    {
      id: 'VOU-2026-903',
      payee: 'Apex IT Cloud Infrastructure',
      head: 'Major Head 3451 (Secretariat Econ)',
      amount: '₹0.85 Cr',
      date: 'Today, 09:40 AM',
      status: 'OBJECTION_RAISED',
      token: 'HOLD',
      auditCheck: 'MISSING_INVOICE_TDS',
    },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleForwardToDDO = (voucherId: string) => {
    setClerkVouchers((prev) =>
      prev.map((v) => (v.id === voucherId ? { ...v, status: 'FORWARDED_TO_DDO' } : v))
    );
    setToastMessage(`Voucher ${voucherId} digitally stamped and forwarded to DDO for disbursement sanction.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -----------------------------------------------------------------
  // MINISTER WIDGET RENDERERS
  // -----------------------------------------------------------------
  const renderMinisterWidget = (widgetId: string, index: number, total: number) => {
    switch (widgetId) {
      case 'minister-kpi':
        return (
          <SortableWidgetWrapper
            key="minister-kpi"
            id="minister-kpi"
            index={index}
            total={total}
            isPersonalizing={isPersonalizingMinister}
            title="1. Key Fiscal Health Indicators"
            badge="Capex & Decisions"
            onMoveUp={() => moveMinisterWidget('minister-kpi', 'up')}
            onMoveDown={() => moveMinisterWidget('minister-kpi', 'down')}
            onDragStart={handleMinisterDragStart}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleMinisterDrop}
            isDragging={draggedMinisterWidget === 'minister-kpi'}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* National Capex Velocity */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>National Capex Acceleration</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    +11.8% YoY
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-white mt-1">₹11.11 Lakh Cr</div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Central Capital Outlay Run-Rate: <strong>76.4%</strong> achieved by Q3.
                </p>
                <div className="mt-3 w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '76.4%' }} />
                </div>
              </div>

              {/* Cabinet Decision Queue */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>Cabinet Level Sanction Queue</span>
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                    2 Pending Sign-off
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-amber-400 mt-1">₹270.0 Cr</div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  High-value virements &gt; ₹100 Cr awaiting Union Cabinet concurrence.
                </p>
                <button
                  onClick={() => onNavigate('/budgets')}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <span>Concur Proposals</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lagging Ministries Flag */}
              <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>Intervention Trigger Index</span>
                  <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">
                    3 Ministries &lt; 50%
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-rose-400 mt-1">3 Flagged</div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Tribal Affairs (42.5%), Culture (48.1%), Youth Affairs (49.0%).
                </p>
                <span className="inline-block mt-3 text-[10px] font-mono text-zinc-500">
                  Action: Issue Secretary Review Notice
                </span>
              </div>
            </div>
          </SortableWidgetWrapper>
        );

      case 'minister-schemes':
        return (
          <SortableWidgetWrapper
            key="minister-schemes"
            id="minister-schemes"
            index={index}
            total={total}
            isPersonalizing={isPersonalizingMinister}
            title="2. Flagship National Schemes"
            badge="DBT & Capex"
            onMoveUp={() => moveMinisterWidget('minister-schemes', 'up')}
            onMoveDown={() => moveMinisterWidget('minister-schemes', 'down')}
            onDragStart={handleMinisterDragStart}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleMinisterDrop}
            isDragging={draggedMinisterWidget === 'minister-schemes'}
          >
            <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center justify-between">
                <span>Apex Priority Schemes (Cabinet Directive)</span>
                <span className="text-[11px] text-indigo-400 font-medium">Live DBT & Infrastructure Pipeline</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {schemes.slice(0, 4).map((s) => (
                  <div key={s.id} className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">{s.code}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {s.utilizationPercentage}%
                      </span>
                    </div>
                    <h5 className="font-semibold text-xs text-white truncate" title={s.name}>
                      {s.name}
                    </h5>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2">
                      <span>Outlay: ₹{s.allocatedBudget} Cr</span>
                      <span className="font-semibold text-white">₹{s.utilizedBudget} Cr</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SortableWidgetWrapper>
        );

      case 'minister-virements':
        return (
          <SortableWidgetWrapper
            key="minister-virements"
            id="minister-virements"
            index={index}
            total={total}
            isPersonalizing={isPersonalizingMinister}
            title="3. High-Value Virement Queue"
            badge="Statutory Sign-off"
            onMoveUp={() => moveMinisterWidget('minister-virements', 'up')}
            onMoveDown={() => moveMinisterWidget('minister-virements', 'down')}
            onDragStart={handleMinisterDragStart}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleMinisterDrop}
            isDragging={draggedMinisterWidget === 'minister-virements'}
          >
            <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    High-Value Inter-Scheme Transfers Pending Approval
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold">
                    {pendingCount} Requests
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  GFR 2017 Rule 10 requires Finance Minister concurrence for re-allocations exceeding ₹100 Crores between Demand heads.
                </p>
              </div>

              <button
                onClick={() => onNavigate('/budgets')}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs"
              >
                <span>Review & Sign-Off Virements</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </SortableWidgetWrapper>
        );

      default:
        return null;
    }
  };

  // -----------------------------------------------------------------
  // CLERK WIDGET RENDERERS
  // -----------------------------------------------------------------
  const renderClerkWidget = (widgetId: string, index: number, total: number) => {
    switch (widgetId) {
      case 'clerk-counters':
        return (
          <SortableWidgetWrapper
            key="clerk-counters"
            id="clerk-counters"
            index={index}
            total={total}
            isPersonalizing={isPersonalizingClerk}
            title="1. Treasury Inward Counters"
            badge="Real-time Status"
            onMoveUp={() => moveClerkWidget('clerk-counters', 'up')}
            onMoveDown={() => moveClerkWidget('clerk-counters', 'down')}
            onDragStart={handleClerkDragStart}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleClerkDrop}
            isDragging={draggedClerkWidget === 'clerk-counters'}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Today's Inward Bills</div>
                <div className="text-2xl font-extrabold text-white mt-1">42</div>
                <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">36 Verified & Passed</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ready for DDO Sanction</div>
                <div className="text-2xl font-extrabold text-indigo-400 mt-1">2</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Token Allocated</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Audit Objections</div>
                <div className="text-2xl font-extrabold text-amber-400 mt-1">4</div>
                <div className="text-[10px] text-amber-400 mt-0.5 font-medium">TDS / GST Mismatches</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Major Head Sub-Limit</div>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">89.4%</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">₹340 Cr balance available</div>
              </div>
            </div>
          </SortableWidgetWrapper>
        );

      case 'clerk-queue':
        return (
          <SortableWidgetWrapper
            key="clerk-queue"
            id="clerk-queue"
            index={index}
            total={total}
            isPersonalizing={isPersonalizingClerk}
            title="2. Inward Voucher Clearing Queue"
            badge="DDO Station"
            onMoveUp={() => moveClerkWidget('clerk-queue', 'up')}
            onMoveDown={() => moveClerkWidget('clerk-queue', 'down')}
            onDragStart={handleClerkDragStart}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleClerkDrop}
            isDragging={draggedClerkWidget === 'clerk-queue'}
          >
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Active Daily Voucher Clearing Queue (PFMS Integrated)
                </h4>
                <span className="text-[10px] text-zinc-500 font-mono">DDO Sign-off Station</span>
              </div>

              <div className="divide-y divide-zinc-800/80 rounded-xl overflow-hidden">
                {clerkVouchers.map((v) => (
                  <div key={v.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-white">{v.id}</span>
                        <span className="text-zinc-400">•</span>
                        <span className="font-semibold text-zinc-200">{v.payee}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {v.head} • <span className="font-bold text-white">{v.amount}</span> • {v.date}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          v.status === 'FORWARDED_TO_DDO'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : v.status === 'VERIFIED'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : v.status === 'PENDING_DDO'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {v.status.replace(/_/g, ' ')}
                      </span>

                      {v.status !== 'FORWARDED_TO_DDO' && (
                        <button
                          onClick={() => handleForwardToDDO(v.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-xs"
                        >
                          Stamp & Forward
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SortableWidgetWrapper>
        );

      case 'clerk-reconciliation':
        return (
          <SortableWidgetWrapper
            key="clerk-reconciliation"
            id="clerk-reconciliation"
            index={index}
            total={total}
            isPersonalizing={isPersonalizingClerk}
            title="3. Ingestion & Reconciliation Station"
            badge="PFMS Gateway"
            onMoveUp={() => moveClerkWidget('clerk-reconciliation', 'up')}
            onMoveDown={() => moveClerkWidget('clerk-reconciliation', 'down')}
            onDragStart={handleClerkDragStart}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleClerkDrop}
            isDragging={draggedClerkWidget === 'clerk-reconciliation'}
          >
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">
                  Batch Reconciliation & Automated Validation
                </span>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Direct sync with Public Financial Management System (PFMS) gateway. All uploaded vouchers checked for duplicate invoice tokens.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('/data-import')}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition-colors"
                >
                  PFMS Importer
                </button>
                <button
                  onClick={() => onNavigate('/expenditure')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Expenditure Register
                </button>
              </div>
            </div>
          </SortableWidgetWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Alert Banner if active */}
      {toastMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. WORKFLOW OVERVIEW SUMMARY CARD (Status-Coded Progress Bar) */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Budget Adjustment & Virement Workflow Overview
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  GFR 2017 Rule 10/61
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Statutory tracking of inter-scheme transfers, re-appropriations, and secretarial approvals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-workflow-open-register"
              onClick={() => onNavigate('/budgets')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
            >
              <span>View Workflow Register ({adjustments.length})</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Status Count Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">Pending Approval</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div className="text-2xl font-extrabold text-amber-400 font-mono">{pendingCount}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{pendingPercent}% of active pipeline</div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">Approved & Sanctioned</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">{approvedCount}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{approvedPercent}% sanctioned</div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">Draft Proposals</span>
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
            </div>
            <div className="text-2xl font-extrabold text-zinc-200 font-mono">{draftCount}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{draftPercent}% under formulation</div>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-400 font-medium">Rejected / Disallowed</span>
              <span className="w-2 h-2 rounded-full bg-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-400 font-mono">{rejectedCount}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{rejectedPercent}% returned</div>
          </div>
        </div>

        {/* Segmented Status-Coded Progress Bar */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="font-semibold text-zinc-300">Approval Lifecycle Trajectory</span>
            <span className="font-mono text-zinc-400">
              {approvedCount} Sanctioned • {pendingCount} Pending • {draftCount} Draft • {rejectedCount} Rejected
            </span>
          </div>

          <div className="w-full h-3.5 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800 flex gap-0.5">
            <div
              className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
              style={{ width: `${approvedPercent}%` }}
              title={`Approved: ${approvedCount} (${approvedPercent}%)`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${pendingPercent}%` }}
              title={`Pending: ${pendingCount} (${pendingPercent}%)`}
            />
            <div
              className="bg-zinc-600 h-full transition-all duration-500"
              style={{ width: `${draftPercent}%` }}
              title={`Draft: ${draftCount} (${draftPercent}%)`}
            />
            <div
              className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
              style={{ width: `${rejectedPercent}%` }}
              title={`Rejected: ${rejectedCount} (${rejectedPercent}%)`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Approved ({approvedPercent}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Pending Approval ({pendingPercent}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" /> Draft ({draftPercent}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Disallowed ({rejectedPercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. ROLE PERSPECTIVE 1: MINISTER / CABINET VIEW                */}
      {/* ------------------------------------------------------------- */}
      {isMinister && (
        <div className="p-6 rounded-3xl bg-zinc-900 border border-indigo-900/40 shadow-2xl relative overflow-hidden space-y-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Minister View Header with Personalize Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Union Cabinet & Ministerial Oversight Deck
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Apex Executive View
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  High-level fiscal health, consolidated state/national budget envelope, and priority scheme progress.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Drag & Drop Personalize Controls */}
              <button
                type="button"
                onClick={() => setIsPersonalizingMinister(!isPersonalizingMinister)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isPersonalizingMinister
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-zinc-700'
                }`}
                title="Personalize your Minister View layout by dragging widgets"
              >
                <Move className="w-3.5 h-3.5" />
                <span>{isPersonalizingMinister ? 'Done Personalizing' : 'Personalize Layout'}</span>
              </button>

              {isPersonalizingMinister && (
                <button
                  type="button"
                  onClick={resetMinisterLayout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium border border-zinc-700 transition-colors"
                  title="Reset to default order"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              )}

              <button
                id="btn-minister-print-dossier"
                onClick={onPrintDossier}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-200" />
                <span>Print Cabinet Fiscal Dossier</span>
              </button>
            </div>
          </div>

          {isPersonalizingMinister && (
            <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-200">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-indigo-400" />
                <span>
                  <strong>Customizing Minister View:</strong> Drag widgets using the top handle to prioritize reporting sections according to your ministerial workflow.
                </span>
              </div>
              <span className="text-[10px] font-mono text-indigo-400">Order Auto-Saved</span>
            </div>
          )}

          {/* Minister Widgets */}
          <div className="space-y-4">
            {ministerWidgetOrder.map((widgetId, index) =>
              renderMinisterWidget(widgetId, index, ministerWidgetOrder.length)
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. ROLE PERSPECTIVE 2: DEPARTMENT CLERK VIEW                  */}
      {/* ------------------------------------------------------------- */}
      {isClerk && (
        <div className="p-6 rounded-3xl bg-zinc-900 border border-emerald-900/40 shadow-2xl relative overflow-hidden space-y-5">
          {/* Clerk View Header with Personalize Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Department Accounts Desk & Voucher Processing Center
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Accounts Clerk View
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Pending bill uploads, daily voucher clearing queue, data quality validation warnings, draft entries, and ledger batches.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Drag & Drop Personalize Controls */}
              <button
                type="button"
                onClick={() => setIsPersonalizingClerk(!isPersonalizingClerk)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isPersonalizingClerk
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border-zinc-700'
                }`}
                title="Personalize your Clerk View layout by dragging widgets"
              >
                <Move className="w-3.5 h-3.5" />
                <span>{isPersonalizingClerk ? 'Done Personalizing' : 'Personalize Layout'}</span>
              </button>

              {isPersonalizingClerk && (
                <button
                  type="button"
                  onClick={resetClerkLayout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium border border-zinc-700 transition-colors"
                  title="Reset to default order"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              )}

              <button
                id="btn-clerk-new-voucher"
                onClick={() => onNavigate('/expenditure')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Voucher Entry</span>
              </button>

              <button
                id="btn-clerk-import-csv"
                onClick={() => onNavigate('/data-import')}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
                <span>Batch CSV Import</span>
              </button>
            </div>
          </div>

          {isPersonalizingClerk && (
            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <Move className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>Customizing Clerk View:</strong> Drag widgets to arrange your daily clearing queue, counters, and reconciliation tools in preferred order.
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Order Auto-Saved</span>
            </div>
          )}

          {/* Clerk Widgets */}
          <div className="space-y-4">
            {clerkWidgetOrder.map((widgetId, index) =>
              renderClerkWidget(widgetId, index, clerkWidgetOrder.length)
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. ROLE PERSPECTIVE 3: FINANCE OFFICER / JS&FA VIEW          */}
      {/* ------------------------------------------------------------- */}
      {isFinanceOfficer && (
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Finance Administration & Expenditure Control (JS&FA)
                </h3>
                <p className="text-xs text-zinc-400">
                  Fund tranche releases, General Financial Rules (GFR Rule 10/61) compliance, and DDO tokenization.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/fund-releases')}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              <span>Manage Fund Releases →</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400">Tranche Disbursement Velocity</div>
              <div className="text-2xl font-bold text-white mt-1">94.8% on Schedule</div>
              <p className="text-[11px] text-zinc-400 mt-1">Zero tranche bottlenecks reported in current cycle.</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400">GFR Rule 10 Statutory Vetting</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">100% Compliant</div>
              <p className="text-[11px] text-zinc-400 mt-1">All sanctioned virements verified within Demand heads.</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400">Q4 March Rush Protection</div>
              <div className="text-2xl font-bold text-indigo-400 mt-1">Cap: 33% (Active: 28%)</div>
              <p className="text-[11px] text-zinc-400 mt-1">Curbing unbudgeted fiscal surge before March 31.</p>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. ROLE PERSPECTIVE 4: AUDITOR (CAG) VIEW                    */}
      {/* ------------------------------------------------------------- */}
      {isAuditor && (
        <div className="p-6 rounded-3xl bg-zinc-900 border border-rose-900/40 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Director General of Audit & CAG Liaison Vigilance Station
                </h3>
                <p className="text-xs text-zinc-400">
                  Forensic audit trail, suspicious March Rush spike tracking, and statutory compliance queries.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/audit')}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
            >
              Open Audit Ledger →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400">Tender Splitting Anomalies</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">2 Flagged</div>
              <p className="text-[11px] text-zinc-400 mt-1">Potential threshold bypass below ₹50 Lakhs limit.</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400">Audit Queries Dispatched</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">14 Dispatched</div>
              <p className="text-[11px] text-zinc-400 mt-1">11 Replied, 3 Awaiting DDO justification.</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <div className="text-xs text-zinc-400">Statutory Compliance Index</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">98.4%</div>
              <p className="text-[11px] text-zinc-400 mt-1">Meets CAG Public Accounts Committee parameters.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
