import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  Wallet,
  Receipt,
  ArrowUpRight,
  Boxes,
  FolderGit2,
  AlertOctagon,
  TrendingUp,
  ShieldAlert,
  BellRing,
  FileSpreadsheet,
  FileClock,
  UploadCloud,
  CheckCircle2,
  SlidersHorizontal,
  Home,
  UserCog,
  X,
} from 'lucide-react';
import { BudgetAILogo } from '../common/BudgetAILogo';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navSections = [
    {
      title: 'Overview',
      items: [
        { id: 'landing', label: 'Public Portal', icon: Home, route: '/' },
        { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard, route: '/dashboard' },
      ],
    },
    {
      title: 'Financial Monitoring',
      items: [
        { id: 'utilization', label: 'Budget Utilization', icon: PieChart, route: '/budget-utilization' },
        { id: 'budgets', label: 'Budgets & Allocations', icon: Wallet, route: '/budgets' },
        { id: 'expenditure', label: 'Expenditure Register', icon: Receipt, route: '/expenditure' },
        { id: 'releases', label: 'Fund Releases', icon: ArrowUpRight, route: '/fund-releases' },
      ],
    },
    {
      title: 'Programs & Projects',
      items: [
        { id: 'schemes', label: 'Government Schemes', icon: Boxes, route: '/schemes' },
        { id: 'projects', label: 'Project Monitoring', icon: FolderGit2, route: '/projects' },
      ],
    },
    {
      title: 'AI Intelligence',
      items: [
        { id: 'anomalies', label: 'AI Anomalies', icon: AlertOctagon, route: '/ai-anomalies', badge: 'Active' },
        { id: 'forecast', label: 'Spending Forecast', icon: TrendingUp, route: '/forecast' },
        { id: 'risks', label: 'Risk Analysis', icon: ShieldAlert, route: '/risks' },
      ],
    },
    {
      title: 'Governance & Audit',
      items: [
        { id: 'alerts', label: 'Alert Center', icon: BellRing, route: '/alerts' },
        { id: 'reports', label: 'Report Generator', icon: FileSpreadsheet, route: '/reports' },
        { id: 'audit', label: 'Audit Trail', icon: FileClock, route: '/audit' },
        { id: 'import', label: 'Data Ingestion', icon: UploadCloud, route: '/data-import' },
        { id: 'quality', label: 'Data Quality Center', icon: CheckCircle2, route: '/data-quality', badge: '94%' },
      ],
    },
    {
      title: 'Administration',
      items: [
        { id: 'admin', label: 'Admin Console', icon: SlidersHorizontal, route: '/admin' },
        { id: 'profile', label: 'Profile & Notifications', icon: UserCog, route: '/profile' },
      ],
    },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between py-5">
      <div className="space-y-6 px-3">
        {navSections.map(sec => (
          <div key={sec.title}>
            <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
              {sec.title}
            </p>
            <div className="space-y-1">
              {sec.items.map(item => {
                const isActive = currentRoute === item.route;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.route);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 font-semibold'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-tight ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badge === 'Active'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-semibold text-zinc-300">GFR 2017 & PFMS</span>
        </div>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Bento Grid Engine v3.1</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 bg-zinc-950/80 backdrop-blur-md border-r border-zinc-800/80 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 bg-zinc-950 border-r border-zinc-800 shadow-2xl z-10 overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
              <BudgetAILogo
                size="sm"
                onClick={() => {
                  onNavigate('/dashboard');
                  if (onCloseMobile) onCloseMobile();
                }}
              />
              <button
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
