import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import {
  User,
  ShieldCheck,
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  Sliders,
  Send,
  AlertOctagon,
  Clock,
  ShieldAlert,
  Building,
  RotateCcw,
  Save,
  Check,
  Zap,
} from 'lucide-react';

export interface AlertCategorySetting {
  id: string;
  name: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

const DEFAULT_SETTINGS: AlertCategorySetting[] = [
  {
    id: 'CRITICAL_ANOMALIES',
    name: 'Critical Anomalies & GFR Breaches',
    description: 'Tender splitting below ₹5L threshold, phantom vendor accounts, and Rule 62(3) March rush surges.',
    severity: 'CRITICAL',
    inApp: true,
    email: true,
    sms: true,
  },
  {
    id: 'THRESHOLD_BREACHES',
    name: 'Budget Thresholds & Rapid Depletion',
    description: 'Departmental utilization exceeding 85% prior to Q3 or single-day abnormal fund drawdowns.',
    severity: 'HIGH',
    inApp: true,
    email: true,
    sms: false,
  },
  {
    id: 'FUND_RELEASES',
    name: 'Treasury Fund Releases & Sanctions',
    description: 'Central Single Nodal Agency (SNA) tranches, state share disbursements, and PFMS release orders.',
    severity: 'MEDIUM',
    inApp: true,
    email: true,
    sms: false,
  },
  {
    id: 'UNDER_UTILIZATION',
    name: 'Under-Utilization & Scheme Lags',
    description: 'Capital projects lagging behind physical schedule with absorption below 50% threshold.',
    severity: 'HIGH',
    inApp: true,
    email: true,
    sms: false,
  },
  {
    id: 'BUDGET_ADJUSTMENTS',
    name: 'Budget Adjustments & Approval Workflows',
    description: 'Multi-level virement requests, re-appropriations, and pending secretary concurrences.',
    severity: 'HIGH',
    inApp: true,
    email: true,
    sms: true,
  },
  {
    id: 'AUDIT_FLAGS',
    name: 'CAG Audit Queries & Compliance Flags',
    description: 'Statutory audit observations, missing utilization certificates, and unverified voucher discrepancies.',
    severity: 'CRITICAL',
    inApp: true,
    email: true,
    sms: false,
  },
];

export const UserProfilePage: React.FC = () => {
  const { user, switchRole, rolesList } = useAuth();
  const { addAlert } = useApp();

  const [settings, setSettings] = useState<AlertCategorySetting[]>(() => {
    try {
      const saved = localStorage.getItem('budget_ai_notification_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [deliverySchedule, setDeliverySchedule] = useState<'INSTANT' | 'HOURLY' | 'DAILY'>('INSTANT');
  const [isSaved, setIsSaved] = useState(false);
  const [testAlertSent, setTestAlertSent] = useState(false);

  // Workflow summary digest subscription state
  const [digestSubscribed, setDigestSubscribed] = useState<boolean>(() => {
    return localStorage.getItem('budget_digest_subscribed') !== 'false';
  });
  const [digestCadence, setDigestCadence] = useState<'DAILY' | 'WEEKLY'>(() => {
    return (localStorage.getItem('budget_digest_cadence') as 'DAILY' | 'WEEKLY') || 'DAILY';
  });
  const [digestPendingTasksOnly, setDigestPendingTasksOnly] = useState<boolean>(() => {
    return localStorage.getItem('budget_digest_pending_only') === 'true';
  });
  const [digestShowPreview, setDigestShowPreview] = useState(false);

  const handleToggleDigestSubscription = () => {
    const nextVal = !digestSubscribed;
    setDigestSubscribed(nextVal);
    localStorage.setItem('budget_digest_subscribed', String(nextVal));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleCadenceChange = (cadence: 'DAILY' | 'WEEKLY') => {
    setDigestCadence(cadence);
    localStorage.setItem('budget_digest_cadence', cadence);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handlePendingOnlyChange = () => {
    const nextVal = !digestPendingTasksOnly;
    setDigestPendingTasksOnly(nextVal);
    localStorage.setItem('budget_digest_pending_only', String(nextVal));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  useEffect(() => {
    try {
      localStorage.setItem('budget_ai_notification_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save notification settings', e);
    }
  }, [settings]);

  const toggleChannel = (categoryId: string, channel: 'inApp' | 'email' | 'sms') => {
    setSettings(prev =>
      prev.map(cat => (cat.id === categoryId ? { ...cat, [channel]: !cat[channel] } : cat))
    );
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const applyPreset = (preset: 'MAX' | 'STANDARD' | 'MINIMAL') => {
    if (preset === 'MAX') {
      setSettings(prev => prev.map(c => ({ ...c, inApp: true, email: true, sms: true })));
    } else if (preset === 'STANDARD') {
      setSettings(DEFAULT_SETTINGS);
    } else if (preset === 'MINIMAL') {
      setSettings(prev =>
        prev.map(c => ({
          ...c,
          inApp: true,
          email: c.severity === 'CRITICAL',
          sms: false,
        }))
      );
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSendTestDispatch = () => {
    setTestAlertSent(true);
    addAlert({
      title: 'Official Test Alert Dispatched',
      description: `Dispatched test notification via configured channels (${settings.filter(s => s.inApp).length} in-app, ${settings.filter(s => s.email).length} email, ${settings.filter(s => s.sms).length} SMS categories). Delivery channel handshake verified.`,
      severity: 'LOW',
      departmentName: 'Ministry of Finance - Budget Division',
      isRead: false,
    });
    setTimeout(() => setTestAlertSent(false), 4500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Official Profile & Alert Channel Preferences
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Government Identity & Dispatch
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure multi-channel alert delivery thresholds (In-App, NIC Official Email, SMS Gateway) for critical public finance events.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold animate-pulse">
            <Check className="w-3.5 h-3.5" />
            <span>Preferences Auto-Saved</span>
          </div>
        )}
      </div>

      {/* Official Credentials Dossier */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/25 border border-indigo-400/40">
              {user?.name ? user.name[0] : 'O'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">{user?.name}</h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {user?.role?.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Security Clearance: CONFIDENTIAL
                </span>
              </div>
              <p className="text-xs text-zinc-300">{user?.designation}</p>
              <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap pt-0.5">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-zinc-500" />
                  Department of Economic Affairs, Ministry of Finance
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                  +91 98765-XXXXX (NIC Verified)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Evaluator Role Switcher */}
          <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-1.5 min-w-[240px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">
              Simulate Government Role:
            </span>
            <div className="grid grid-cols-1 gap-1">
              {rolesList.slice(0, 3).map(r => (
                <button
                  key={r.role}
                  onClick={() => switchRole(r.role)}
                  className={`text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    user?.role === r.role
                      ? 'bg-indigo-600/25 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{r.label}</span>
                  {user?.role === r.role && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Notification Settings Panel */}
      <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-6">
        {/* Panel Header & Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h2 className="font-bold text-base text-white tracking-tight">
                Budget Alert Notification Matrix
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Toggle specific communication channels independently for each category of public financial event.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-zinc-500 font-medium">Quick Presets:</span>
            <button
              onClick={() => applyPreset('MAX')}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-colors"
            >
              All Urgent Channels
            </button>
            <button
              onClick={() => applyPreset('STANDARD')}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-colors"
            >
              Gov Standard
            </button>
            <button
              onClick={() => applyPreset('MINIMAL')}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-colors"
            >
              Minimalist
            </button>
          </div>
        </div>

        {/* Channel Overview Headers */}
        <div className="grid grid-cols-12 gap-3 px-4 text-xs font-bold uppercase tracking-wider text-zinc-500 hidden md:grid">
          <div className="col-span-6">Alert Category & Scope</div>
          <div className="col-span-2 text-center flex items-center justify-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-indigo-400" /> In-App Alert
          </div>
          <div className="col-span-2 text-center flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-blue-400" /> NIC Email
          </div>
          <div className="col-span-2 text-center flex items-center justify-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Urgent SMS
          </div>
        </div>

        {/* Matrix Rows */}
        <div className="space-y-3">
          {settings.map(cat => {
            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              >
                {/* Category Info */}
                <div className="md:col-span-6 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-white">{cat.name}</h3>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        cat.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : cat.severity === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {cat.severity}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{cat.description}</p>
                </div>

                {/* In-App Toggle */}
                <div className="md:col-span-2 flex md:justify-center items-center justify-between">
                  <span className="text-xs text-zinc-400 md:hidden flex items-center gap-1">
                    <Bell className="w-3 h-3 text-indigo-400" /> In-App:
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleChannel(cat.id, 'inApp')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      cat.inApp ? 'bg-indigo-600' : 'bg-zinc-800'
                    }`}
                    aria-label={`Toggle In-App for ${cat.name}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        cat.inApp ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Email Toggle */}
                <div className="md:col-span-2 flex md:justify-center items-center justify-between">
                  <span className="text-xs text-zinc-400 md:hidden flex items-center gap-1">
                    <Mail className="w-3 h-3 text-blue-400" /> Email:
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleChannel(cat.id, 'email')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      cat.email ? 'bg-blue-600' : 'bg-zinc-800'
                    }`}
                    aria-label={`Toggle Email for ${cat.name}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        cat.email ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* SMS Toggle */}
                <div className="md:col-span-2 flex md:justify-center items-center justify-between">
                  <span className="text-xs text-zinc-400 md:hidden flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-emerald-400" /> SMS:
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleChannel(cat.id, 'sms')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      cat.sms ? 'bg-emerald-600' : 'bg-zinc-800'
                    }`}
                    aria-label={`Toggle SMS for ${cat.name}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        cat.sms ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery Frequency & Dispatch Settings */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300">
                Notification Delivery Schedule
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Controls cadence of email and push summaries. SMS alerts for CRITICAL anomalies are always sent immediately.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setDeliverySchedule('INSTANT')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  deliverySchedule === 'INSTANT'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Instant Real-time
              </button>
              <button
                onClick={() => setDeliverySchedule('HOURLY')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  deliverySchedule === 'HOURLY'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hourly Roll-up
              </button>
              <button
                onClick={() => setDeliverySchedule('DAILY')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  deliverySchedule === 'DAILY'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Daily 09:00 AM Digest
              </button>
            </div>
          </div>
        </div>

        {/* Workflow Changes & Pending Approvals Digest Subscription */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-950 to-indigo-950/40 border border-indigo-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">
                    Budget Workflow & Pending Approval Tasks Digest
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {digestSubscribed ? 'Subscribed' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                  Receive a consolidated executive digest of all budget adjustments, virements under review, and pending approval tasks requiring your concurrence.
                </p>
              </div>
            </div>

            <button
              id="btn-toggle-digest-subscription"
              onClick={handleToggleDigestSubscription}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                digestSubscribed
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
              }`}
            >
              {digestSubscribed ? 'Subscribed (Click to Unsubscribe)' : 'Subscribe to Digest'}
            </button>
          </div>

          {digestSubscribed && (
            <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Cadence selection */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Digest Frequency Cadence
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-cadence-daily"
                    onClick={() => handleCadenceChange('DAILY')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-semibold border transition-all text-center ${
                      digestCadence === 'DAILY'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Daily (08:30 AM IST)
                  </button>
                  <button
                    id="btn-cadence-weekly"
                    onClick={() => handleCadenceChange('WEEKLY')}
                    className={`flex-1 py-1.5 px-3 rounded-lg font-semibold border transition-all text-center ${
                      digestCadence === 'WEEKLY'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Weekly (Monday Briefing)
                  </button>
                </div>
              </div>

              {/* Scope filter */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Content Scope
                </span>
                <label className="flex items-center gap-2 bg-zinc-900 p-2 rounded-lg border border-zinc-800 cursor-pointer text-zinc-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={digestPendingTasksOnly}
                    onChange={handlePendingOnlyChange}
                    className="accent-indigo-600 rounded"
                  />
                  <span>Only include pending tasks awaiting my approval</span>
                </label>
              </div>

              {/* Sample preview trigger */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <button
                  id="btn-preview-digest"
                  onClick={() => setDigestShowPreview(!digestShowPreview)}
                  className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold border border-zinc-700 transition-colors text-center"
                >
                  {digestShowPreview ? 'Hide Sample Digest Preview' : 'Preview Sample Digest Briefing'}
                </button>
              </div>
            </div>
          )}

          {digestSubscribed && digestShowPreview && (
            <div className="p-4 rounded-xl bg-zinc-900 border border-indigo-500/30 space-y-2 text-xs text-zinc-300 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Subject: [NIC Gov] Budget Workflow & Approvals {digestCadence === 'DAILY' ? 'Daily' : 'Weekly'} Digest (02 Mar 2026)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Recipient: {user?.email}</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Dear <strong>{user?.name}</strong>, here is your summary briefing of budget adjustment workflows:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                <li><strong className="text-amber-400">2 Pending Tasks:</strong> NH-44 Express Viaduct Capex Acceleration (₹120.0 Cr, Level 2 Review) and Inter-Scheme Pipeline Transfer (₹68.0 Cr).</li>
                <li><strong className="text-emerald-400">1 Sanction Approved:</strong> Regional AIIMS Hemodialysis Units re-appropriation (₹45.5 Cr).</li>
                <li><strong className="text-zinc-400">Next Action Deadline:</strong> GFR compliance sign-off required within 48 hours to prevent lapse.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions: Test Notification & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-zinc-800">
          <div className="text-xs text-zinc-400">
            Active channels: <strong className="text-white">{settings.reduce((a, c) => a + (c.inApp ? 1 : 0), 0)} In-App</strong>,{' '}
            <strong className="text-white">{settings.reduce((a, c) => a + (c.email ? 1 : 0), 0)} Email</strong>,{' '}
            <strong className="text-white">{settings.reduce((a, c) => a + (c.sms ? 1 : 0), 0)} SMS</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-send-test-alert"
              onClick={handleSendTestDispatch}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors border border-zinc-700"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>Send Test Notification Dispatch</span>
            </button>
          </div>
        </div>

        {testAlertSent && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Handshake Verified:</strong> Test notification simulated across active In-App, NIC Mail, and Gov SMS channels. View in Alert Center.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
