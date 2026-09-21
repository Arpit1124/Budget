import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation, SupportedLanguage } from '../../context/I18nContext';
import {
  Building2,
  BarChart3,
  Sparkles,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  CheckCircle,
  Sliders,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
} from 'lucide-react';
import { UserRole } from '../../types';
import { BudgetAILogo } from '../common/BudgetAILogo';
import { SyncStatusIndicator } from './SyncStatusIndicator';
import { downloadCurrentViewReport } from '../../utils/printUtility';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onNavigate?: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen, onNavigate }) => {
  const { user, logout, switchRole } = useAuth();
  const {
    financialYear,
    setFinancialYear,
    selectedDepartment,
    setSelectedDepartment,
    departments,
    alerts,
    setIsAskAIOpen,
    searchQuery,
    setSearchQuery,
    networkMode,
    setNetworkMode,
    isOffline,
    offlineQueueCount,
    syncOfflineQueue,
    lastCachedTime,
    addToast,
  } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { currentLanguage, setLanguage, languages, t } = useTranslation();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const unreadAlerts = alerts.filter(a => !a.isRead);

  const rolesList: { role: UserRole; label: string }[] = [
    { role: 'MINISTER', label: '1. Hon. Cabinet Minister' },
    { role: 'SUPER_ADMIN', label: '2. Super Admin' },
    { role: 'GOVERNMENT_ADMIN', label: '3. Government Admin' },
    { role: 'FINANCE_OFFICER', label: '4. Finance Officer (JS&FA)' },
    { role: 'DEPARTMENT_CLERK', label: '5. Department Accounts Clerk' },
    { role: 'AUDITOR', label: '6. Auditor (CAG)' },
    { role: 'DEPARTMENT_OFFICER', label: '7. Department Officer' },
    { role: 'PROJECT_MANAGER', label: '8. Project Manager' },
    { role: 'VIEW_ONLY_OFFICER', label: '9. View-Only Officer' },
  ];

  const handleSyncQueue = async () => {
    setIsSyncing(true);
    try {
      await syncOfflineQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadReport = () => {
    addToast(
      'Preparing Formatted PDF',
      'Generating print-ready PDF using official government stylesheet. Select "Save as PDF" to download.',
      'INFO'
    );
    downloadCurrentViewReport({
      viewName: window.location.pathname.replace('/', '') || 'Executive_Dashboard',
      financialYear,
      departmentScope: selectedDepartment,
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-950/95 text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-md shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                id="btn-toggle-sidebar"
                onClick={onToggleSidebar}
                className="lg:hidden p-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                aria-label="Toggle navigation"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div className="flex items-center gap-3">
              <BudgetAILogo
                size="md"
                onClick={() => onNavigate?.('/dashboard')}
                className="cursor-pointer"
              />
              <span className="hidden xl:inline-flex text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-cyan-500/15 text-[#00C9C8] rounded-full border border-cyan-500/25">
                NIC Portal
              </span>
            </div>
          </div>

          {/* Quick Filters (FY & Department) */}
          <div className="hidden md:flex items-center gap-2 text-xs">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-1.5">
              <span className="text-zinc-500 dark:text-zinc-400 mr-1.5 font-medium text-[11px] uppercase tracking-wider">FY:</span>
              <select
                id="header-fy-selector"
                value={financialYear}
                onChange={e => setFinancialYear(e.target.value)}
                className="bg-transparent text-zinc-800 dark:text-white focus:outline-none cursor-pointer font-medium text-xs"
              >
                <option value="2026–27" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">2026–27 (Active)</option>
                <option value="2025–26" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">2025–26</option>
                <option value="2024–25" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">2024–25</option>
                <option value="2023–24" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">2023–24</option>
              </select>
            </div>

            <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 max-w-[220px] xl:max-w-xs">
              <span className="text-zinc-500 dark:text-zinc-400 mr-1.5 font-medium text-[11px] uppercase tracking-wider whitespace-nowrap">Dept:</span>
              <select
                id="header-dept-selector"
                value={selectedDepartment}
                onChange={e => setSelectedDepartment(e.target.value)}
                className="bg-transparent text-zinc-800 dark:text-white truncate focus:outline-none cursor-pointer font-medium text-xs"
              >
                <option value="ALL" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">All 48 Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Center: Search, Ask AI, Notifications, Theme, User */}
          <div className="flex items-center gap-2">
            {/* Global Search Button */}
            <button
              id="btn-global-search"
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs border border-zinc-200 dark:border-zinc-800 transition-colors"
              title="Search budgets, projects, schemes, transactions (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
                Ctrl+K
              </kbd>
            </button>

            {/* Language Selector (i18n) */}
            <div className="relative">
              <button
                id="btn-language-selector"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs transition-colors"
                title="Select Administrative Interface Language"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span className="font-semibold">{languages.find(l => l.code === currentLanguage)?.nativeLabel || 'EN'}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 text-zinc-900 dark:text-zinc-100">
                  <div className="px-3 py-1.5 border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-bold tracking-wider text-zinc-500 dark:text-zinc-400">
                    Official Languages (Rajbhasha)
                  </div>
                  <div className="py-1">
                    {languages.map(l => (
                      <button
                        key={l.code}
                        id={`lang-btn-${l.code}`}
                        onClick={() => {
                          setLanguage(l.code);
                          setIsLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                          currentLanguage === l.code
                            ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/10'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span>{l.nativeLabel} ({l.label})</span>
                        {currentLanguage === l.code && <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Synchronization Status Visual Indicator (Service Worker & IndexedDB) */}
            <SyncStatusIndicator />

            {/* Download Report Button (Print-friendly PDF utility using existing print CSS) */}
            <button
              id="btn-header-download-report"
              onClick={handleDownloadReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-medium border border-zinc-200 dark:border-zinc-800 transition-colors shadow-xs cursor-pointer"
              title="Download or Print formatted PDF of current view (Uses official GFR print layout)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline font-semibold">Download Report</span>
              <span className="md:hidden">Report</span>
            </button>

            {/* Ask BudgetAI Trigger */}
            <button
              id="btn-open-ask-ai"
              onClick={() => setIsAskAIOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden sm:inline">{t('askBudgetAI', 'Ask BudgetAI')}</span>
            </button>

            {/* Alert Bell */}
            <div className="relative">
              <button
                id="btn-toggle-alerts"
                onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 relative transition-colors"
                aria-label="View alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadAlerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadAlerts.length}
                  </span>
                )}
              </button>

              {/* Alert Dropdown */}
              {isAlertsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-3 z-50 text-zinc-900 dark:text-zinc-100">
                  <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">System Alerts ({unreadAlerts.length})</span>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Real-time Feed</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                    {alerts.slice(0, 5).map(a => (
                      <div key={a.id} className="p-3 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                              a.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                                : a.severity === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                                : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {a.severity}
                          </span>
                          <span className="text-[10px] text-zinc-400">{a.timestamp}</span>
                        </div>
                        <p className="font-medium text-zinc-900 dark:text-white leading-tight">{a.title}</p>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">{a.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 text-center">
                    <a
                      href="#/alerts"
                      onClick={() => setIsAlertsOpen(false)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      View All Alerts ({alerts.length}) →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* User-Accessible Theme Toggle (Switches between Light and Dark modes) */}
            <button
              id="header-theme-toggle"
              onClick={toggleTheme}
              className="px-2.5 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? 'Current: Dark Mode (Click for Light Mode)' : 'Current: Light Mode (Click for Dark Mode)'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
                  <span className="hidden sm:inline text-xs font-semibold text-zinc-200">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
                  <span className="hidden sm:inline text-xs font-semibold text-zinc-800">Dark</span>
                </>
              )}
            </button>

            {/* User Profile & Role Switcher */}
            <div className="relative">
              <button
                id="btn-user-profile-menu"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors text-xs text-zinc-800 dark:text-zinc-200"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/40">
                  {user?.name ? user.name[0] : 'U'}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="font-medium text-zinc-900 dark:text-white truncate max-w-[120px]">{user?.name}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{user?.role?.replace(/_/g, ' ')}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-3 z-50 text-zinc-900 dark:text-zinc-100">
                  <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
                    <p className="font-bold text-sm text-zinc-900 dark:text-white">{user?.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                      {user?.designation}
                    </p>

                    <button
                      id="btn-goto-profile-settings"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onNavigate) {
                          onNavigate('/profile');
                        } else {
                          window.location.hash = '/profile';
                        }
                      }}
                      className="mt-2.5 w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-semibold transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Profile & Alert Channels</span>
                      </span>
                      <span>→</span>
                    </button>
                  </div>

                  {/* 1-Click Role Switcher for Evaluation */}
                  <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                        Switch Evaluator Role:
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                      {rolesList.map(r => (
                        <button
                          key={r.role}
                          onClick={() => {
                            switchRole(r.role);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            user?.role === r.role
                              ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <span>{r.label}</span>
                          {user?.role === r.role && <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-2 pt-1.5">
                    <button
                      id="btn-logout"
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden p-2">
            <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-zinc-400" />
              <input
                id="input-global-search-query"
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Department, Project, Scheme, or Voucher ID..."
                className="w-full bg-transparent text-sm focus:outline-none text-white placeholder:text-zinc-500"
              />
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-3 text-xs divide-y divide-zinc-800">
              <div className="pb-2">
                <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
                  Departments
                </span>
                {departments
                  .filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 4)
                  .map(d => (
                    <div
                      key={d.id}
                      onClick={() => {
                        setSelectedDepartment(d.id);
                        setIsSearchModalOpen(false);
                      }}
                      className="py-2 px-2.5 hover:bg-zinc-800/80 rounded-xl cursor-pointer flex justify-between items-center text-zinc-200"
                    >
                      <span className="font-medium">{d.name}</span>
                      <span className="text-zinc-400">₹{d.allocatedBudget} Cr</span>
                    </div>
                  ))}
              </div>

              <div className="pt-2">
                <span className="font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
                  Active Schemes & Major Projects
                </span>
                <div
                  onClick={() => setIsSearchModalOpen(false)}
                  className="py-2 px-2.5 hover:bg-zinc-800/80 rounded-xl cursor-pointer flex justify-between items-center text-zinc-200"
                >
                  <span>NH-44 Corridor 6-Laning & Bypass Package III</span>
                  <span className="text-amber-400 font-medium">Critical Mismatch</span>
                </div>
                <div
                  onClick={() => setIsSearchModalOpen(false)}
                  className="py-2 px-2.5 hover:bg-zinc-800/80 rounded-xl cursor-pointer flex justify-between items-center text-zinc-200"
                >
                  <span>Samagra Shiksha Integrated School Scheme</span>
                  <span className="text-emerald-400 font-medium">81.9% Utilized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
