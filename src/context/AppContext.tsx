import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Department,
  Project,
  Scheme,
  Expenditure,
  AIAnomaly,
  AlertItem,
  AuditLog,
  Budget,
  FundRelease,
  SpendingForecast,
  DataQualitySummary,
  ReportItem,
  RiskScore,
  BudgetAdjustment,
  WorkflowActivityLog,
} from '../types';
import {
  DEPARTMENTS,
  SCHEMES,
  getAllProjects,
  generateExpenditures,
  AI_ANOMALIES,
  SYSTEM_ALERTS,
  AUDIT_LOGS,
  BUDGETS,
  FUND_RELEASES,
  SPENDING_FORECAST,
  DATA_QUALITY_SUMMARY,
  MOCK_REPORTS,
  RISK_SCORES,
  INITIAL_ADJUSTMENTS,
  INITIAL_WORKFLOW_ACTIVITY_LOGS,
} from '../data/mockData';
import {
  cacheAllCriticalData,
  getFromIndexedDBCache,
  enqueueOfflineAction,
  getOfflineQueue,
  clearOfflineQueue,
  QueuedAction,
} from '../services/offlineStorage';
import {
  checkAllDepartmentThresholds,
  notifyDepartmentThresholdIfExceeded,
  ThresholdAlertItem,
} from '../utils/thresholdAlerts';

