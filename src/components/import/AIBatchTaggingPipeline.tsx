import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { tagTransaction, PriorityLevel, TaggedTransaction } from '../../utils/aiBudgetTagger';
import {
  Sparkles,
  CheckCircle2,
  Building,
  Tag,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check,
  Zap,
} from 'lucide-react';

interface StagedEntry {
  id: string;
  description: string;
  vendorAgency: string;
  amount: number;
  date: string;
  tagging: TaggedTransaction;
}

const SAMPLE_RAW_BATCH: Array<{ description: string; vendorAgency: string; amount: number; date: string }> = [
  {
    description: 'Emergency structural girder retrofitting on National Highway NH-44 viaduct',
    vendorAgency: 'L&T Heavy Civil Infrastructure',
    amount: 38.4,
    date: '2026-03-04',
  },
  {
    description: 'Pediatric ICU oxygen generation manifold and neonatal ventilator units',
    vendorAgency: 'Siemens Healthineers Ltd.',
    amount: 14.8,
    date: '2026-03-05',
  },
  {
    description: 'PM-SHRI digital classroom interactive smart boards and STEM laboratories',
    vendorAgency: 'National Educational Supplies Corp.',
    amount: 8.6,
    date: '2026-03-06',
  },
  {
    description: 'Har Ghar Jal underground high-density polyethylene pipeline laying in drought taluks',
    vendorAgency: 'Jindal Saw Infrastructure Works',
    amount: 22.1,
    date: '2026-03-07',
  },
  {
    description: 'Kavach automatic train protection (ATP) optical signaling system deployment',
    vendorAgency: 'Bharat Electronics Limited (BEL)',
    amount: 41.5,
    date: '2026-03-08',
  },
  {
    description: '500MW Ultra-Mega Solar grid substation step-up transformers and SCADA integration',
    vendorAgency: 'Tata Power Solar Systems',
    amount: 29.0,
    date: '2026-03-09',
  },
];

