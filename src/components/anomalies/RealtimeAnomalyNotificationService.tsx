import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  BellRing,
  BellOff,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Sliders,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export interface AnomalyNotificationEvent {
  id: string;
  departmentId: string;
  departmentName: string;
  quarter: string;
  projectedAmountCr: number;
  actualAmountCr: number;
  variancePct: number;
  thresholdPct: number;
  detectedAt: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED';
  ruleViolated: string;
}

interface RealtimeAnomalyNotificationServiceProps {
  onSelectAnomaly?: (deptName: string) => void;
}

export const RealtimeAnomalyNotificationService: React.FC<RealtimeAnomalyNotificationServiceProps> = ({
  onSelectAnomaly,
}) => {
  const { departments, budgets, addToast, recordAuditAction } = useApp();

  // Surveillance Settings
  const [isSurveillanceActive, setIsSurveillanceActive] = useState<boolean>(true);
  const [varianceThreshold, setVarianceThreshold] = useState<number>(15); // Default 15% as requested
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeAlerts, setActiveAlerts] = useState<AnomalyNotificationEvent[]>([]);
  const [floatingToast, setFloatingToast] = useState<AnomalyNotificationEvent | null>(null);

  // Sound ref (Web Audio API synthetic beep for clean non-asset audio)
  const playAlertChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext might be constrained by autoplay policy
    }
  }, [soundEnabled]);

  // Check initial desktop notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setDesktopPermission(Notification.permission);
    }
  }, []);

  // Request browser notification permission
  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      addToast(
        'Desktop Notifications Unavailable',
        'Browser Notifications API is not supported or constrained in this frame. In-app alerts remain active.',
        'INFO'
      );
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setDesktopPermission(perm);
      if (perm === 'granted') {
        addToast(
          'Surveillance Alerts Enabled',
          'Desktop push alerts will now trigger when D3 variance exceeds 15%.',
          'SUCCESS'
        );
        recordAuditAction({
          action: 'BROWSER_ALERT_PERMISSION_GRANTED',
          category: 'SECURITY',
          description: 'User granted browser desktop notification permission for real-time budget anomaly surveillance.',
          recordType: 'NOTIFICATION_SERVICE',
          status: 'VERIFIED',
        });
      } else {
        addToast(
          'Permission Not Granted',
          'Desktop notifications were not permitted. High-variance anomalies will alert via in-app banner.',
          'INFO'
        );
      }
    } catch (err) {
      console.warn('Could not request notification permission:', err);
    }
  };

  // Push native desktop alert
  const pushDesktopNotification = useCallback((event: AnomalyNotificationEvent) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const title = `🚨 Budget Anomaly Alert: ${event.departmentName}`;
        const body = `Quarterly variance of ${event.variancePct > 0 ? '+' : ''}${event.variancePct.toFixed(1)}% detected in ${event.quarter} (Exceeds ${event.thresholdPct}% threshold).`;
        const notification = new Notification(title, {
          body,
          tag: `anomaly-${event.id}`,
        });
        notification.onclick = () => {
          window.focus();
          if (onSelectAnomaly) onSelectAnomaly(event.departmentName);
          notification.close();
        };
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }
  }, [onSelectAnomaly]);

  // Core surveillance detection logic based on D3 trend baseline patterns
  const runSurveillanceScan = useCallback((isManual = false) => {
    if (!isSurveillanceActive && !isManual) return;
    setIsScanning(true);

    // Standard quarterly distribution baseline in public finance:
    // Q1: 18%, Q2: 22%, Q3: 27%, Q4: 33%
    const quarters = [
      { name: 'Q1 (Apr-Jun)', baseShare: 0.18, currentMultipliers: [1.05, 0.95, 1.12, 0.88, 1.02] },
      { name: 'Q2 (Jul-Sep)', baseShare: 0.22, currentMultipliers: [1.08, 1.14, 0.96, 1.04, 1.10] },
      { name: 'Q3 (Oct-Dec)', baseShare: 0.27, currentMultipliers: [1.28, 1.19, 1.22, 1.05, 1.16] }, // Oct tender surges
      { name: 'Q4 (Jan-Mar)', baseShare: 0.33, currentMultipliers: [1.32, 1.29, 1.34, 1.18, 1.25] }, // March rush surges
    ];

    const detected: AnomalyNotificationEvent[] = [];

    // Scan departments against projected quarterly spending
    departments.forEach((dept, deptIdx) => {
      quarters.forEach(q => {
        const projectedQuarterBudget = dept.allocatedBudget * q.baseShare;
        // Current actual spend based on department rhythm & historical D3 baseline overlay
        const multiplier = q.currentMultipliers[deptIdx % q.currentMultipliers.length];
        const actualQuarterSpend = projectedQuarterBudget * multiplier;
        const variancePct = Math.round(((actualQuarterSpend - projectedQuarterBudget) / projectedQuarterBudget) * 1000) / 10;

        // Check if variance exceeds threshold (e.g. > 15%)
        if (Math.abs(variancePct) >= varianceThreshold) {
          const rule =
            q.name.includes('Q4') && variancePct > 20
              ? 'GFR Rule 62(3) March-Rush Ceiling Violation'
              : variancePct > 25
              ? 'Unseasonal Expenditure Surge (>25% Variance)'
              : 'Quarterly Allocation Variance Exceeds 15% Threshold';

          detected.push({
            id: `evt-${dept.id}-${q.name.substring(0, 2)}-${Date.now()}`,
            departmentId: dept.id,
            departmentName: dept.name,
            quarter: q.name,
            projectedAmountCr: Math.round(projectedQuarterBudget * 10) / 10,
            actualAmountCr: Math.round(actualQuarterSpend * 10) / 10,
            variancePct,
            thresholdPct: varianceThreshold,
            detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: 'ACTIVE',
            ruleViolated: rule,
          });
        }
      });
    });

    if (detected.length > 0) {
      // Pick top anomaly for urgent broadcast
      const topAnomaly = detected[0];
      setActiveAlerts(detected);
      setFloatingToast(topAnomaly);
      playAlertChime();
      pushDesktopNotification(topAnomaly);

      if (isManual) {
        addToast(
          'Surveillance Scan Completed',
          `Detected ${detected.length} quarterly spending variances exceeding the ${varianceThreshold}% threshold.`,
          'WARNING'
        );
      }

      // Record in governance compliance audit ledger
      recordAuditAction({
        action: 'REALTIME_BUDGET_ANOMALY_TRIGGERED',
        category: 'SECURITY',
        description: `Surveillance service detected ${topAnomaly.variancePct > 0 ? '+' : ''}${topAnomaly.variancePct}% quarterly variance in ${topAnomaly.departmentName} (${topAnomaly.quarter}), exceeding ${varianceThreshold}% threshold.`,
        recordType: 'AI_SURVEILLANCE_ALERT',
        newValue: `${topAnomaly.variancePct}% Variance`,
        status: 'VERIFIED',
      });
    } else if (isManual) {
      addToast(
        'Surveillance Clean',
        `All active quarterly expenditure streams remain within the ${varianceThreshold}% baseline tolerance.`,
        'SUCCESS'
      );
    }

    setTimeout(() => setIsScanning(false), 600);
  }, [
    isSurveillanceActive,
    varianceThreshold,
    departments,
    playAlertChime,
    pushDesktopNotification,
    addToast,
    recordAuditAction,
  ]);

  // Initial surveillance run
  useEffect(() => {
    const timer = setTimeout(() => {
      runSurveillanceScan(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [runSurveillanceScan]);

  // Periodic automatic surveillance sweep every 45s when surveillance active
  useEffect(() => {
    if (!isSurveillanceActive) return;
    const interval = setInterval(() => {
      runSurveillanceScan(false);
    }, 45000);
    return () => clearInterval(interval);
  }, [isSurveillanceActive, runSurveillanceScan]);

  const handleAcknowledge = (id: string) => {
    setActiveAlerts(prev => prev.map(a => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a)));
    if (floatingToast?.id === id) {
      setFloatingToast(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Real-time Surveillance Control Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs transition-colors ${
              isSurveillanceActive
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-zinc-800 text-zinc-500 border-zinc-700'
            }`}
          >
            {isSurveillanceActive ? (
              <BellRing className="w-5 h-5 animate-pulse text-rose-400" />
            ) : (
              <BellOff className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Real-Time Anomaly Surveillance Service
              </h3>
              {isSurveillanceActive && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Monitoring Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Pushes browser & in-app alerts when quarterly spending exceeds a{' '}
              <strong className="text-zinc-200">{varianceThreshold}% variance</strong> from D3 projected baseline.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Variance Threshold Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 text-[11px]">Threshold:</span>
            <select
              id="select-anomaly-variance-threshold"
              value={varianceThreshold}
              onChange={e => setVarianceThreshold(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value={10} className="bg-zinc-900">10% Variance</option>
              <option value={15} className="bg-zinc-900">15% Variance (Standard)</option>
              <option value={20} className="bg-zinc-900">20% Variance</option>
              <option value={25} className="bg-zinc-900">25% Variance</option>
            </select>
          </div>

          {/* Desktop Push Alert Toggle */}
          <button
            id="btn-request-browser-notification-permission"
            onClick={handleRequestPermission}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              desktopPermission === 'granted'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border-zinc-700'
            }`}
            title="Configure Browser Push Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>
              {desktopPermission === 'granted'
                ? 'Desktop Alerts: ON'
                : desktopPermission === 'denied'
                ? 'Desktop Alerts: Blocked'
                : 'Enable Browser Alerts'}
            </span>
          </button>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 transition-colors"
            title={soundEnabled ? 'Disable Audio Chime' : 'Enable Audio Chime'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>

          {/* Manual Rescan Button */}
          <button
            id="btn-trigger-surveillance-scan"
            onClick={() => runSurveillanceScan(true)}
            disabled={isScanning}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Scan Now</span>
          </button>
        </div>
      </div>

      {/* Floating Real-Time Browser Notification Banner */}
      {floatingToast && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-white shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs text-rose-200">
                  REAL-TIME ANOMALY DETECTED ({floatingToast.quarter})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {floatingToast.variancePct > 0 ? '+' : ''}
                  {floatingToast.variancePct}% Variance
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {floatingToast.detectedAt}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mt-1">
                {floatingToast.departmentName}
              </h4>

              <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">
                Actual quarterly expenditure (₹{floatingToast.actualAmountCr.toLocaleString()} Cr) deviates by{' '}
                <strong className="text-white">
                  {floatingToast.variancePct > 0 ? '+' : ''}
                  {floatingToast.variancePct}%
                </strong>{' '}
                from D3 historical baseline (₹{floatingToast.projectedAmountCr.toLocaleString()} Cr), exceeding the{' '}
                {floatingToast.thresholdPct}% compliance threshold.
              </p>

              <div className="flex items-center gap-3 mt-3">
                <span className="text-[10px] font-semibold text-rose-300 bg-rose-900/60 px-2.5 py-1 rounded-lg border border-rose-500/30">
                  {floatingToast.ruleViolated}
                </span>

                {onSelectAnomaly && (
                  <button
                    onClick={() => onSelectAnomaly(floatingToast.departmentName)}
                    className="text-xs text-white font-bold underline hover:text-rose-200 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Filter Department Anomalies</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleAcknowledge(floatingToast.id)}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              Acknowledge
            </button>
            <button
              onClick={() => setFloatingToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
