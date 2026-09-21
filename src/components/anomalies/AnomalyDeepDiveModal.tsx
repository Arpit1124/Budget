import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertOctagon,
  ShieldAlert,
  FileText,
  CheckCircle2,
  Download,
  Send,
  X,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { AIAnomaly, Expenditure } from '../../types';
import { useApp } from '../../context/AppContext';

interface AnomalyDeepDiveModalProps {
  anomaly: AIAnomaly | null;
  linkedExpenditures: Expenditure[];
  isOpen: boolean;
  onClose: () => void;
}

interface DeepDiveData {
  anomalyId: string;
  rootCause: string;
  modusOperandi: string;
  voucherEvidenceAnalysis: string;
  flaggedVouchers: Array<{
    transactionId: string;
    date: string;
    amount: number;
    vendorAgency: string;
    category: string;
    suspiciousReason: string;
  }>;
  statutoryRuleViolations: string[];
  fiscalRiskRating: 'CRITICAL' | 'HIGH' | 'MODERATE';
  estimatedExposureCr: number;
  remedialChecklist: string[];
  confidenceScore: number;
  sourceEngine: string;
}

export const AnomalyDeepDiveModal: React.FC<AnomalyDeepDiveModalProps> = ({
  anomaly,
  linkedExpenditures,
  isOpen,
  onClose,
}) => {
  const { addToast, recordAuditAction } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [deepDiveResult, setDeepDiveResult] = useState<DeepDiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNoticeSent, setIsNoticeSent] = useState(false);

  useEffect(() => {
    if (!isOpen || !anomaly) {
      setDeepDiveResult(null);
      setError(null);
      setIsNoticeSent(false);
      return;
    }

    const fetchDeepDive = async () => {
      setIsLoading(true);
      setError(null);
      setIsNoticeSent(false);

      try {
        const response = await fetch('/api/ai/anomalies/deep-dive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anomaly: {
              id: anomaly.id,
              anomalyId: anomaly.anomalyId,
              departmentName: anomaly.departmentName,
              type: anomaly.type,
              amount: anomaly.amount,
              severity: anomaly.severity,
              reason: anomaly.reason,
              recommendedAction: anomaly.recommendedAction,
              projectName: anomaly.projectName,
            },
            linkedExpenditures: linkedExpenditures.slice(0, 8),
          }),
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();
        setDeepDiveResult(data);
      } catch (err: any) {
        console.warn('Deep dive fetch error:', err);
        setError('Failed to contact Gemini deep dive service.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeepDive();
  }, [isOpen, anomaly]);

  if (!isOpen || !anomaly) return null;

  const handleExportDossier = () => {
    if (!deepDiveResult) return;

    const exportText = `=====================================================
CENTRAL VIGILANCE COMMISSION & CAG FORENSIC AUDIT DOSSIER
=====================================================
Anomaly ID: ${deepDiveResult.anomalyId}
Department: ${anomaly.departmentName}
Outlay Amount: ₹${anomaly.amount} Cr
Severity: ${anomaly.severity}
Risk Rating: ${deepDiveResult.fiscalRiskRating}
Confidence Score: ${deepDiveResult.confidenceScore}% (${deepDiveResult.sourceEngine})
Timestamp: ${new Date().toISOString()}

1. ROOT CAUSE STATEMENT:
${deepDiveResult.rootCause}

2. MODUS OPERANDI / LOOPHOLE EXPLOITED:
${deepDiveResult.modusOperandi}

3. LINKED EXPENDITURE EVIDENCE ANALYSIS:
${deepDiveResult.voucherEvidenceAnalysis}

FLAGGED VOUCHERS:
${deepDiveResult.flaggedVouchers
  .map(
    (v, i) =>
      `[${i + 1}] TXN: ${v.transactionId} | Date: ${v.date} | ₹${v.amount} Cr | Vendor: ${v.vendorAgency} | Flag: ${v.suspiciousReason}`
  )
  .join('\n')}

4. STATUTORY RULES & GFR GUIDELINES VIOLATED:
${deepDiveResult.statutoryRuleViolations.map(r => `• ${r}`).join('\n')}

5. REMEDIAL ACTIONS CHECKLIST:
${deepDiveResult.remedialChecklist.map((c, i) => `[ ] ${i + 1}. ${c}`).join('\n')}
=====================================================`;

    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forensic_dossier_${anomaly.anomalyId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast(
      'Dossier Exported',
      `Forensic root-cause dossier for ${anomaly.anomalyId} saved.`,
      'SUCCESS'
    );
  };

  const handleDispatchNotice = () => {
    setIsNoticeSent(true);
    recordAuditAction({
      user: 'Chief Vigilance Officer',
      userRole: 'AUDITOR',
      action: `Dispatched Vigilance Directive for ${anomaly.anomalyId}`,
      recordType: 'ANOMALY_DEEP_DIVE',
      recordId: anomaly.anomalyId,
      status: 'FLAGGED',
      description: `Dispatched formal show-cause directive to ${anomaly.departmentName} based on Gemini forensic root-cause findings.`,
      ipAddress: '10.24.1.9',
    });
    addToast(
      'Vigilance Notice Issued',
      `Statutory compliance directive dispatched to ${anomaly.departmentName} DDO.`,
      'WARNING'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-indigo-400">
                  {anomaly.anomalyId}
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    anomaly.severity === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {anomaly.severity}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                  Gemini Deep Dive
                </span>
              </div>
              <h2 className="text-sm font-bold text-white tracking-tight mt-0.5">
                AI Contextual Root-Cause Forensic Dossier
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  Synthesizing Forensic Root-Cause Analysis...
                </p>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Gemini 3.8 Flash is cross-referencing {linkedExpenditures.length} linked expenditure records with General Financial Rules (GFR 2017) and historical baseline curves.
                </p>
              </div>
            </div>
          ) : deepDiveResult ? (
            <>
              {/* Top Summary Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Department</span>
                  <span className="font-bold text-white text-xs truncate block mt-0.5">
                    {anomaly.departmentName}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Flagged Outlay</span>
                  <span className="font-extrabold text-rose-400 text-sm mt-0.5 block">
                    ₹{anomaly.amount} Cr
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Fiscal Risk Rating</span>
                  <span className="font-bold text-amber-400 text-xs mt-0.5 block">
                    {deepDiveResult.fiscalRiskRating}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Model Confidence</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs mt-0.5 block">
                    {deepDiveResult.confidenceScore}% (Gemini 3.8 Flash)
                  </span>
                </div>
              </div>

              {/* Root Cause & Modus Operandi */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 mb-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Contextual Root-Cause Finding</span>
                  </div>
                  <p className="text-zinc-200 text-xs leading-relaxed font-medium">
                    {deepDiveResult.rootCause}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-zinc-800/80">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Modus Operandi / Vulnerability Exploited
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {deepDiveResult.modusOperandi}
                  </p>
                </div>
              </div>

              {/* Linked Expenditure Records Forensic Evidence */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white text-xs">
                      Linked Expenditure Records Evidence ({deepDiveResult.flaggedVouchers.length} Vouchers)
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Ledger Correlation
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {deepDiveResult.flaggedVouchers.map((v, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-400">
                            {v.transactionId}
                          </span>
                          <span className="text-zinc-500">Date: {v.date}</span>
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px]">
                            {v.category}
                          </span>
                        </div>
                        <p className="text-zinc-300">
                          Vendor: <strong className="text-white">{v.vendorAgency}</strong>
                        </p>
                        <p className="text-rose-300/90 text-[10px]">
                          <strong>Audit Finding:</strong> {v.suspiciousReason}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-zinc-500 block">Outlay</span>
                        <span className="font-bold font-mono text-xs text-white">
                          ₹{v.amount} Cr
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statutory Rules Violated & Remediation Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rules */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Statutory Provisions Violated</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-zinc-300">
                    {deepDiveResult.statutoryRuleViolations.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Remedial Checklist */}
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mandated Remedial Action Plan</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-zinc-300">
                    {deepDiveResult.remedialChecklist.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-zinc-400">
              <p>{error || 'Could not load forensic deep dive at this time.'}</p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>CAG-GFR Surveillance System v4.8</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDossier}
              disabled={!deepDiveResult}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Dossier</span>
            </button>

            <button
              onClick={handleDispatchNotice}
              disabled={isNoticeSent || !deepDiveResult}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isNoticeSent
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
              }`}
            >
              {isNoticeSent ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Notice Dispatched</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Issue Vigilance Directive</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