export const AIBatchTaggingPipeline: React.FC = () => {
  const { importBatchData, refreshAll, departments } = useApp();

  const [stagedEntries, setStagedEntries] = useState<StagedEntry[]>(() => {
    return SAMPLE_RAW_BATCH.map((item, idx) => ({
      id: `stage-${idx + 1}`,
      description: item.description,
      vendorAgency: item.vendorAgency,
      amount: item.amount,
      date: item.date,
      tagging: tagTransaction(item),
    }));
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState(false);
  const [customMemo, setCustomMemo] = useState('');
  const [customAmount, setCustomAmount] = useState('12.5');
  const [customVendor, setCustomVendor] = useState('Central Engineering Agency');

  const handleReRunTagging = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setStagedEntries(prev =>
        prev.map(item => ({
          ...item,
          tagging: tagTransaction({
            description: item.description,
            vendorAgency: item.vendorAgency,
            amount: item.amount,
          }),
        }))
      );
      setIsProcessing(false);
    }, 400);
  };

  const handleAddCustomEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMemo.trim()) return;

    const item = {
      description: customMemo,
      vendorAgency: customVendor,
      amount: parseFloat(customAmount) || 10,
      date: new Date().toISOString().split('T')[0],
    };

    const newStaged: StagedEntry = {
      id: `stage-${Date.now()}`,
      ...item,
      tagging: tagTransaction(item),
    };

    setStagedEntries(prev => [newStaged, ...prev]);
    setCustomMemo('');
  };

  const handleUpdatePriority = (id: string, priority: PriorityLevel) => {
    setStagedEntries(prev =>
      prev.map(e =>
        e.id === id ? { ...e, tagging: { ...e.tagging, priorityLevel: priority } } : e
      )
    );
  };

  const handleUpdateDepartment = (id: string, deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return;

    setStagedEntries(prev =>
      prev.map(e =>
        e.id === id
          ? {
              ...e,
              tagging: {
                ...e.tagging,
                departmentId: dept.id,
                departmentName: dept.name,
                departmentCode: dept.code,
              },
            }
          : e
      )
    );
  };

  const handleCommitIngestion = async () => {
    setIsProcessing(true);
    setIngestSuccess(false);

    try {
      const expendituresPayload = stagedEntries.map((e, idx) => ({
        departmentId: e.tagging.departmentId,
        departmentName: e.tagging.departmentName,
        projectId: e.tagging.projectId,
        projectName: e.tagging.projectName,
        amount: e.amount,
        date: e.date,
        financialYear: '2025-26',
        quarter: 'Q4',
        category: e.tagging.category,
        vendorAgency: e.vendorAgency,
        voucherNumber: `VCH-AI-TAG-${Math.floor(1000 + Math.random() * 9000)}`,
        paymentStatus: 'COMPLETED' as const,
        verificationStatus: 'VERIFIED' as const,
        description: `[${e.tagging.priorityLevel}] ${e.description} (Tags: ${e.tagging.tags.join(', ')})`,
      }));

      await importBatchData('EXPENDITURES', expendituresPayload);
      await refreshAll();
      setIngestSuccess(true);
    } catch (err) {
      console.warn('Failed to commit tagged batch:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-base text-white tracking-tight">
              AI Automated Categorization & Priority Tagging Engine
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Natural Language Semantic Parser
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Automatically maps raw transaction texts into certified Department codes, capital projects, priority levels, and GFR metadata tags.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleReRunTagging}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Re-Analyze Batch</span>
          </button>

          <button
            id="btn-commit-tagged-batch"
            onClick={handleCommitIngestion}
            disabled={isProcessing || stagedEntries.length === 0}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ingest {stagedEntries.length} Tagged Entries into Ledger</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {ingestSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>Batch Committed:</strong> {stagedEntries.length} transactions tagged and posted to the primary expenditure ledger with verified department, project, and priority mappings.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 font-bold">
            LEDGER_UPDATED
          </span>
        </div>
      )}

      {/* Interactive Quick Add Tester */}
      <form onSubmit={handleAddCustomEntry} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
          Test Live AI Tagging with Raw Voucher Memo:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <input
              type="text"
              value={customMemo}
              onChange={e => setCustomMemo(e.target.value)}
              placeholder="e.g. Emergency cardiac pacemaker procurement for cardiology department"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-3">
            <input
              type="text"
              value={customVendor}
              onChange={e => setCustomVendor(e.target.value)}
              placeholder="Vendor agency name..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2">
            <input
              type="number"
              step="0.1"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              placeholder="Amount (₹ Cr)"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full h-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center justify-center"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Staging Table */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider bg-zinc-900/60">
              <th className="py-3 px-4">Voucher Memo & Vendor</th>
              <th className="py-3 px-3">AI Department</th>
              <th className="py-3 px-3">Target Project</th>
              <th className="py-3 px-3">Priority Level</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-4">Tags & AI Rationale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {stagedEntries.map(entry => {
              const { tagging } = entry;
              return (
                <tr key={entry.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-semibold text-white text-xs leading-snug">{entry.description}</p>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">{entry.vendorAgency}</span>
                  </td>

                  <td className="py-3 px-3">
                    <select
                      value={tagging.departmentId}
                      onChange={e => handleUpdateDepartment(entry.id, e.target.value)}
                      className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.code} - {d.name.slice(0, 24)}...
                        </option>
                      ))}
                    </select>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                      <span>✓ {tagging.confidenceScore}% confidence</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 max-w-[180px]">
                    <span className="text-zinc-200 font-medium block truncate text-xs">
                      {tagging.projectName}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Category: {tagging.category}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <select
                      value={tagging.priorityLevel}
                      onChange={e => handleUpdatePriority(entry.id, e.target.value as PriorityLevel)}
                      className={`px-2 py-1 rounded-lg border text-xs font-bold focus:outline-none cursor-pointer ${
                        tagging.priorityLevel === 'URGENT_CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : tagging.priorityLevel === 'HIGH_PRIORITY'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}
                    >
                      <option value="URGENT_CRITICAL">🚨 URGENT CRITICAL</option>
                      <option value="HIGH_PRIORITY">⚡ HIGH PRIORITY</option>
                      <option value="STANDARD_MEDIUM">STANDARD MEDIUM</option>
                      <option value="LOW_PRIORITY">LOW PRIORITY</option>
                    </select>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-white">
                    ₹{entry.amount.toFixed(2)} Cr
                  </td>

                  <td className="py-3 px-4 max-w-sm">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {tagging.tags.map(t => (
                        <span
                          key={t}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      {tagging.aiReasoning}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
