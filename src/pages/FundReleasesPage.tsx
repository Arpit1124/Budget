import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FundRelease } from '../types';
import {
  ArrowUpRight,
  Search,
  Filter,
  PlusCircle,
  CheckCircle,
  Clock,
  Building,
  FileCheck2,
  X,
} from 'lucide-react';

export const FundReleasesPage: React.FC = () => {
  const { fundReleases, departments, schemes, submitFundRelease, updateFundRelease, financialYear } = useApp();
  const { user, hasRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Request Form
  const [deptId, setDeptId] = useState(departments[0]?.id || '');
  const [schemeId, setSchemeId] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  const canAction = hasRole(['SUPER_ADMIN', 'GOVERNMENT_ADMIN', 'FINANCE_OFFICER']);

  const filtered = fundReleases.filter(r => {
    const matchesSearch =
      r.releaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.schemeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedAmount || isNaN(Number(requestedAmount))) return;

    const dept = departments.find(d => d.id === deptId) || departments[0];
    const sch = schemes.find(s => s.id === schemeId) || schemes[0];

    await submitFundRelease({
      departmentId: dept.id,
      departmentName: dept.name,
      schemeId: sch?.id || 'sch-gen',
      schemeName: sch?.name || 'Central Grant Head',
      financialYear,
      quarter: 'Q3',
      requestedAmount: Number(requestedAmount),
      releasedAmount: 0,
      sanctionOrderNumber: `SANCT-2026-${Math.floor(100 + Math.random() * 900)}`,
      requestedDate: new Date().toISOString().split('T')[0],
      utilizationCertificateSubmitted: true,
      remarks,
    });

    setIsModalOpen(false);
    setRequestedAmount('');
    setRemarks('');
  };

  const handleApprove = (r: FundRelease) => {
    updateFundRelease(r.id, {
      status: 'APPROVED',
      releasedAmount: r.requestedAmount,
      releaseDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleRelease = (r: FundRelease) => {
    updateFundRelease(r.id, {
      status: 'RELEASED',
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Tranche Fund Releases & Sanction Orders
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Releasing central share allocations against verified Utilization Certificates (UC) and milestone proofs.
          </p>
        </div>

        <button
          id="btn-open-request-release"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Release Request</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-search-fund-releases"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by Release ID, Scheme, or Department..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            id="select-fund-release-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="RELEASED">Released</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 ml-auto font-medium">
          Showing {filtered.length} of {fundReleases.length} release tranches
        </div>
      </div>

      {/* Table of Releases */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Release Sanction ID</th>
                <th className="p-3">Department & Scheme</th>
                <th className="p-3">Tranche</th>
                <th className="p-3">Requested (₹ Cr)</th>
                <th className="p-3">Released (₹ Cr)</th>
                <th className="p-3">UC Compliance</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="p-3 font-mono font-medium text-slate-900 dark:text-white">
                    <div>{r.releaseId}</div>
                    <span className="text-[10px] text-slate-400">{r.sanctionOrderNumber}</span>
                  </td>
                  <td className="p-3 max-w-[220px]">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{r.schemeName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{r.departmentName}</p>
                  </td>
                  <td className="p-3 font-medium">Tranche {r.trancheNumber}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">₹{r.requestedAmount} Cr</td>
                  <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{r.releasedAmount} Cr
                  </td>
                  <td className="p-3">
                    {r.utilizationCertificateSubmitted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" /> UC Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-semibold">UC Pending</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        r.status === 'RELEASED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : r.status === 'APPROVED'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {canAction && r.status === 'REQUESTED' && (
                      <button
                        onClick={() => handleApprove(r)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
                      >
                        Approve Sanction
                      </button>
                    )}
                    {canAction && r.status === 'APPROVED' && (
                      <button
                        onClick={() => handleRelease(r)}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors"
                      >
                        Disburse Funds
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Release Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  Request Tranche Fund Release
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={deptId}
                  onChange={e => setDeptId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Scheme
                </label>
                <select
                  value={schemeId}
                  onChange={e => setSchemeId(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">Select Scheme</option>
                  {schemes.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Requested Tranche Amount (₹ Cr)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={requestedAmount}
                  onChange={e => setRequestedAmount(e.target.value)}
                  placeholder="e.g. 85.0"
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expenditure Justification / UC Reference
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Prior tranche utilization details and verified certificates..."
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Submit Release Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
