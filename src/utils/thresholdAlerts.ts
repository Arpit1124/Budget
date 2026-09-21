import { Department } from '../types';

export type ThresholdAlertLevel = 'CRITICAL_95' | 'WARNING_80' | 'NORMAL';

export interface ThresholdAlertItem {
  departmentId: string;
  departmentName: string;
  code: string;
  allocatedBudget: number;
  utilizedBudget: number;
  utilizationPercentage: number;
  remainingBudget: number;
  level: ThresholdAlertLevel;
  title: string;
  message: string;
  toastType: 'WARNING' | 'ERROR';
  timestamp: string;
}

// In-memory set to prevent spamming duplicate toasts on every re-render while tracking alerts
const alertedCache = new Set<string>();

/**
 * Evaluates whether a department has exceeded 80% or 95% of its allocated budget.
 */
export function evaluateDepartmentThreshold(dept: {
  id: string;
  name: string;
  code: string;
  allocatedBudget: number;
  utilizedBudget: number;
  utilizationPercentage?: number;
  remainingBudget?: number;
}): ThresholdAlertItem | null {
  if (!dept.allocatedBudget || dept.allocatedBudget <= 0) return null;

  const percentage = Number(
    ((dept.utilizedBudget / dept.allocatedBudget) * 100).toFixed(1)
  );
  const remaining = Math.max(0, dept.allocatedBudget - dept.utilizedBudget);
  const timestamp = new Date().toLocaleTimeString();

  if (percentage >= 95.0) {
    return {
      departmentId: dept.id,
      departmentName: dept.name,
      code: dept.code,
      allocatedBudget: dept.allocatedBudget,
      utilizedBudget: dept.utilizedBudget,
      utilizationPercentage: percentage,
      remainingBudget: remaining,
      level: 'CRITICAL_95',
      toastType: 'ERROR',
      title: `🚨 Critical Budget Alert (95%+): ${dept.code}`,
      message: `${dept.name} has exhausted ${percentage}% of allocated budget (₹${dept.utilizedBudget.toLocaleString('en-IN')} / ₹${dept.allocatedBudget.toLocaleString('en-IN')} Cr). Only ₹${remaining.toLocaleString('en-IN')} Cr remaining. GFR Rule 60 violation risk.`,
      timestamp,
    };
  }

  if (percentage >= 80.0) {
    return {
      departmentId: dept.id,
      departmentName: dept.name,
      code: dept.code,
      allocatedBudget: dept.allocatedBudget,
      utilizedBudget: dept.utilizedBudget,
      utilizationPercentage: percentage,
      remainingBudget: remaining,
      level: 'WARNING_80',
      toastType: 'WARNING',
      title: `⚠️ Budget Threshold Warning (80%+): ${dept.code}`,
      message: `${dept.name} expenditure has reached ${percentage}% of allocation (₹${dept.utilizedBudget.toLocaleString('en-IN')} / ₹${dept.allocatedBudget.toLocaleString('en-IN')} Cr). Nearing statutory expenditure threshold.`,
      timestamp,
    };
  }

  return null;
}

/**
 * Checks all departments and optionally fires toast notifications for any exceeding 80% or 95%.
 */
export function checkAllDepartmentThresholds(
  departments: Department[],
  addToast?: (
    title: string,
    message: string,
    type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR'
  ) => void,
  options?: { forceNotify?: boolean; maxToasts?: number }
): ThresholdAlertItem[] {
  const alerts: ThresholdAlertItem[] = [];

  for (const dept of departments) {
    const alert = evaluateDepartmentThreshold(dept);
    if (alert) {
      alerts.push(alert);
    }
  }

  // Sort: Critical (95%+) first, then highest percentage
  alerts.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);

  if (addToast) {
    const maxToasts = options?.maxToasts ?? 3;
    let toastCount = 0;

    for (const alert of alerts) {
      const cacheKey = `${alert.departmentId}-${alert.level}`;
      if (options?.forceNotify || !alertedCache.has(cacheKey)) {
        if (toastCount < maxToasts) {
          addToast(alert.title, alert.message, alert.toastType);
          alertedCache.add(cacheKey);
          toastCount++;
        }
      }
    }
  }

  return alerts;
}

/**
 * Triggers a threshold alert toast specifically for one department when its expenditure changes.
 */
export function notifyDepartmentThresholdIfExceeded(
  dept: {
    id: string;
    name: string;
    code: string;
    allocatedBudget: number;
    utilizedBudget: number;
    utilizationPercentage?: number;
  },
  addToast: (
    title: string,
    message: string,
    type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR'
  ) => void
): boolean {
  const alert = evaluateDepartmentThreshold(dept);
  if (alert) {
    addToast(alert.title, alert.message, alert.toastType);
    alertedCache.add(`${alert.departmentId}-${alert.level}`);
    return true;
  }
  return false;
}

/**
 * Clears the alert debounce cache so manual threshold scans trigger afresh.
 */
export function resetThresholdAlertCache(): void {
  alertedCache.clear();
}
