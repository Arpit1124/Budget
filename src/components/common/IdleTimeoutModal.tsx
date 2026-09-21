import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, Clock, AlertTriangle, RefreshCw, LogOut, CheckCircle2, Shield } from 'lucide-react';

interface IdleTimeoutModalProps {
  timeoutSeconds?: number;      // default: 900s (15 minutes)
  warningDuration?: number;     // default: 60s
  onSessionTerminated?: () => void;
}

export const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({
  timeoutSeconds = 900,   // 15 minutes standard government compliance
  warningDuration = 60,   // 60s visual countdown
  onSessionTerminated,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { addToast, recordAuditAction } = useApp();

  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningDuration);
  const [lastActivity, setLastActivity] = useState<number>(() => Date.now());

  const lastActivityRef = useRef<number>(Date.now());
  const isWarningVisibleRef = useRef<boolean>(false);
  isWarningVisibleRef.current = isWarningVisible;

  // Reset timer on genuine user interaction
  const resetTimer = useCallback(() => {
    // If warning modal is actively shown, user must explicitly click "Extend Session" to confirm presence
    if (isWarningVisibleRef.current) return;
    const now = Date.now();
    lastActivityRef.current = now;
    setLastActivity(now);
  }, []);

  // Single-click Session Extension
  const handleExtendSession = () => {
    const now = Date.now();
    lastActivityRef.current = now;
    setLastActivity(now);
    setIsWarningVisible(false);
    setSecondsRemaining(warningDuration);

    // Record audit event for compliance
    recordAuditAction({
      action: 'SESSION_EXTENDED',
      category: 'SECURITY',
      description: `User '${user?.name || 'Officer'}' confirmed presence and extended active session by 15 minutes.`,
      user: user?.name || 'Officer',
      userRole: user?.role || 'GOVERNMENT_ADMIN',
      status: 'VERIFIED',
    });

    addToast(
      'Session Extended',
      'Your administrative session has been extended for another 15 minutes.',
      'SUCCESS'
    );
  };

  // Immediate Logout
  const handleImmediateLogout = () => {
    recordAuditAction({
      action: 'USER_LOGOUT_MANUAL',
      category: 'SECURITY',
      description: `User '${user?.name || 'Officer'}' manually signed out during idle verification.`,
      user: user?.name || 'Officer',
      userRole: user?.role || 'GOVERNMENT_ADMIN',
      status: 'VERIFIED',
    });

    setIsWarningVisible(false);
    logout();
    onSessionTerminated?.();
  };

  // Manual trigger for testing/demonstration purposes
  const handleSimulateWarning = () => {
    setIsWarningVisible(true);
    setSecondsRemaining(warningDuration);
  };

  // Attach global activity listeners
  useEffect(() => {
    if (!isAuthenticated) {
      setIsWarningVisible(false);
      return;
    }

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];
    const handleActivity = () => resetTimer();

    activityEvents.forEach(evt => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleActivity);
      });
    };
  }, [isAuthenticated, resetTimer]);

  // Periodic Inactivity Checker & Countdown Clock
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastActivityRef.current) / 1000);
      const remainingTotal = timeoutSeconds - elapsedSeconds;

      if (remainingTotal <= 0) {
        // Termination triggered
        setIsWarningVisible(false);
        recordAuditAction({
          action: 'SESSION_TERMINATED_IDLE',
          category: 'SECURITY',
          description: `Administrative session terminated after 15 minutes of inactivity in compliance with NIC Government Cyber Security Guidelines.`,
          user: user?.name || 'Officer',
          userRole: user?.role || 'GOVERNMENT_ADMIN',
          status: 'VERIFIED',
        });

        addToast(
          'Session Terminated',
          'Logged out after 15 minutes of inactivity for government security compliance.',
          'WARNING'
        );

        logout();
        onSessionTerminated?.();
      } else if (remainingTotal <= warningDuration) {
        // Show warning modal and countdown
        setIsWarningVisible(true);
        setSecondsRemaining(remainingTotal);
      } else {
        setIsWarningVisible(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, timeoutSeconds, warningDuration, logout, onSessionTerminated, recordAuditAction, addToast, user]);

  if (!isAuthenticated || !isWarningVisible) {
    return null;
  }

  // Calculate percentage for circular progress ring
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / warningDuration) * 100));
  const strokeDashoffset = 100 - progressPercent;
  const isUrgent = secondsRemaining <= 15;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-amber-500/50 dark:border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100 transform transition-all p-6 sm:p-7 relative">
        {/* Compliance Header Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 block">
                Security Compliance Alert
              </span>
              <h3 id="idle-modal-title" className="text-base font-bold text-zinc-900 dark:text-white">
                Inactivity Warning
              </h3>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            CERT-IN / GFR
          </span>
        </div>

        {/* Visual Countdown Display */}
        <div className="my-6 flex flex-col items-center text-center">
          {/* Circular Countdown Ring */}
          <div className="relative w-32 h-32 flex items-center justify-center mb-3">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                className="text-zinc-100 dark:text-zinc-800"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="264"
                strokeDashoffset={264 * (1 - progressPercent / 100)}
                strokeLinecap="round"
                className={`transition-all duration-1000 ${
                  isUrgent
                    ? 'text-rose-500 animate-pulse'
                    : 'text-amber-500'
                }`}
              />
            </svg>

            {/* Inner Number */}
            <div className="absolute flex flex-col items-center justify-center">
              <span
                id="idle-countdown-seconds"
                className={`text-4xl font-extrabold font-mono tracking-tight ${
                  isUrgent ? 'text-rose-500' : 'text-amber-500 dark:text-amber-400'
                }`}
              >
                {secondsRemaining}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                seconds
              </span>
            </div>
          </div>

          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            You have been inactive for nearly 15 minutes.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            To prevent unauthorized access to financial records and sensitive treasury allocations, your session will be locked automatically.
          </p>
        </div>

        {/* Session Info Bar */}
        <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="text-left">
              <p className="font-semibold text-zinc-900 dark:text-white truncate max-w-[150px]">
                {user?.name || 'Officer'}
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {user?.designation || user?.role?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Timeout at 0s
          </span>
        </div>

        {/* Action Buttons: Single-click Extend & Logout */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            id="btn-extend-idle-session"
            onClick={handleExtendSession}
            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Extend Session (Stay Logged In)</span>
          </button>

          <button
            id="btn-terminate-idle-session"
            onClick={handleImmediateLogout}
            className="py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-zinc-400" />
            <span>Sign Out Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
