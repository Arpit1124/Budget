import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PredictiveEndOfYearGapVisualizer } from '../components/forecast/PredictiveEndOfYearGapVisualizer';
import { MonteCarloSimulationModule } from '../components/forecast/MonteCarloSimulationModule';
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const ForecastPage: React.FC = () => {
  const { forecast, departments, financialYear } = useApp();
  const [forecastViewMode, setForecastViewMode] = useState<'MONTE_CARLO' | 'SEASONAL_GAP' | 'ALL'>('MONTE_CARLO');

  const chartData = forecast.monthlyTrends.map(m => ({
    month: m.month,
    target: m.target,
    actual: m.spent,
    projected: m.projected,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Predictive Spending Forecast & Lapsing Risk Model
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 font-medium">
              Stochastic & ML Forecasting
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Forecasting year-end budget absorption velocity, Monte Carlo stochastic confidence corridors, and unspent surrender liabilities across Q3 and Q4.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            id="view-monte-carlo-mode"
            onClick={() => setForecastViewMode('MONTE_CARLO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              forecastViewMode === 'MONTE_CARLO'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Monte Carlo Model</span>
          </button>
          <button
            id="view-seasonal-gap-mode"
            onClick={() => setForecastViewMode('SEASONAL_GAP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              forecastViewMode === 'SEASONAL_GAP'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />
            <span>Seasonal Gap Visualizer</span>
          </button>
          <button
            id="view-all-forecast-mode"
            onClick={() => setForecastViewMode('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              forecastViewMode === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>All Forecast Modules</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Projected Year-End Spent</span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ₹{forecast.projectedTotalSpend.toLocaleString('en-IN')} Cr
          </p>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 block">
            {forecast.projectedUtilizationRate}% of Total Union Outlay
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Expected Unspent Surrender</span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ₹{forecast.projectedLapseAmount.toLocaleString('en-IN')} Cr
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Surrender Required before Feb 15
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Departments at Risk of Lapse</span>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {forecast.highRiskLapseDepartments.length} Departments
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Velocity &lt; 50% of benchmark
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500">Overspending Trajectory</span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {forecast.overspendingTrajectoryDepartments.length} Departments
          </p>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Supplementary Grants Required
          </span>
        </div>
      </div>

      {/* Primary Forecast View Section */}
      {(forecastViewMode === 'MONTE_CARLO' || forecastViewMode === 'ALL') && (
        <MonteCarloSimulationModule />
      )}

      {/* Seasonal Dynamics & Deterministic Gap Visualizer */}
      {(forecastViewMode === 'SEASONAL_GAP' || forecastViewMode === 'ALL') && (
        <PredictiveEndOfYearGapVisualizer />
      )}

      {/* Trajectory Composed Chart */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-semibold text-sm text-slate-900 dark:text-white">
              Projected vs. Historical Spending Velocity
            </h2>
            <p className="text-[11px] text-slate-500">
              Solid line indicates verified actual disbursements; dashed line indicates AI machine learning forecast.
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#fff',
                }}
                formatter={(val: any) => [`₹${val} Cr`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="actual" fill="#3b82f6" fillOpacity={0.2} stroke="#2563eb" strokeWidth={2} name="Actual Spent" />
              <Line type="monotone" dataKey="projected" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} name="Projected Trajectory" />
              <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Target Guideline" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Strategic Reallocation Recommendations */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-blue-900/10 to-indigo-900/10 border border-blue-200 dark:border-blue-900/60 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Proactive Strategic Reallocation Recommendations (GFR 2017)
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          To prevent year-end fund surrender to the Consolidated Fund of India, our algorithms recommend the following mid-year reallocations:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-amber-600 dark:text-amber-400 block mb-1">
              Surrender Tranche Alert: Jal Shakti Department
            </span>
            <p className="text-slate-600 dark:text-slate-300">
              Department is tracking at only 41.2% utilization with ₹735 Cr surplus expected. Recommend reallocating ₹220 Cr to accelerated rural connectivity schemes before Q4.
            </p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
              Supplementary Sanction Alert: Road Transport & Highways
            </span>
            <p className="text-slate-600 dark:text-slate-300">
              Accelerated capital progress requires an additional ₹350 Cr in Q4 to honor milestone disbursements without creating pending contractor liabilities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
