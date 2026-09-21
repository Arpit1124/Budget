import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import {
  Search,
  Filter,
  AlertTriangle,
  FolderGit2,
  CheckCircle2,
  Clock,
  X,
  Edit3,
  MapPin,
  Building,
  Calendar,
  Save,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { projects, departments, refreshAll } = useApp();
  const { hasRole } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [mismatchOnly, setMismatchOnly] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Edit progress state
  const [isEditing, setIsEditing] = useState(false);
  const [editPhysical, setEditPhysical] = useState(0);
  const [editFinancial, setEditFinancial] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = hasRole(['SUPER_ADMIN', 'GOVERNMENT_ADMIN', 'PROJECT_MANAGER']);

  const filtered = projects.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'ALL' || p.departmentId === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesMismatch = !mismatchOnly || p.hasMismatch;

    return matchesSearch && matchesDept && matchesStatus && matchesMismatch;
  });

  const handleOpenProject = (p: Project) => {
    setSelectedProject(p);
    setEditPhysical(p.physicalProgress);
    setEditFinancial(p.financialProgress);
    setIsEditing(false);
  };

  const handleSaveProgress = async () => {
    if (!selectedProject) return;
    setIsSaving(true);
    const diff = Math.abs(editFinancial - editPhysical);
    const hasMismatchNow = diff > 25;

    try {
      await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          physicalProgress: Number(editPhysical),
          financialProgress: Number(editFinancial),
          hasMismatch: hasMismatchNow,
          mismatchDescription: hasMismatchNow
            ? `Divergence: Financial outlay is ${editFinancial}% against physical execution of ${editPhysical}%.`
            : undefined,
        }),
      });
      await refreshAll();
      setSelectedProject(prev =>
        prev
          ? {
              ...prev,
              physicalProgress: Number(editPhysical),
              financialProgress: Number(editFinancial),
              hasMismatch: hasMismatchNow,
            }
          : null
      );
      setIsEditing(false);
    } catch (e) {
      console.warn('Project progress save error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Capital Infrastructure & Project Registry
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Live Tracker
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Tracking execution milestones, ground inspection benchmarks, and physical vs. financial divergence.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
          <input
            id="input-search-projects"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search projects by name, code, or state..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder:text-zinc-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 font-medium">Department:</span>
          <select
            id="select-project-dept-filter"
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id} className="bg-zinc-900">
                {d.code} - {d.name}
              </option>
            ))}
          </select>
        </div>

        <button
          id="btn-toggle-mismatch-filter"
          onClick={() => setMismatchOnly(!mismatchOnly)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            mismatchOnly
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
              : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Mismatch Flagged Only</span>
        </button>

        <div className="text-xs text-zinc-400 ml-auto font-medium">
          Showing {filtered.length} of {projects.length} projects
        </div>
      </div>

      {/* Projects Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(p => {
          const divergence = Math.abs(p.financialProgress - p.physicalProgress).toFixed(1);

          return (
            <div
              key={p.id}
              onClick={() => handleOpenProject(p)}
              className={`p-5 rounded-3xl bg-zinc-900 border transition-all cursor-pointer flex flex-col justify-between group ${
                p.hasMismatch
                  ? 'border-rose-900/60 shadow-lg hover:border-rose-500'
                  : 'border-zinc-800 hover:border-indigo-500/50 hover:shadow-2xl'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                      {p.code}
                    </span>
                    <h3 className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors mt-2 line-clamp-2">
                      {p.name}
                    </h3>
                  </div>

                  {p.hasMismatch ? (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 whitespace-nowrap flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Mismatch
                    </span>
                  ) : (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      {p.status}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-zinc-400 space-y-1 mb-4">
                  <p className="flex items-center gap-1.5 truncate">
                    <Building className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{p.departmentName}</span>
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{p.location}</span>
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-[11px]">
                  <div>
                    <div className="flex justify-between text-zinc-400 mb-1">
                      <span>Physical Execution</span>
                      <span className="font-bold text-zinc-200">{p.physicalProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 border border-zinc-800/60 h-2 rounded-full overflow-hidden p-0.5">
                      <div
                        className="bg-amber-400 h-full rounded-full"
                        style={{ width: `${p.physicalProgress}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 mb-1">
                      <span>Financial Disbursed</span>
                      <span className="font-bold text-indigo-400">
                        {p.financialProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-900 border border-zinc-800/60 h-2 rounded-full overflow-hidden p-0.5">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${p.financialProgress}%` }}
                      />
                    </div>
                  </div>

                  {p.hasMismatch && (
                    <div className="text-[10px] text-rose-400 pt-1.5 font-medium border-t border-zinc-800">
                      Divergence gap: +{divergence}% excess financial release
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Sanction: <strong className="text-zinc-200">₹{p.sanctionedCost} Cr</strong></span>
                <span className="text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">Inspect Details →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Details & Progress Update Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                    {selectedProject.code}
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {selectedProject.name}
                  </h2>
                </div>
                <p className="text-xs text-zinc-400">
                  {selectedProject.departmentName} • {selectedProject.location}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Financial Outlay vs Sanction */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Sanctioned Outlay</p>
                  <p className="text-base font-extrabold text-white mt-1">
                    ₹{selectedProject.sanctionedCost} Cr
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Disbursed Amount</p>
                  <p className="text-base font-extrabold text-indigo-400 mt-1">
                    ₹{selectedProject.disbursedAmount} Cr
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Agency</p>
                  <p className="text-xs font-bold text-zinc-200 mt-1 truncate">
                    {selectedProject.agency}
                  </p>
                </div>
              </div>

              {/* Mismatch Alert Box */}
              {selectedProject.hasMismatch && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs">
                  <div className="flex items-center gap-2 text-rose-300 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Audit Flag: Extreme Physical vs. Financial Discrepancy</span>
                  </div>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {selectedProject.mismatchDescription ||
                      'Expenditure releases have outpaced certified ground completion. Physical verification by technical auditor advised before approving subsequent tranches.'}
                  </p>
                </div>
              )}

              {/* Milestones Checklist */}
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-300 mb-3">
                  Milestone Execution Schedule
                </h3>
                <div className="space-y-2">
                  {selectedProject.milestones?.map(m => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {m.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : m.status === 'IN_PROGRESS' ? (
                          <Clock className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-zinc-700" />
                        )}
                        <div>
                          <p className="font-bold text-white">{m.name}</p>
                          <p className="text-[10px] text-zinc-500">Target Date: {m.targetDate}</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          m.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : m.status === 'IN_PROGRESS'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Update Slider Form (For Authorized Roles) */}
              {canEdit && (
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-zinc-200 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-indigo-400" /> Technical Inspection Progress Update
                    </span>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-semibold transition-colors"
                      >
                        Edit Values
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-zinc-300 mb-1.5">
                          <span>Physical Progress (Verified on Site):</span>
                          <span className="font-bold text-white">{editPhysical}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editPhysical}
                          onChange={e => setEditPhysical(Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-zinc-300 mb-1.5">
                          <span>Financial Progress (Disbursed Outlay):</span>
                          <span className="font-bold text-indigo-400">{editFinancial}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={editFinancial}
                          onChange={e => setEditFinancial(Number(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer"
                        />
                      </div>

                      <div className="flex justify-end gap-2.5 pt-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3.5 py-1.5 bg-zinc-800 text-zinc-300 rounded-xl text-xs hover:bg-zinc-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveProgress}
                          disabled={isSaving}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? 'Saving...' : 'Commit Progress Log'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500">
                      Current certified state: Physical {selectedProject.physicalProgress}% • Financial {selectedProject.financialProgress}%
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Register
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
