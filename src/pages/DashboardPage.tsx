import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/I18nContext';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  PlusCircle,
  Clock,
  ChevronRight,
  Filter,
  Printer,
  Eye,
  UserCheck,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { RoleSpecificWidgets } from '../components/dashboard/RoleSpecificWidgets';
import { ProjectHealthCard } from '../components/dashboard/ProjectHealthCard';
import { GovernmentPrintDossier } from '../components/print/GovernmentPrintDossier';
import { AIMetricTooltip } from '../components/dashboard/AIMetricTooltip';
import { ComplianceHealthCard } from '../components/dashboard/ComplianceHealthCard';
import { PredictiveRiskScoreBadge } from '../components/dashboard/PredictiveRiskScoreBadge';
import { BudgetUtilizationVsTargetsChart } from '../components/dashboard/BudgetUtilizationVsTargetsChart';
import { HighLevelKPIDeck } from '../components/dashboard/HighLevelKPIDeck';
import { MonthlyExpenditureTrendsChart } from '../components/dashboard/MonthlyExpenditureTrendsChart';
import { BudgetThresholdAlertBanner } from '../components/dashboard/BudgetThresholdAlertBanner';
import { DepartmentComparisonChart } from '../components/dashboard/DepartmentComparisonChart';
import { AIExecutiveSummaryWidget } from '../components/dashboard/AIExecutiveSummaryWidget';

