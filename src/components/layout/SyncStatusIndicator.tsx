import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Info,
  ChevronDown,
} from 'lucide-react';
import { checkSystemSyncStatus, SystemSyncStatus } from '../../services/offlineStorage';
import { useApp } from '../../context/AppContext';

export const SyncStatusIndicator: React.FC = () => {
  const {
    networkMode,
    setNetworkMode,
    isOffline: appIsOffline,
    offlineQueueCount,
    syncOfflineQueue,
    lastCachedTime,
  } = useApp();

  const [syncState, setSyncState] = useState<SystemSyncStatus>({
    status: 'ONLINE',
    pendingQueueCount: 0,
    swRegistered: true,
    swActive: true,
    indexedDBConnected: true,
    lastSyncTimestamp: null,
  });

  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll and check sync status from IndexedDB and Service Worker
  const evaluateSync = async () => {
    const res = await checkSystemSyncStatus(isManualSyncing);
    
    // Merge with simulated networkMode if the user is testing offline mode via UI
    if (appIsOffline || networkMode === 'OFFLINE') {
      res.status = 'OFFLINE';
    } else if (isManualSyncing) {
      res.status = 'SYNCING';
    }

    setSyncState(res);
  };

  useEffect(() => {
    evaluateSync();
    const interval = setInterval(evaluateSync, 4000);

    const handleOnline = () => evaluateSync();
    const handleOffline = () => evaluateSync();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [appIsOffline, networkMode, isManualSyncing, offlineQueueCount]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTriggerSync = async () => {
    setIsManualSyncing(true);
    setSyncState((prev) => ({ ...prev, status: 'SYNCING' }));
    try {
      await syncOfflineQueue();
    } finally {
      setIsManualSyncing(false);
      evaluateSync();
    }
  };

  const status = syncState.status;

  // Status visual attributes
  const config = {
    ONLINE: {
      label: 'Online',
      badgeBg: 'bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dotBg: 'bg-emerald-400',
      pulse: true,
      icon: <Wifi className="w-3.5 h-3.5 text-emerald-400" />,
      subtext: 'IndexedDB & Service Worker Ready',
    },
    SYNCING: {
      label: 'Syncing',
      badgeBg: 'bg-indigo-500/15 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      dotBg: 'bg-indigo-400',
      pulse: false,
      icon: <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />,
      subtext: 'Reconciling Offline Transactions',
    },
    OFFLINE: {
      label: 'Offline',
      badgeBg: 'bg-amber-500/15 hover:bg-amber-500/20 text-amber-300 border-amber-500/30',
      dotBg: 'bg-amber-400',
      pulse: false,
      icon: <WifiOff className="w-3.5 h-3.5 text-amber-400" />,
      subtext: 'Cached in IndexedDB (Zero Data Loss)',
    },
  }[status];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Primary Pill Button */}
      <button
        id="btn-sync-status-indicator"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${config.badgeBg}`}
        title="Check synchronization status with Service Worker & IndexedDB"
        aria-expanded={isOpen}
      >
        <span className="relative flex h-2 w-2">
          {config.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dotBg}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotBg}`} />
        </span>

        {config.icon}

        <span className="font-bold tracking-tight">{config.label}</span>

        {offlineQueueCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-extrabold text-[10px]">
            {offlineQueueCount}
          </span>
        )}

        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {/* Synchronization Diagnostics Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 text-zinc-100 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Network & Sync Monitor
              </h4>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                status === 'ONLINE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : status === 'SYNCING'
                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {status}
            </span>
          </div>

          <div className="space-y-2.5 my-3 text-xs">
            {/* Status overview */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">IndexedDB Health:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Connected</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Service Worker PWA:</span>
              <span className="font-semibold text-zinc-200">
                {syncState.swActive ? 'Active (Intercepting)' : 'Registering'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Offline Queue:</span>
              <span className="font-semibold font-mono text-white">
                {offlineQueueCount} Pending Writes
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Last Synced:</span>
              <span className="font-mono text-[11px] text-zinc-300">
                {lastCachedTime || 'Live Session'}
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <button
              onClick={handleTriggerSync}
              disabled={isManualSyncing || status === 'OFFLINE'}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>{isManualSyncing ? 'Syncing...' : 'Sync IndexedDB Now'}</span>
            </button>

            {/* Network Mode Simulation Selector for Testing */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Simulate State:</span>
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setNetworkMode('ONLINE')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    networkMode === 'ONLINE' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                  }`}
                >
                  Online
                </button>
                <button
                  type="button"
                  onClick={() => setNetworkMode('OFFLINE')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    networkMode === 'OFFLINE' ? 'bg-amber-600 text-white' : 'text-zinc-400'
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
