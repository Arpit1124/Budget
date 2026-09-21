import React from 'react';
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  PieChart,
  Boxes,
  CheckCircle,
  FileText,
  Activity,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BudgetAILogo } from '../components/common/BudgetAILogo';

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const { departments, projects, anomalies, setIsAskAIOpen } = useApp();
  const { switchRole } = useAuth();

  const totalAllocated = departments.reduce((sum, d) => sum + d.allocatedBudget, 0);
  const totalUtilized = departments.reduce((sum, d) => sum + d.utilizedBudget, 0);
  const avgUtil = ((totalUtilized / totalAllocated) * 100).toFixed(1);

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 border-b border-zinc-800 bg-radial-[at_top] from-zinc-900 via-zinc-950 to-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-3 px-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-md">
                <BudgetAILogo size="lg" />
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[#00C9C8] text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#00C9C8]" />
              <span>Next-Generation Public Financial Management</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Smarter Monitoring. Better Utilization.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-300">
                Accountable Governance.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed font-normal">
              BudgetAI Gov is an enterprise decision-support intelligence platform built for government ministries to track budget absorption, prevent fiscal anomalies, and cross-reference financial outlays with on-ground physical infrastructure progress.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                id="btn-hero-enter-dashboard"
                onClick={onEnterApp}
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Access Monitoring Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="btn-hero-ask-ai"
                onClick={() => setIsAskAIOpen(true)}
                className="px-6 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-bold text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Ask BudgetAI</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Bento Grid Banner */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl text-center">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">Total Monitored Outlay</p>
              <p className="text-2xl font-black text-white mt-1">₹{totalAllocated.toLocaleString('en-IN')} Cr</p>
              <p className="text-[11px] text-emerald-400 mt-1 font-semibold">FY 2026–27 Allocations</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl text-center">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">Departments Tracked</p>
              <p className="text-2xl font-black text-white mt-1">{departments.length}</p>
              <p className="text-[11px] text-indigo-400 mt-1 font-semibold">Central & State Agencies</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl text-center">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">Overall Utilization</p>
              <p className="text-2xl font-black text-white mt-1">{avgUtil}%</p>
              <p className="text-[11px] text-zinc-400 mt-1 font-semibold">71.6% Benchmark</p>
            </div>

            <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl text-center">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold">AI Risk Watchdog</p>
              <p className="text-2xl font-black text-rose-400 mt-1">{anomalies.length} Flagged</p>
              <p className="text-[11px] text-zinc-400 mt-1 font-semibold">Automated GFR Checks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Built for National Fiscal Integrity
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Address chronic public sector bottlenecks: year-end March rushes, under-utilized social sector budgets, and contractor over-invoicing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl hover:border-zinc-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white tracking-tight">
              Real-Time Budget Utilization
            </h3>
            <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">
              Drill down across 48 ministries down to scheme and project sub-heads. Identify departments lagging behind quarterly benchmark targets before fund lapses occur.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl hover:border-zinc-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white tracking-tight">
              Physical vs. Financial Mismatch
            </h3>
            <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">
              Eliminate paper progress padding. Our divergence matrix flags high disbursements (e.g. 89%) when independent drone or engineer inspections show low completion (e.g. 32%).
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl hover:border-zinc-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white tracking-tight">
              AI Anomaly & Pattern Detector
            </h3>
            <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">
              Detects suspicious tender splittings below statutory e-tendering limits, sudden year-end transaction bursts, and inactive duplicate agency bank details.
            </p>
          </div>
        </div>
      </section>

      {/* Evaluator Role Quick Access */}
      <section className="py-14 bg-zinc-950 border-t border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
              Internship Evaluator Testbed
            </p>
            <h3 className="text-xl font-bold text-white mt-1">
              Test Any User Role with 1 Click
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { role: 'SUPER_ADMIN', name: 'Super Admin', sub: 'Full Governance' },
              { role: 'GOVERNMENT_ADMIN', name: 'Govt Admin', sub: 'Joint Secretary' },
              { role: 'DEPARTMENT_OFFICER', name: 'Dept Officer', sub: 'Program Direct' },
              { role: 'FINANCE_OFFICER', name: 'Finance Officer', sub: 'Disbursements' },
              { role: 'AUDITOR', name: 'Auditor', sub: 'CAG Oversight' },
              { role: 'PROJECT_MANAGER', name: 'Project Mgr', sub: 'NHAI / CPWD' },
              { role: 'VIEW_ONLY_OFFICER', name: 'View-Only', sub: 'Public / Observer' },
            ].map(item => (
              <button
                key={item.role}
                onClick={() => {
                  switchRole(item.role as any);
                  onEnterApp();
                }}
                className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-indigo-500/60 hover:bg-zinc-850 hover:shadow-lg text-left transition-all cursor-pointer group"
              >
                <div className="font-bold text-xs text-zinc-200 group-hover:text-white truncate">
                  {item.name}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1 truncate">
                  {item.sub}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