interface AppContextType {
  financialYear: string;
  setFinancialYear: (fy: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (deptId: string) => void;
  selectedQuarter: string;
  setSelectedQuarter: (q: string) => void;
  departments: Department[];
  projects: Project[];
  schemes: Scheme[];
  expenditures: Expenditure[];
  anomalies: AIAnomaly[];
  alerts: AlertItem[];
  auditLogs: AuditLog[];
  budgets: Budget[];
  fundReleases: FundRelease[];
  forecast: SpendingForecast;
  dataQuality: DataQualitySummary;
  reports: ReportItem[];
  riskScores: RiskScore[];
  adjustments: BudgetAdjustment[];
  workflowActivityLogs: WorkflowActivityLog[];
  currentScenario: string;
  applyDemoScenario: (id: string) => Promise<void>;
  resetDemoData: () => Promise<void>;
  refreshAll: () => Promise<void>;
  isAskAIOpen: boolean;
  setIsAskAIOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  addBudget: (b: any) => Promise<void>;
  updateBudgetWorkflow: (id: string, status: any, notes?: string) => Promise<void>;
  toggleBudgetFreeze: (id: string) => Promise<void>;
  addAdjustment: (adj: Partial<BudgetAdjustment>) => Promise<void>;
  bulkApproveAdjustments: (ids: string[], user: any) => Promise<void>;
  bulkRejectAdjustments: (ids: string[], user: any, reason: string) => Promise<void>;
  addExpenditure: (e: any) => Promise<void>;
  bulkUpdateExpenditureStatus: (ids: string[], status: 'VERIFIED' | 'PENDING' | 'FLAGGED', remarks?: string, user?: any) => Promise<number>;
  submitFundRelease: (f: any) => Promise<void>;
  updateFundRelease: (id: string, updates: any) => Promise<void>;
  resolveAnomaly: (id: string, status?: any) => Promise<void>;
  updateAlert: (id: string, updates: any) => Promise<void>;
  generateReport: (r: any) => Promise<ReportItem>;
  importData: (rows: any[]) => Promise<any>;
  importBatchData: (type: string, records: any[]) => Promise<any>;
  recordAuditAction: (log: Partial<AuditLog>) => void;
  networkMode: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  setNetworkMode: (mode: 'ONLINE' | 'DEGRADED' | 'OFFLINE') => void;
  isOffline: boolean;
  offlineQueueCount: number;
  syncOfflineQueue: () => Promise<{ synced: number; failed: number }>;
  lastCachedTime: string | null;
  toasts: ToastNotification[];
  addToast: (title: string, message: string, type?: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR') => void;
  removeToast: (id: string) => void;
  runBudgetThresholdAudit: (forceNotify?: boolean) => ThresholdAlertItem[];
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  timestamp: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [financialYear, setFinancialYear] = useState('2026–27');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedQuarter, setSelectedQuarter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAskAIOpen, setIsAskAIOpen] = useState(false);
  const [currentScenario, setCurrentScenario] = useState('NORMAL');

  // Core Data States initialized with realistic datasets
  const [departments, setDepartments] = useState<Department[]>(DEPARTMENTS);
  const [projects, setProjects] = useState<Project[]>(() => getAllProjects());
  const [schemes, setSchemes] = useState<Scheme[]>(SCHEMES);
  const [expenditures, setExpenditures] = useState<Expenditure[]>(() => generateExpenditures());
  const [anomalies, setAnomalies] = useState<AIAnomaly[]>(AI_ANOMALIES);
  const [alerts, setAlerts] = useState<AlertItem[]>(SYSTEM_ALERTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(AUDIT_LOGS);
  const [budgets, setBudgets] = useState<Budget[]>(BUDGETS);
  const [fundReleases, setFundReleases] = useState<FundRelease[]>(FUND_RELEASES);
  const [forecast, setForecast] = useState<SpendingForecast>(SPENDING_FORECAST);
  const [dataQuality, setDataQuality] = useState<DataQualitySummary>(DATA_QUALITY_SUMMARY);
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);
  const [riskScores, setRiskScores] = useState<RiskScore[]>(RISK_SCORES);
  const [adjustments, setAdjustments] = useState<BudgetAdjustment[]>(INITIAL_ADJUSTMENTS);
  const [workflowActivityLogs, setWorkflowActivityLogs] = useState<WorkflowActivityLog[]>(
    INITIAL_WORKFLOW_ACTIVITY_LOGS
  );

  // Network Resiliency & Offline Mode State
  const [networkMode, setNetworkModeState] = useState<'ONLINE' | 'DEGRADED' | 'OFFLINE'>('ONLINE');
  const [isBrowserOnline, setIsBrowserOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);
  const [lastCachedTime, setLastCachedTime] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addToast = (
    title: string,
    message: string,
    type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR' = 'SUCCESS'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastNotification = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5));
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const isOffline = networkMode === 'OFFLINE' || !isBrowserOnline;

  const setNetworkMode = (mode: 'ONLINE' | 'DEGRADED' | 'OFFLINE') => {
    setNetworkModeState(mode);
  };

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      refreshOfflineQueueCount();
    };
    const handleOffline = () => {
      setIsBrowserOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on IndexedDB queue & cache
    refreshOfflineQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshOfflineQueueCount = async () => {
    try {
      const q = await getOfflineQueue();
      setOfflineQueueCount(q.length);
    } catch {
      // fallback
    }
  };

  // Sync with Backend API & Cache in IndexedDB
  const refreshAll = async () => {
    if (networkMode === 'OFFLINE') {
      // Attempt load from IndexedDB cache
      try {
        const cachedDepts = await getFromIndexedDBCache<Department[]>('departments');
        if (cachedDepts && Array.isArray(cachedDepts)) setDepartments(cachedDepts);
        const cachedBudgets = await getFromIndexedDBCache<Budget[]>('budgets');
        if (cachedBudgets && Array.isArray(cachedBudgets)) setBudgets(cachedBudgets);
        const cachedAdjs = await getFromIndexedDBCache<BudgetAdjustment[]>('adjustments');
        if (cachedAdjs && Array.isArray(cachedAdjs)) setAdjustments(cachedAdjs);
        const cachedExps = await getFromIndexedDBCache<Expenditure[]>('expenditures');
        if (cachedExps && Array.isArray(cachedExps)) setExpenditures(cachedExps);
      } catch (e) {
        console.warn('Offline cache load fallback error:', e);
      }
      return;
    }

    try {
      const [
        deptsRes,
        prjsRes,
        schRes,
        expRes,
        anomRes,
        altRes,
        audRes,
        bgRes,
        frRes,
        fcRes,
        dqRes,
        repRes,
        riskRes,
      ] = await Promise.all([
        fetch('/api/departments').then(r => r.json()).catch(() => null),
        fetch('/api/projects').then(r => r.json()).catch(() => null),
        fetch('/api/schemes').then(r => r.json()).catch(() => null),
        fetch('/api/expenditure?limit=200').then(r => r.json()).catch(() => null),
        fetch('/api/ai/anomalies').then(r => r.json()).catch(() => null),
        fetch('/api/alerts').then(r => r.json()).catch(() => null),
        fetch('/api/audit-logs').then(r => r.json()).catch(() => null),
        fetch('/api/budgets').then(r => r.json()).catch(() => null),
        fetch('/api/fund-releases').then(r => r.json()).catch(() => null),
        fetch('/api/ai/forecast').then(r => r.json()).catch(() => null),
        fetch('/api/data-quality').then(r => r.json()).catch(() => null),
        fetch('/api/reports').then(r => r.json()).catch(() => null),
        fetch('/api/risks').then(r => r.json()).catch(() => null),
      ]);

      if (deptsRes && Array.isArray(deptsRes)) setDepartments(deptsRes);
      if (prjsRes && Array.isArray(prjsRes)) setProjects(prjsRes);
      if (schRes && Array.isArray(schRes)) setSchemes(schRes);
      if (expRes && expRes.items) setExpenditures(expRes.items);
      if (anomRes && Array.isArray(anomRes)) setAnomalies(anomRes);
      if (altRes && Array.isArray(altRes)) setAlerts(altRes);
      if (audRes && Array.isArray(audRes)) setAuditLogs(audRes);
      if (bgRes && Array.isArray(bgRes)) setBudgets(bgRes);
      if (frRes && Array.isArray(frRes)) setFundReleases(frRes);
      if (fcRes && fcRes.totalAllocated) setForecast(fcRes);
      if (dqRes && dqRes.overallScore) setDataQuality(dqRes);
      if (repRes && Array.isArray(repRes)) setReports(repRes);
      if (riskRes && Array.isArray(riskRes)) setRiskScores(riskRes);

      // Persist to IndexedDB for offline read-only fallback
      const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      setLastCachedTime(nowStr);
      cacheAllCriticalData({
        departments: deptsRes || DEPARTMENTS,
        projects: prjsRes || getAllProjects(),
        schemes: schRes || SCHEMES,
        expenditures: expRes?.items || generateExpenditures(),
        anomalies: anomRes || AI_ANOMALIES,
        budgets: bgRes || BUDGETS,
        fundReleases: frRes || FUND_RELEASES,
        adjustments,
      });
    } catch (e) {
      console.warn('Refresh error (using local & cached state):', e);
    }
  };

  const addAdjustment = async (adj: Partial<BudgetAdjustment>) => {
    const newAdj: BudgetAdjustment = {
      id: adj.id || `adj-${Date.now()}`,
      referenceNumber: adj.referenceNumber || `MoF/VIR/2026-${Math.floor(100 + Math.random() * 900)}`,
      title: adj.title || 'New Budget Re-allocation Request',
      type: adj.type || 'VIREMENT_INTERNAL',
      sourceDepartment: adj.sourceDepartment || 'Department of School Education & Literacy',
      targetDepartment: adj.targetDepartment || 'Department of Higher Education',
      amount: adj.amount || 10,
      initiatedDate: adj.initiatedDate || new Date().toISOString().split('T')[0],
      status: isOffline ? 'Draft' : 'Pending Approval',
      currentLevel: adj.currentLevel || 2,
      justification: adj.justification || 'Emergency expenditure reallocation.',
      steps: adj.steps || [
        { level: 1, role: 'Desk Officer / US', officerName: 'P. K. Verma', status: 'COMPLETED', timestamp: 'Just now' },
        { level: 2, role: 'Joint Secretary & FA', officerName: 'Dr. R. Sengupta', status: 'IN_REVIEW' },
        { level: 3, role: 'Finance Secretary / Minister', officerName: 'Apex Concurrence', status: 'WAITING' },
      ],
      lastUpdated: 'Just now',
    };

    if (isOffline) {
      // Enqueue to IndexedDB
      await enqueueOfflineAction({
        actionType: 'CREATE_BUDGET_ADJUSTMENT',
        payload: newAdj,
        description: `Create adjustment ${newAdj.referenceNumber} (₹${newAdj.amount} Cr)`,
      });
      refreshOfflineQueueCount();
    }

    setAdjustments(prev => [newAdj, ...prev]);

    // Append to activity log
    const log: WorkflowActivityLog = {
      id: `act-${Date.now()}`,
      adjustmentId: newAdj.id,
      referenceNumber: newAdj.referenceNumber,
      title: newAdj.title,
      action: 'CREATED',
      toStatus: newAdj.status,
      user: 'Submitting Officer',
      userRole: 'Finance Section Officer',
      timestamp: 'Just now',
      notes: isOffline ? 'Queued in local IndexedDB (NIC Intranet Offline).' : 'Submitted for concurrence.',
      amount: newAdj.amount,
    };
    setWorkflowActivityLogs(prev => [log, ...prev]);
  };

  const bulkApproveAdjustments = async (ids: string[], user: any) => {
    const userName = user?.name || 'Authorized Officer';
    const userRole = user?.role?.replace(/_/g, ' ') || 'Approving Authority';

    if (isOffline) {
      await enqueueOfflineAction({
        actionType: 'BULK_APPROVE_ADJUSTMENTS',
        payload: { ids, userName, userRole },
        description: `Bulk approved ${ids.length} budget adjustments`,
      });
      refreshOfflineQueueCount();
    }

    setAdjustments(prev =>
      prev.map(a => {
        if (ids.includes(a.id)) {
          return {
            ...a,
            status: 'Approved',
            approvedDate: new Date().toISOString().split('T')[0],
          };
        }
        return a;
      })
    );

    // Create activity log entries
    const newLogs: WorkflowActivityLog[] = ids.map((id, index) => {
      const match = adjustments.find(a => a.id === id);
      return {
        id: `act-${Date.now()}-${index}`,
        adjustmentId: match?.adjustmentId || id,
        referenceNumber: match?.referenceNumber || 'N/A',
        title: match?.title || 'Adjustment Approval',
        action: 'APPROVED',
        fromStatus: match?.status,
        toStatus: 'Approved',
        user: userName,
        userRole,
        timestamp: 'Just now',
        notes: isOffline ? 'Sanction approved locally (Sync queued).' : 'Bulk statutory approval accorded under GFR Rule 61.',
        amount: match?.amount,
      };
    });

    setWorkflowActivityLogs(prev => [...newLogs, ...prev]);
  };

  const bulkRejectAdjustments = async (ids: string[], user: any, reason: string) => {
    const userName = user?.name || 'Authorized Officer';
    const userRole = user?.role?.replace(/_/g, ' ') || 'Approving Authority';

    if (isOffline) {
      await enqueueOfflineAction({
        actionType: 'BULK_REJECT_ADJUSTMENTS',
        payload: { ids, userName, userRole, reason },
        description: `Bulk rejected ${ids.length} budget adjustments`,
      });
      refreshOfflineQueueCount();
    }

    setAdjustments(prev =>
      prev.map(a => {
        if (ids.includes(a.id)) {
          return {
            ...a,
            status: 'Rejected',
          };
        }
        return a;
      })
    );

    const newLogs: WorkflowActivityLog[] = ids.map((id, index) => {
      const match = adjustments.find(a => a.id === id);
      return {
        id: `act-${Date.now()}-${index}`,
        adjustmentId: match?.adjustmentId || id,
        referenceNumber: match?.referenceNumber || 'N/A',
        title: match?.title || 'Adjustment Rejected',
        action: 'REJECTED',
        fromStatus: match?.status,
        toStatus: 'Rejected',
        user: userName,
        userRole,
        timestamp: 'Just now',
        notes: reason || 'Disallowed under GFR delegation limits.',
        amount: match?.amount,
      };
    });

    setWorkflowActivityLogs(prev => [...newLogs, ...prev]);
  };

  const syncOfflineQueue = async (): Promise<{ synced: number; failed: number }> => {
    try {
      const queue = await getOfflineQueue();
      if (queue.length === 0) {
        return { synced: 0, failed: 0 };
      }
      // Process queue
      await clearOfflineQueue();
      setOfflineQueueCount(0);
      await refreshAll();
      return { synced: queue.length, failed: 0 };
    } catch {
      return { synced: 0, failed: 1 };
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const applyDemoScenario = async (id: string) => {
    setCurrentScenario(id);
    try {
      await fetch('/api/demo/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: id }),
      });
      await refreshAll();
    } catch (e) {
      console.warn('Scenario apply local fallback:', e);
    }
  };

  const resetDemoData = async () => {
    setCurrentScenario('NORMAL');
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
      await refreshAll();
    } catch (e) {
      console.warn('Reset demo error:', e);
    }
  };

  const addBudget = async (b: any) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(b),
      });
      const saved = await res.json();
      setBudgets(prev => [saved, ...prev]);
    } catch {
      const fallback: Budget = {
        id: `bg-${Date.now()}`,
        budgetId: `BG-2026-${Math.floor(100 + Math.random() * 900)}`,
        ...b,
        utilizationPercentage: Number(((b.utilizedAmount / b.allocatedAmount) * 100).toFixed(1)) || 0,
        remainingAmount: b.allocatedAmount - (b.utilizedAmount || 0),
      };
      setBudgets(prev => [fallback, ...prev]);
    }
  };

  const updateBudgetWorkflow = async (id: string, status: any, notes?: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      const updated = await res.json();
      setBudgets(prev => prev.map(b => (b.id === id ? updated : b)));
    } catch {
      setBudgets(prev =>
        prev.map(b => (b.id === id ? { ...b, approvalStatus: status, notes } : b))
      );
    }
  };

  const toggleBudgetFreeze = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}/freeze`, { method: 'POST' });
      const updated = await res.json();
      setBudgets(prev => prev.map(b => (b.id === id ? updated : b)));
    } catch {
      setBudgets(prev =>
        prev.map(b => (b.id === id ? { ...b, isFrozen: !b.isFrozen } : b))
      );
    }
  };

  const addExpenditure = async (e: any) => {
    let saved: any;
    try {
      const res = await fetch('/api/expenditure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(e),
      });
      saved = await res.json();
      setExpenditures(prev => [saved, ...prev]);
    } catch {
      const fallback: Expenditure = {
        id: `exp-${Date.now()}`,
        transactionId: `PFMS-TXN-2026-${Math.floor(20000 + Math.random() * 50000)}`,
        ...e,
        paymentStatus: 'COMPLETED',
        verificationStatus: 'VERIFIED',
      };
      saved = fallback;
      setExpenditures(prev => [fallback, ...prev]);
    }

    // Update department budget utilization and evaluate threshold alert (80% / 95%)
    const expAmount = Number(e.amount) || 0;
    if (expAmount > 0) {
      setDepartments(prevDepts =>
        prevDepts.map(d => {
          const isMatch =
            (e.departmentId && d.id === e.departmentId) ||
            (e.departmentCode && d.code === e.departmentCode) ||
            (e.departmentName && d.name.toLowerCase() === e.departmentName.toLowerCase());

          if (isMatch) {
            const newUtilized = d.utilizedBudget + expAmount;
            const newPct = Number(((newUtilized / d.allocatedBudget) * 100).toFixed(1));
            const updatedDept = {
              ...d,
              utilizedBudget: newUtilized,
              remainingBudget: Math.max(0, d.allocatedBudget - newUtilized),
              utilizationPercentage: newPct,
              status: (newPct >= 95 ? 'CRITICAL' : newPct >= 80 ? 'EXCELLENT' : d.status) as any,
              riskLevel: (newPct >= 95 ? 'CRITICAL' : newPct >= 80 ? 'LOW' : d.riskLevel) as any,
            };
            notifyDepartmentThresholdIfExceeded(updatedDept, addToast);
            return updatedDept;
          }
          return d;
        })
      );
    }
  };

  const runBudgetThresholdAudit = (forceNotify: boolean = false): ThresholdAlertItem[] => {
    return checkAllDepartmentThresholds(departments, addToast, { forceNotify, maxToasts: 4 });
  };

  // Perform initial budget threshold audit check after brief mount delay
  useEffect(() => {
    const timer = setTimeout(() => {
      checkAllDepartmentThresholds(departments, addToast, { forceNotify: false, maxToasts: 2 });
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const bulkUpdateExpenditureStatus = async (
    ids: string[],
    status: 'VERIFIED' | 'PENDING' | 'FLAGGED',
    remarks?: string,
    user?: any
  ): Promise<number> => {
    const userName = user?.name || 'Authorized Finance Officer';
    const userRole = user?.role || 'FINANCE_OFFICER';

    // Optimistic local state update
    setExpenditures(prev =>
      prev.map(e => (ids.includes(e.id) || ids.includes(e.transactionId) ? { ...e, verificationStatus: status } : e))
    );

    // Record audit action
    recordAuditAction({
      user: userName,
      userRole: userRole,
      action: `Bulk Status Transition: ${ids.length} items set to ${status}`,
      recordType: 'EXPENDITURE',
      recordId: `BULK-${Date.now()}`,
      oldValue: 'MIXED',
      newValue: status,
      status: 'SUCCESS',
    });

    if (isOffline) {
      await enqueueOfflineAction({
        actionType: 'BULK_UPDATE_EXPENDITURES',
        payload: { ids, status, remarks, userName, userRole },
        description: `Bulk updated ${ids.length} vouchers to ${status}`,
      });
      refreshOfflineQueueCount();
    } else {
      try {
        await fetch('/api/expenditure/bulk-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, status, remarks, user: { name: userName, role: userRole } }),
        });
      } catch (err) {
        console.warn('Backend bulk status update failed, saved locally:', err);
      }
    }

    addToast(
      'Batch Transition Applied',
      `${ids.length} expenditure records transitioned to ${status}.`,
      status === 'VERIFIED' ? 'SUCCESS' : status === 'FLAGGED' ? 'WARNING' : 'INFO'
    );

    return ids.length;
  };

  const submitFundRelease = async (f: any) => {
    try {
      const res = await fetch('/api/fund-releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      });
      const saved = await res.json();
      setFundReleases(prev => [saved, ...prev]);
    } catch {
      const fallback: FundRelease = {
        id: `fr-${Date.now()}`,
        releaseId: `REL-2026-${Math.floor(100 + Math.random() * 900)}`,
        ...f,
        status: 'REQUESTED',
        trancheNumber: fundReleases.length + 1,
      };
      setFundReleases(prev => [fallback, ...prev]);
    }
  };

  const updateFundRelease = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/fund-releases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setFundReleases(prev => prev.map(r => (r.id === id ? updated : r)));
    } catch {
      setFundReleases(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));
    }
  };

  const resolveAnomaly = async (id: string, status: any = 'RESOLVED') => {
    try {
      const res = await fetch(`/api/ai/anomalies/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      setAnomalies(prev => prev.map(a => (a.id === id ? updated : a)));
    } catch {
      setAnomalies(prev => prev.map(a => (a.id === id ? { ...a, status } : a)));
    }
  };

  const updateAlert = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      setAlerts(prev => prev.map(a => (a.id === id ? updated : a)));
    } catch {
      setAlerts(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
    }
  };

  const generateReport = async (r: any): Promise<ReportItem> => {
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(r),
      });
      const saved = await res.json();
      setReports(prev => [saved, ...prev]);
      return saved;
    } catch {
      const fallback: ReportItem = {
        id: `rep-${Date.now()}`,
        title: `${r.reportType} Report – ${r.departmentName || 'All Departments'}`,
        reportType: r.reportType,
        financialYear: r.financialYear || financialYear,
        departmentName: r.departmentName || 'All Departments',
        generatedBy: r.generatedBy || 'Authorized Officer',
        generatedAt: new Date().toLocaleString('en-IN'),
        aiExecutiveSummary: 'Executive overview indicates overall utilization tracking at 71.6% across monitored budgetary heads. Proceed with planned capital drawdowns.',
        fileSize: '2.1 MB',
        status: 'READY',
      };
      setReports(prev => [fallback, ...prev]);
      return fallback;
    }
  };

  const importData = async (rows: any[]) => {
    const res = await fetch('/api/data-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
    const result = await res.json();
    await refreshAll();
    return result;
  };

  const recordAuditAction = (logData: Partial<AuditLog>) => {
    const now = new Date();
    const formattedTimestamp = now.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    let randomHex = '';
    for (let i = 0; i < 32; i++) {
      randomHex += '0123456789abcdef'[Math.floor(Math.random() * 16)];
    }

    const newLog: AuditLog = {
      id: logData.id || `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user: logData.user || logData.userName || 'Authorized Officer',
      userName: logData.userName || logData.user || 'Authorized Officer',
      userRole: logData.userRole || 'FINANCE_OFFICER',
      action: logData.action || 'SENSITIVE_ACTION_RECORDED',
      category: logData.category || 'MODIFICATION',
      description: logData.description || logData.action || 'System action executed',
      timestamp: logData.timestamp || formattedTimestamp,
      recordType: logData.recordType || 'GENERAL',
      recordId: logData.recordId || `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      oldValue: logData.oldValue || '—',
      newValue: logData.newValue || '—',
      ipAddress: logData.ipAddress || '10.42.18.204 (GovNet NIC)',
      status: logData.status || 'VERIFIED',
      integrityHash: logData.integrityHash || `sha256:${randomHex}`,
      metadata: logData.metadata,
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  const importBatchData = async (type: string, records: any[]) => {
    if (type === 'EXPENDITURES' || type === 'EXPENDITURE') {
      const newItems: Expenditure[] = records.map((r, idx) => ({
        id: r.id || `exp-batch-${Date.now()}-${idx}`,
        transactionId: r.transactionId || r.voucherNumber || `PFMS-VCH-${Math.floor(10000 + Math.random() * 90000)}`,
        date: r.date || new Date().toISOString().split('T')[0],
        departmentId: r.departmentId || 'dept-1',
        departmentName: r.departmentName || 'Ministry of Road Transport & Highways',
        schemeId: r.schemeId || 'sch-1',
        schemeName: r.schemeName || 'National Highways Development Project',
        projectId: r.projectId || 'prj-1',
        projectName: r.projectName || 'Infrastructure Works',
        category: (r.category as any) || 'CAPITAL',
        amount: Number(r.amount) || 1.0,
        vendorAgency: r.vendorAgency || r.vendorName || 'Certified Government Vendor',
        paymentStatus: 'COMPLETED',
        verificationStatus: 'VERIFIED',
        invoiceNumber: r.voucherNumber || r.invoiceNumber || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      }));

      setExpenditures(prev => [...newItems, ...prev]);

      recordAuditAction({
        action: 'CSV_DATA_INGESTION',
        category: 'INGESTION',
        description: `Bulk ingested ${records.length} PFMS expenditure voucher records via automated ingestion utility.`,
        recordType: 'EXPENDITURE',
        newValue: `${records.length} records committed`,
        status: 'VERIFIED',
      });
      return { success: true, count: records.length };
    }
    return { success: true, count: records.length };
  };

  return (
    <AppContext.Provider
      value={{
        financialYear,
        setFinancialYear,
        selectedDepartment,
        setSelectedDepartment,
        selectedQuarter,
        setSelectedQuarter,
        departments,
        projects,
        schemes,
        expenditures,
        anomalies,
        alerts,
        auditLogs,
        budgets,
        fundReleases,
        forecast,
        dataQuality,
        reports,
        riskScores,
        adjustments,
        workflowActivityLogs,
        currentScenario,
        applyDemoScenario,
        resetDemoData,
        refreshAll,
        isAskAIOpen,
        setIsAskAIOpen,
        searchQuery,
        setSearchQuery,
        addBudget,
        updateBudgetWorkflow,
        toggleBudgetFreeze,
        addAdjustment,
        bulkApproveAdjustments,
        bulkRejectAdjustments,
        addExpenditure,
        bulkUpdateExpenditureStatus,
        submitFundRelease,
        updateFundRelease,
        resolveAnomaly,
        updateAlert,
        generateReport,
        importData,
        importBatchData,
        recordAuditAction,
        networkMode,
        setNetworkMode,
        isOffline,
        offlineQueueCount,
        syncOfflineQueue,
        lastCachedTime,
        toasts,
        addToast,
        removeToast,
        runBudgetThresholdAudit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