interface DashboardPageProps {
  onNavigate: (route: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    departments,
    projects,
    schemes,
    anomalies,
    alerts,
    forecast,
    adjustments,
    financialYear,
    setIsAskAIOpen,
    resolveAnomaly,
    applyDemoScenario,
  } = useApp();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Active Role Perspective (Allows testing any view or defaults to user's logged-in role)
  const [activePerspective, setActivePerspective] = useState<string>(() => user?.role || 'MINISTER');
  const [showPrintDossier, setShowPrintDossier] = useState(false);

  // Sync role when user changes
  React.useEffect(() => {
    if (user?.role) {
      setActivePerspective(user.role);
    }
  }, [user?.role]);

  // Metrics
  const totalAllocated = departments.reduce((acc, d) => acc + d.allocatedBudget, 0);
  const totalUtilized = departments.reduce((acc, d) => acc + d.utilizedBudget, 0);
  const overallUtilPercent = Number(((totalUtilized / totalAllocated) * 100).toFixed(1));
  const unspentOutlay = totalAllocated - totalUtilized;
  const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE');
  const mismatchProjects = projects.filter(p => p.hasMismatch);
  const lowUtilDepartments = departments.filter(d => d.utilizationPercentage < 60);

  // Sector breakdown aggregation
  const sectorMap: Record<string, number> = {};
  departments.forEach(d => {
    sectorMap[d.sector] = (sectorMap[d.sector] || 0) + d.utilizedBudget;
  });
  const sectorData = Object.keys(sectorMap).map(sector => ({
    name: sector,
    value: sectorMap[sector],
  }));

  const SECTOR_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Top 6 departments for bar chart
  const topDeptsChartData = [...departments]
    .sort((a, b) => b.allocatedBudget - a.allocatedBudget)
    .slice(0, 6)
    .map(d => ({
      name: d.code,
      fullName: d.name,
      allocated: d.allocatedBudget,
      utilized: d.utilizedBudget,
      rate: d.utilizationPercentage,
    }));

  return (
    <div className="space-y-6 pb-12">
      {/* Print Official Dossier Modal */}
      {showPrintDossier && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 flex justify-center">
          <div className="w-full max-w-5xl bg-white text-zinc-900 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="p-4 bg-zinc-100 border-b border-zinc-200 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-zinc-700" />
                <span className="font-bold text-sm text-zinc-900">
                  Official Government Fiscal Briefing Dossier (Print / PDF Preview)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Send to Printer / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowPrintDossier(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-200 text-zinc-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <GovernmentPrintDossier onBack={() => setShowPrintDossier(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {t('executiveCommandCenter', 'Executive Financial Command Center')}
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              FY {financialYear}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {t('realtimeBudgetUtilization', 'Real-time multi-department budget utilization, divergence tracking, and AI anomaly oversight.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-dash-print-dossier"
            onClick={() => setShowPrintDossier(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-2xl text-xs font-medium transition-colors"
            title="Export clean A4 print media format for official documentation"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-400" />
            <span>Print Official Dossier</span>
          </button>

          <button
            id="btn-dash-ask-ai"
            onClick={() => setIsAskAIOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('askBudgetAI', 'Ask BudgetAI')}</span>
          </button>

          <button
            id="btn-dash-gen-report"
            onClick={() => onNavigate('/reports')}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 rounded-2xl text-xs font-medium transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
            <span>Generate Executive Report</span>
          </button>
        </div>
      </div>

      {/* High-Level Real-Time Fiscal KPI Cards Deck: Total Allocated Budget, Total Expenditure, Budget Variance */}
      <HighLevelKPIDeck
        departments={departments}
        financialYear={financialYear}
        onNavigate={onNavigate}
        onAskAI={() => setIsAskAIOpen(true)}
      />

      {/* AI Executive Summary Widget: 3-Sentence High-Impact Strategic Evaluation Generated from Live KPIs */}
      <AIExecutiveSummaryWidget
        totalAllocated={totalAllocated}
        totalExpenditure={totalUtilized}
        budgetVariance={unspentOutlay}
        utilizationRate={overallUtilPercent}
        financialYear={financialYear}
        laggingDepartmentsCount={lowUtilDepartments.length}
        criticalAnomaliesCount={criticalAnomalies.length}
        onAskAI={() => setIsAskAIOpen(true)}
        onNavigate={onNavigate}
      />

      {/* Budget Threshold Alert Monitor: Real-time surveillance of departments exceeding 80% and 95% outlays */}
      <BudgetThresholdAlertBanner onNavigate={onNavigate} />

      {/* Role-Based Perspective Switcher Bar */}
      <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Eye className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-zinc-300">Administrative Dashboard Perspective:</span>
          <span className="text-[11px] text-zinc-500">
            (Switch views to preview role-specific command widgets)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="btn-perspective-minister"
            onClick={() => setActivePerspective('MINISTER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activePerspective === 'MINISTER' || activePerspective === 'SUPER_ADMIN'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🏛️ Minister View
          </button>

          <button
            id="btn-perspective-clerk"
            onClick={() => setActivePerspective('DEPARTMENT_CLERK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activePerspective === 'DEPARTMENT_CLERK'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            📝 Department Clerk View
          </button>

          <button
            id="btn-perspective-fo"
            onClick={() => setActivePerspective('FINANCE_OFFICER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activePerspective === 'FINANCE_OFFICER' || activePerspective === 'GOVERNMENT_ADMIN'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            💼 Finance Officer View
          </button>

          <button
            id="btn-perspective-auditor"
            onClick={() => setActivePerspective('AUDITOR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activePerspective === 'AUDITOR'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🔍 Auditor View
          </button>
        </div>
      </div>

      {/* Role-Specific Widgets Deck & Workflow Overview Card */}
      <RoleSpecificWidgets
        role={activePerspective}
        user={user}
        departments={departments}
        schemes={schemes}
        adjustments={adjustments}
        onNavigate={onNavigate}
        onPrintDossier={() => setShowPrintDossier(true)}
      />

      {/* Primary Bento Grid: 4-Column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Tile 1: Hero Outlay Feature Card (Spans 2 cols on lg) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                National Outlay & Budget
              </span>
              <div className="flex items-center gap-2">
                <AIMetricTooltip
                  insight={{
                    metricName: 'Consolidated National Outlay',
                    metricValue: `₹${totalAllocated.toLocaleString('en-IN')} Cr`,
                    trendDirection: 'UP',
                    groundedSummary: `Union allocation across 48 ministries is ₹${totalAllocated.toLocaleString('en-IN')} Cr, reflecting a +4.2% YoY increase. Capital outlays in transport, renewables, and digital public infrastructure represent the primary drivers of growth.`,
                    keyDrivers: [
                      'Infrastructure capital expenditure accelerated by 11.2%',
                      'Direct Benefit Transfer (DBT) scheme allocations on track',
                      '38 of 48 central departments have received full Q1-Q3 warrants',
                    ],
                    fiscalRecommendation: 'Ensure non-committed funds are surrendered prior to Q4 revised estimates (RE) cut-off in accordance with GFR Rule 63.',
                    queryPrompt: `Explain the current status and trend of the total national budget outlay of ₹${totalAllocated.toLocaleString('en-IN')} Crore for FY ${financialYear}.`,
                  }}
                />
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  +4.2% YoY Outlay
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                ₹{totalAllocated.toLocaleString('en-IN')}
              </p>
              <span className="text-sm font-semibold text-zinc-400">Crore</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Consolidated allocation across 48 Union Ministries and Central Departments.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-zinc-400 font-medium">Disbursement Progress</span>
              <span className="font-bold text-white">₹{totalUtilized.toLocaleString('en-IN')} Cr ({overallUtilPercent}%)</span>
            </div>
            <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-800">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(overallUtilPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 mt-2 font-mono">
              <span>Q1 Target: 25%</span>
              <span>Q2 Target: 50%</span>
              <span>Q3 Target: 75%</span>
              <span className="text-emerald-400 font-semibold">Active: {overallUtilPercent}%</span>
            </div>
          </div>
        </div>

        {/* Project Health Summary Card with Donut Chart */}
        <ProjectHealthCard
          projects={projects}
          departments={departments}
          onNavigate={onNavigate}
        />

        {/* Tile 2: Gradient Accent Card (Absorption Rate) */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-950/40 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">
              Absorption Rate
            </span>
            <div className="flex items-center gap-1.5">
              <AIMetricTooltip
                insight={{
                  metricName: 'Central Fiscal Absorption Rate',
                  metricValue: `${overallUtilPercent}%`,
                  trendDirection: overallUtilPercent >= 65 ? 'UP' : 'WARNING',
                  groundedSummary: `Aggregate central fiscal absorption stands at ${overallUtilPercent}%, exceeding the statutory mid-year benchmark of 65.0%. Ministries of Road Transport, Railways, and Power lead at 82%+ utilization rate.`,
                  keyDrivers: [
                    'Highway execution velocity tracking at 104% of quarterly schedule',
                    'Minor delays observed in Higher Education ICT procurements',
                    'PFMS electronic verification processing turnaround reduced to 1.8 business days',
                  ],
                  fiscalRecommendation: 'Prioritize fast-track sanctions for departments below 60% absorption before fiscal year-end.',
                  queryPrompt: `Provide an executive assessment of the current ${overallUtilPercent}% budget absorption rate across central departments.`,
                }}
              />
              <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="my-4">
            <div className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              {overallUtilPercent}%
            </div>
            <p className="text-xs text-indigo-100 font-medium mt-1">
              Fiscal Absorption Trajectory
            </p>
          </div>

          <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs text-indigo-100">
            <span>Benchmark: 70.0%</span>
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full text-[10px]">On Track</span>
          </div>
        </div>

        {/* Tile 3: Unspent Risk Card */}
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Unspent Outlay
              </span>
              <div className="flex items-center gap-1.5">
                <AIMetricTooltip
                  insight={{
                    metricName: 'Unspent Outlay & Surrender Risk',
                    metricValue: `₹${unspentOutlay.toLocaleString('en-IN')} Cr`,
                    trendDirection: 'WARNING',
                    groundedSummary: `₹${unspentOutlay.toLocaleString('en-IN')} Cr remains unspent across central heads, with ${lowUtilDepartments.length} departments currently tracking under 60% utilization, creating risk of fund lapse at year-end.`,
                    keyDrivers: [
                      `${lowUtilDepartments.length} departments identified with unliquidated opening advances`,
                      'Tender re-invitations in School Education ICT lab scheme',
                      'State matching share delays in 4 centrally sponsored schemes',
                    ],
                    fiscalRecommendation: 'Issue immediate Section 6 compliance notices to expedite UC (Utilization Certificate) submissions.',
                    queryPrompt: `What is the risk profile and root cause of the ₹${unspentOutlay.toLocaleString('en-IN')} Crore unspent outlay?`,
                  }}
                />
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-3xl font-extrabold text-amber-400 tracking-tight">
                ₹{unspentOutlay.toLocaleString('en-IN')}
              </p>
              <span className="text-xs text-zinc-400">Crore Pending Release</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-400">{lowUtilDepartments.length} Lagging Depts</span>
            <button
              onClick={() => onNavigate('/budget-utilization')}
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
            >
              Review Lag →
            </button>
          </div>
        </div>

        {/* Tile 4: Monthly Expenditure Velocity Area Chart (Spans 3 cols on lg) */}
        <div className="lg:col-span-3 p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                  Fiscal Trajectory
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Monthly Expenditure Velocity & Outlay Trends
              </h2>
              <p className="text-xs text-zinc-400">
                Target Benchmark vs. Actual Central Fund Disbursements (₹ in Crores)
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-indigo-500" />
                <span className="text-zinc-300">Actual Spent</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-1 rounded-sm bg-zinc-500" />
                <span className="text-zinc-400">Target Benchmark</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bentoSpentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '1rem',
                    fontSize: '12px',
                    color: '#f4f4f5',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                  }}
                  formatter={(val: any) => [`₹${val} Cr`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="#71717a"
                  strokeDasharray="4 4"
                  fill="transparent"
                  name="Target"
                />
                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#bentoSpentGradient)"
                  name="Actual Spent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tile 5: Sector Budget Utilization Share (Pie/Donut) */}
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Sector Allocation
              </span>
            </div>
            <h2 className="text-sm font-bold text-white">
              Budget Distribution
            </h2>
            <p className="text-[11px] text-zinc-400 mb-2">
              Disbursements by ministerial sector
            </p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sectorData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '1rem',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`₹${val} Cr`, 'Utilized']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-2 max-h-32 overflow-y-auto pr-1">
            {sectorData.slice(0, 4).map((s, idx) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length] }}
                  />
                  <span className="text-zinc-300 truncate">{s.name}</span>
                </div>
                <span className="font-bold text-white">₹{s.value} Cr</span>
              </div>
            ))}
          </div>
        </div>

        {/* High-Level Oversight: Recharts Bar Chart Visualizing Current Budget Utilization vs Projected Targets */}
        <div className="lg:col-span-4">
          <BudgetUtilizationVsTargetsChart
            departments={departments}
            forecast={forecast}
            onNavigate={onNavigate}
          />
        </div>

        {/* Monthly Expenditure Trends & Seasonal Spending Patterns Line Chart */}
        <div className="lg:col-span-4">
          <MonthlyExpenditureTrendsChart
            forecast={forecast}
            financialYear={financialYear}
            onNavigate={onNavigate}
            onAskAI={() => setIsAskAIOpen(true)}
          />
        </div>

        {/* Secondary Department Comparison Grouped Bar Chart: Interactive side-by-side utilization benchmarking */}
        <div className="lg:col-span-4">
          <DepartmentComparisonChart
            departments={departments}
            onNavigate={onNavigate}
          />
        </div>

        {/* Tile 6: Major Ministerial Allocations vs. Utilization (Bar Chart - Spans 2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                Departmental Comparison
              </span>
              <h2 className="text-base font-bold text-white mt-0.5">
                Top Ministerial Outlays vs. Expenditure
              </h2>
              <p className="text-xs text-zinc-400">
                Comparing approved outlays with recorded disbursements (₹ Cr)
              </p>
            </div>
            <button
              onClick={() => onNavigate('/budget-utilization')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              <span>All 48 Depts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDeptsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={{ stroke: '#27272a' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '1rem',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: any, name: any) => [`₹${val} Cr`, name === 'allocated' ? 'Allocated' : 'Utilized']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="allocated" fill="#52525b" name="Allocated Budget" radius={[6, 6, 0, 0]} />
                <Bar dataKey="utilized" fill="#6366f1" name="Utilized Outlay" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tile 7: Physical vs Financial Progress Mismatches (Spans 2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <h3 className="font-bold text-base text-white">
                  Physical vs. Financial Progress Mismatches
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                High Priority
              </span>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Infrastructure projects where fund disbursements vastly exceed on-site physical milestones.
            </p>

            <div className="space-y-3">
              {mismatchProjects.slice(0, 3).map(p => {
                const divergence = (p.financialProgress - p.physicalProgress).toFixed(1);
                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-zinc-200 truncate max-w-[200px]">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <PredictiveRiskScoreBadge
                          allocatedBudget={p.sanctionedCost}
                          spent={p.sanctionedCost * (p.financialProgress / 100)}
                          financialProgress={p.financialProgress}
                          physicalProgress={p.physicalProgress}
                          quarterName="Q4 FY 2025-26"
                        />
                        <span className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold rounded-full">
                          +{divergence}% Fin Gap
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 mb-2">
                      Dept: {p.departmentName} • Outlay: ₹{p.sanctionedCost} Cr
                    </p>

                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-zinc-300">
                        <span>Physical Progress (Site Audit)</span>
                        <span className="font-bold">{p.physicalProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full rounded-full" style={{ width: `${p.physicalProgress}%` }} />
                      </div>

                      <div className="flex justify-between text-zinc-300 pt-1">
                        <span>Financial Disbursed</span>
                        <span className="font-bold text-indigo-400">{p.financialProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${p.financialProgress}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs">
            <span className="text-zinc-500">{mismatchProjects.length} total projects flagged</span>
            <button
              onClick={() => onNavigate('/projects')}
              className="text-indigo-400 hover:text-indigo-300 font-bold"
            >
              Open Project Audit Register →
            </button>
          </div>
        </div>

        {/* Tile: Automated Compliance Health & Action Required Register */}
        <ComplianceHealthCard />

        {/* Tile 8: Active AI Anomaly Watchdog Queue (Spans full 4 cols on lg) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Active AI Anomaly Watchdog Queue
                </h3>
                <p className="text-xs text-zinc-400">
                  Autonomous pattern detector for tender splittings, GFR 2017 violations, and sudden surge spikes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {criticalAnomalies.length} Critical Vigilance Flags
              </span>
              <button
                onClick={() => onNavigate('/ai-anomalies')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold ml-2"
              >
                View All {anomalies.length} →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {anomalies.slice(0, 3).map(a => (
              <div
                key={a.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-white">
                      {a.anomalyId}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        a.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-zinc-300 mb-1">
                    {(a.type || '').replace(/_/g, ' ')}
                  </p>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                    {a.reason}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                    <span>Dept: {a.departmentName}</span>
                    <span className="font-bold text-white">₹{a.amount} Cr</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono">Status: {a.status}</span>
                    {a.status === 'ACTIVE' && (
                      <button
                        onClick={() => resolveAnomaly(a.id, 'RESOLVED')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-semibold transition-colors shadow-xs"
                      >
                        Verify & Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
