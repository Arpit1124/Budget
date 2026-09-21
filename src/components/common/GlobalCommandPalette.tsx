import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  LayoutDashboard,
  Wallet,
  TrendingUp,
  FileSpreadsheet,
  AlertTriangle,
  Building,
  Layers,
  Sparkles,
  Command,
  ArrowRight,
  X,
  Keyboard,
  FileText,
  UploadCloud,
  ShieldCheck,
} from 'lucide-react';
import { BudgetAIMark } from './BudgetAILogo';

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { departments, schemes, budgets, setIsAskAIOpen } = useApp();
  const [query, setQuery] = useState('');

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus search input when open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => {
        const input = document.getElementById('palette-search-input');
        if (input) input.focus();
      }, 50);
    }
  }, [isOpen]);

  const navigationItems = [
    { title: 'Dashboard', route: '/dashboard', shortcut: 'Ctrl+D', icon: LayoutDashboard },
    { title: 'Budgets & Outlays', route: '/budgets', shortcut: 'Ctrl+B', icon: Wallet },
    { title: 'Expenditure Ledger', route: '/expenditure', shortcut: 'Ctrl+E', icon: TrendingUp },
    { title: 'AI Anomaly Detection', route: '/ai-anomalies', shortcut: 'Ctrl+J', icon: Sparkles },
    { title: 'Executive Reports & Dossiers', route: '/reports', shortcut: 'Ctrl+R', icon: FileText },
    { title: 'Data Ingestion & Imports', route: '/data-import', shortcut: 'Ctrl+I', icon: UploadCloud },
    { title: 'Audit & CAG Register', route: '/audit', shortcut: 'Ctrl+Shift+A', icon: ShieldCheck },
  ];

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const depts = departments
      .filter(d => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q))
      .slice(0, 3)
      .map(d => ({
        type: 'Department',
        title: d.name,
        subtitle: `Code: ${d.code} • Outlay: ₹${d.allocatedBudget.toLocaleString('en-IN')} Cr`,
        action: () => {
          onNavigate('/budgets');
          onClose();
        },
      }));

    const schs = schemes
      .filter(s => s.name.toLowerCase().includes(q) || s.departmentName.toLowerCase().includes(q))
      .slice(0, 3)
      .map(s => ({
        type: 'Scheme',
        title: s.name,
        subtitle: `${s.departmentName} • ₹${s.allocatedBudget.toLocaleString('en-IN')} Cr`,
        action: () => {
          onNavigate('/schemes');
          onClose();
        },
      }));

    const navs = navigationItems
      .filter(n => n.title.toLowerCase().includes(q))
      .map(n => ({
        type: 'Module',
        title: n.title,
        subtitle: `Jump to ${n.title} view`,
        action: () => {
          onNavigate(n.route);
          onClose();
        },
      }));

    return [...navs, ...depts, ...schs];
  }, [query, departments, schemes]);

  if (!isOpen) return null;

  return (
    <div
      id="global-command-palette-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="global-command-palette-dialog"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Search Input */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-950/60">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            id="palette-search-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search schemes, departments, or jump to view (e.g. 'highways', 'health', 'reports')..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
          />
          {query ? (
            <button onClick={() => setQuery('')} className="text-zinc-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono border border-zinc-700">
              ESC
            </kbd>
          )}
        </div>

        {/* Results / Navigation shortcuts */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {query.trim() ? (
            filteredItems.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-xs">
                No matching government schemes or modules found for "{query}".
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3 py-1">
                  Matching Results
                </div>
                {filteredItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-800/80 text-white flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {item.type}
                        </span>
                        <span className="text-xs font-semibold text-zinc-100 group-hover:text-indigo-300">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 pl-0.5">{item.subtitle}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            )
          ) : (
            <>
              {/* Quick Module Navigation */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3 py-1 mb-1">
                  Quick Navigation (Global Hotkeys)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {navigationItems.map(nav => {
                    const Icon = nav.icon;
                    return (
                      <button
                        key={nav.route}
                        onClick={() => {
                          onNavigate(nav.route);
                          onClose();
                        }}
                        className="text-left px-3 py-2 rounded-xl hover:bg-zinc-800/80 text-zinc-200 flex items-center justify-between group transition-colors border border-transparent hover:border-zinc-700"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-medium">{nav.title}</span>
                        </div>
                        <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 font-mono border border-zinc-700">
                          {nav.shortcut}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Action: Ask Budget AI */}
              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={() => {
                    onClose();
                    setIsAskAIOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 hover:from-indigo-900/60 hover:to-purple-900/60 text-white flex items-center justify-between border border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-xs font-bold text-white block">Ask Budget AI Assistant</span>
                      <span className="text-[10px] text-indigo-200">Query GFR rules, anomalies, and fiscal policy</span>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-300 font-semibold">Open AI Assistant →</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">Ctrl+K</kbd> Open Search
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono border border-zinc-700">Ctrl+D</kbd> Dashboard
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <BudgetAIMark size={14} />
            <span className="font-semibold text-zinc-300">Budget<span className="text-white">AI</span> <span className="text-[#00C9C8]">Gov</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};
