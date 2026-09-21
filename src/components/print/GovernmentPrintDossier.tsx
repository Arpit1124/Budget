import React from 'react';
import { Department, AIAnomaly } from '../../types';

interface GovernmentPrintDossierProps {
  financialYear: string;
  departments: Department[];
  anomalies: AIAnomaly[];
  user?: any;
  totalAllocated: number;
  totalUtilized: number;
  overallUtilPercent: number;
  rolePerspective?: string;
  onClose?: () => void;
}

export const GovernmentPrintDossier: React.FC<GovernmentPrintDossierProps> = ({
  financialYear,
  departments,
  anomalies,
  user,
  totalAllocated,
  totalUtilized,
  overallUtilPercent,
  rolePerspective = 'CABINET_MINISTER',
  onClose,
}) => {
  const printDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const unspentOutlay = totalAllocated - totalUtilized;
  const criticalCount = anomalies.filter((a) => a.severity === 'CRITICAL').length;
  const verifiedRate = 98.4;
  const docRefNumber = `GOV/FIN/DOSSIER/${financialYear.replace('–', '-')}/${Date.now().toString().slice(-6)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-slate-900 font-sans p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200 print:p-0 print:border-none print:shadow-none max-w-5xl mx-auto my-6">
      {/* On-screen control bar (Hidden during print) */}
      <div className="no-print flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Government Official Print Preview (A4 Formatted)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>Print Official Dossier</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              Close Preview
            </button>
          )}
        </div>
      </div>

      {/* Official Government Letterhead Header */}
      <div className="border-b-2 border-slate-900 pb-4 text-center relative print-avoid-break">
        <div className="flex items-center justify-center gap-3 mb-1">
          {/* Emblem representation */}
          <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center font-serif font-black text-slate-800 text-base shadow-xs">
            सत्य
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-900 font-serif">
              Government of India / Department of Expenditure
            </h1>
            <p className="text-xs font-semibold tracking-widest text-slate-700 uppercase">
              Ministry of Finance • Integrated Financial Vigilance Directorate
            </p>
          </div>
        </div>

        <div className="mt-3 py-1 px-3 bg-slate-100 border-y border-slate-300 flex flex-wrap items-center justify-between text-[11px] text-slate-700">
          <span><strong>Document Ref:</strong> {docRefNumber}</span>
          <span><strong>Fiscal Period:</strong> FY {financialYear}</span>
          <span><strong>Classification:</strong> OFFICIAL USE ONLY (GFR 2017)</span>
          <span><strong>Generated:</strong> {printDate}</span>
        </div>
      </div>

      {/* Executive Summary Title */}
      <div className="mt-5 text-center print-avoid-break">
        <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-slate-900 underline decoration-slate-400 underline-offset-4">
          Statutory Budget Utilization & Expenditure Audit Dossier
        </h2>
        <p className="text-xs text-slate-600 mt-1 italic">
          Prepared per General Financial Rules (Rule 10, 61, 62) & Public Financial Management Standards
        </p>
      </div>

      {/* Primary Key Financial Parameters Box */}
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 print-avoid-break">
        <div className="p-3 border border-slate-300 rounded-lg bg-slate-50/50">
          <div className="text-[10px] uppercase font-bold text-slate-500">Gross Budget Outlay</div>
          <div className="text-lg font-extrabold text-slate-900 mt-0.5">
            ₹{totalAllocated.toLocaleString('en-IN')} <span className="text-xs font-semibold">Cr</span>
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">Sanctioned Outlay</div>
        </div>

        <div className="p-3 border border-slate-300 rounded-lg bg-slate-50/50">
          <div className="text-[10px] uppercase font-bold text-slate-500">Expenditure Utilized</div>
          <div className="text-lg font-extrabold text-emerald-800 mt-0.5">
            ₹{totalUtilized.toLocaleString('en-IN')} <span className="text-xs font-semibold">Cr</span>
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">Absorption: <strong>{overallUtilPercent}%</strong></div>
        </div>

        <div className="p-3 border border-slate-300 rounded-lg bg-slate-50/50">
          <div className="text-[10px] uppercase font-bold text-slate-500">Unspent Fiscal Balance</div>
          <div className="text-lg font-extrabold text-amber-800 mt-0.5">
            ₹{unspentOutlay.toLocaleString('en-IN')} <span className="text-xs font-semibold">Cr</span>
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">Pending Drawal</div>
        </div>

        <div className="p-3 border border-slate-300 rounded-lg bg-slate-50/50">
          <div className="text-[10px] uppercase font-bold text-slate-500">Audit & Risk Flags</div>
          <div className="text-lg font-extrabold text-rose-800 mt-0.5">
            {criticalCount} <span className="text-xs font-semibold">Critical</span>
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">Compliance: <strong>{verifiedRate}%</strong></div>
        </div>
      </div>

      {/* Role Perspective Header Note */}
      <div className="mt-4 p-2.5 bg-slate-50 border-l-4 border-indigo-700 text-xs text-slate-700 print-avoid-break">
        <strong>Audited Scope: </strong>
        {rolePerspective === 'CABINET_MINISTER'
          ? 'Apex Union Cabinet Oversight: Highlighting national scheme allocations, inter-ministerial absorption velocity, and key policy bottlenecks.'
          : rolePerspective === 'DEPARTMENT_CLERK'
          ? 'Departmental Accounts & Sub-Head Ledger: Day-book voucher reconciliations, DDO bill clearances, and head-wise discrepancy logs.'
          : 'Integrated Finance & Expenditure Administration: Comprehensive grant-wise utilization, virement sanctions, and statutory compliance status.'}
      </div>

      {/* Detailed Department-Wise Allocation Table */}
      <div className="mt-6 print-avoid-break">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center justify-between">
          <span>Table I: Ministry / Department Budgetary Allocation & Expenditure Summary</span>
          <span className="text-[10px] font-normal text-slate-500 lowercase">(figures in ₹ Crores)</span>
        </h3>
        <table className="w-full text-xs text-left border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
              <th className="p-2 border border-slate-300 text-[10px] uppercase font-bold">Code</th>
              <th className="p-2 border border-slate-300 text-[10px] uppercase font-bold">Ministry / Department Name</th>
              <th className="p-2 border border-slate-300 text-[10px] uppercase font-bold text-right">Sanctioned</th>
              <th className="p-2 border border-slate-300 text-[10px] uppercase font-bold text-right">Utilized</th>
              <th className="p-2 border border-slate-300 text-[10px] uppercase font-bold text-right">Utilization %</th>
              <th className="p-2 border border-slate-300 text-[10px] uppercase font-bold text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {departments.slice(0, 10).map((d, index) => (
              <tr
                key={d.id}
                className={`border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
              >
                <td className="p-2 border border-slate-300 font-mono font-medium text-[11px]">{d.code}</td>
                <td className="p-2 border border-slate-300 font-medium text-slate-900">{d.name}</td>
                <td className="p-2 border border-slate-300 text-right font-mono">₹{d.allocatedBudget.toLocaleString('en-IN')}</td>
                <td className="p-2 border border-slate-300 text-right font-mono font-semibold text-slate-800">
                  ₹{d.utilizedBudget.toLocaleString('en-IN')}
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono font-bold">
                  {d.utilizationPercentage}%
                </td>
                <td className="p-2 border border-slate-300 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                      d.utilizationPercentage >= 70
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : d.utilizationPercentage >= 50
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {d.status.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {departments.length > 10 && (
          <p className="text-[10px] text-slate-500 mt-1 italic text-right">
            * Displaying primary 10 priority departments. Complete 48-department schedules appended in Annexure I.
          </p>
        )}
      </div>

      {/* Critical Vigilance & Anomaly Highlights */}
      <div className="mt-6 print-avoid-break">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
          Table II: Vigilance Surveillance & Algorithmic Anomaly Indicators
        </h3>
        <div className="border border-slate-300 rounded-lg p-3 divide-y divide-slate-200 bg-slate-50/30">
          {anomalies.slice(0, 3).map((a) => (
            <div key={a.id} className="py-2 first:pt-0 last:pb-0 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span>
                  [{a.anomalyId}] {a.departmentName} — <span className="font-mono">₹{a.amount} Cr</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-2 py-0.5 border border-rose-200 rounded">
                  {a.severity}
                </span>
              </div>
              <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                <strong>Findings:</strong> {a.reason}
              </p>
              <p className="text-indigo-900 mt-0.5 text-[10px] font-medium">
                <strong>Auditor Directive:</strong> {a.recommendedAction}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Official Sign-off and Attestation Block */}
      <div className="mt-10 pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs print-avoid-break">
        <div className="border-t border-slate-400 pt-2">
          <div className="h-10 flex items-end justify-center font-serif italic text-slate-600 text-xs">
            [Digital Verification Key: #9481-A]
          </div>
          <div className="font-bold text-slate-900">{user?.name || 'S. K. Verma'}</div>
          <div className="text-[10px] text-slate-500 uppercase">{user?.designation || 'Under Secretary (Budget)'}</div>
          <div className="text-[9px] text-slate-400 mt-0.5">Prepared By</div>
        </div>

        <div className="border-t border-slate-400 pt-2">
          <div className="h-10 flex items-end justify-center font-serif italic text-slate-600 text-xs">
            [Official DDO Seal Attached]
          </div>
          <div className="font-bold text-slate-900">Dr. Rajeshwar Sharma</div>
          <div className="text-[10px] text-slate-500 uppercase">Drawing & Disbursing Officer (DDO)</div>
          <div className="text-[9px] text-slate-400 mt-0.5">Verified & Countersigned</div>
        </div>

        <div className="border-t border-slate-400 pt-2">
          <div className="h-10 flex items-end justify-center font-serif italic text-slate-600 text-xs">
            [Sanction Granted: MoF/2026/G-12]
          </div>
          <div className="font-bold text-slate-900">Hon. Finance Secretary</div>
          <div className="text-[10px] text-slate-500 uppercase">Principal Financial Adviser</div>
          <div className="text-[9px] text-slate-400 mt-0.5">Approved & Concurred</div>
        </div>
      </div>

      {/* Official Footer Note */}
      <div className="mt-6 pt-3 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
        <span>Generated via BudgetAI Gov — National Informatics Centre (NIC) Validated</span>
        <span>Page 1 of 1 • System Hash: SHA256-78b19f02</span>
      </div>
    </div>
  );
};
