import React from 'react';
import { ShieldCheck, HeartHandshake } from 'lucide-react';
import { BudgetAILogo } from '../common/BudgetAILogo';

interface FooterProps {
  onNavigate?: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <BudgetAILogo
              size="md"
              onClick={() => onNavigate?.('/dashboard')}
              className="cursor-pointer"
            />
            <p className="text-zinc-400 leading-relaxed text-xs">
              “Smarter Monitoring. Better Utilization. Accountable Governance.”
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> GFR 2017 Audit Compliant Prototype
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-white font-bold mb-3 text-[10px] uppercase tracking-widest text-zinc-400">Platform</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate?.('/dashboard')} className="hover:text-white transition-colors">
                  Main Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('/budget-utilization')} className="hover:text-white transition-colors">
                  Budget Utilization Monitoring
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('/projects')} className="hover:text-white transition-colors">
                  Projects & Mismatch Tracking
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('/reports')} className="hover:text-white transition-colors">
                  Executive Reports
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold mb-3 text-[10px] uppercase tracking-widest text-zinc-400">Resources</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate?.('/data-quality')} className="hover:text-white transition-colors">
                  Data Quality & Reconciliation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('/ai-anomalies')} className="hover:text-white transition-colors">
                  AI Anomaly Detection Logic
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('/forecast')} className="hover:text-white transition-colors">
                  Financial Forecasting Model
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate?.('/audit')} className="hover:text-white transition-colors">
                  CAG Audit Trail Log
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-white font-bold mb-3 text-[10px] uppercase tracking-widest text-zinc-400">Legal & Disclaimer</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
              All financial entries, department allocations, and voucher items are simulated sample data for internship evaluation and technical demonstration.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <HeartHandshake className="w-3.5 h-3.5 text-indigo-400" />
              <span>Fullstack GovTech Project 2026</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <p>© 2026 BudgetAI Gov. Demonstration platform – not an official government portal.</p>
          <div className="flex gap-4">
            <span className="text-emerald-400">Live Evaluation Sandbox</span>
            <span>•</span>
            <span>NIC & PFMS Standard Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
