import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  TrendingUp,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldCheck,
  Building,
  Info,
  Layers,
  ArrowRight,
  PieChart as PieChartIcon,
  Percent,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { runMonteCarloBudgetSimulation } from '../../utils/monteCarloSimulation';
import { MonteCarloSimulationResult } from '../../types';

export const MonteCarloSimulationModule: React.FC = () => {
  const { departments, financialYear } = useApp();

  // Configurable simulation parameters
  const [iterations, setIterations] = useState<number>(5000);
  const [volatilityLevel, setVolatilityLevel] = useState<'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME'>('HIGH');
  const [marchRushMultiplier, setMarchRushMultiplier] = useState<number>(1.35);
  const [departmentScope, setDepartmentScope] = useState<string>('ALL');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationRunCounter, setSimulationRunCounter] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'DISTRIBUTION' | 'TRAJECTORY' | 'SENSITIVITY'>('DISTRIBUTION');

  // Run simulation calculation
  const simulationResult: MonteCarloSimulationResult = useMemo(() => {
    // simulationRunCounter is used to force re-computation when the user clicks "Run Simulation"
    void simulationRunCounter;
    return runMonteCarloBudgetSimulation({
      iterations,
      volatilityLevel,
      marchRushMultiplier,
      departmentScope,
      departments,
    });
  }, [iterations, volatilityLevel, marchRushMultiplier, departmentScope, departments, simulationRunCounter]);

  const handleTriggerSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimulationRunCounter(prev => prev + 1);
      setIsSimulating(false);
    }, 400);
  };

  const selectedDepartmentObj = useMemo(() => {
    if (departmentScope === 'ALL') return null;
    return departments.find(d => d.id === departmentScope);
  }, [departmentScope, departments]);

  const isLapseDominant = simulationResult.expectedGap > 0;

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Monte Carlo Budget Gap Simulation Engine
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                Stochastic Risk Modeling
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
              Stochastic probability engine simulating {iterations.toLocaleString('en-IN')} randomized macroeconomic pathways. Predicts end-of-year budget gaps, unspent surrender liabilities under GFR Rule 63, and deficit pressures factoring in monsoon seasonality and Q4 March rush acceleration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-run-monte-carlo"
              onClick={handleTriggerSimulation}
              disabled={isSimulating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                isSimulating
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
              }`}
            >
              {isSimulating ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Computing {iterations.toLocaleString()} Paths...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Stochastic Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Simulation Parameter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Department Scope Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Analysis Scope
            </label>
            <select
              id="select-monte-carlo-dept"
              value={departmentScope}
              onChange={e => setDepartmentScope(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">Entire Union Budget (All 23 Departments)</option>
              {departments.slice(0, 15).map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} (₹{d.allocatedBudget} Cr)
                </option>
              ))}
            </select>
          </div>

          {/* Iteration Count */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Simulation Iterations (N)
            </label>
            <select
              id="select-monte-carlo-iterations"
              value={iterations}
              onChange={e => setIterations(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            >
              <option value={1000}>1,000 Stochastic Iterations</option>
              <option value={2500}>2,500 Stochastic Iterations</option>
              <option value={5000}>5,000 High-Precision Iterations</option>
              <option value={10000}>10,000 Deep Monte Carlo Paths</option>
            </select>
          </div>

          {/* Seasonal Volatility Factor */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Seasonal Volatility (σ)
            </label>
            <select
              id="select-monte-carlo-volatility"
              value={volatilityLevel}
              onChange={e => setVolatilityLevel(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="LOW">Low Volatility (σ = 8%, Stable DBT Outlays)</option>
              <option value="MODERATE">Moderate Volatility (σ = 15%, Historical Baseline)</option>
              <option value="HIGH">High Volatility (σ = 24%, Monsoon & Capex Pauses)</option>
              <option value="EXTREME">Extreme Volatility (σ = 35%, Crisis & Procurement Delays)</option>
            </select>
          </div>

          {/* March Rush Factor */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Q4 March Rush Velocity
            </label>
            <select
              id="select-monte-carlo-march-rush"
              value={marchRushMultiplier}
              onChange={e => setMarchRushMultiplier(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value={1.0}>Strict Anti-Rush Cap (1.0x, Rule 62 Ceiling)</option>
              <option value={1.35}>Historical Union Surge (1.35x, Normal Fiscal Sprint)</option>
              <option value={1.65}>Aggressive Year-End Push (1.65x, High Disbursement)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Predicted Gap Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Allocated Baseline */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Allocated Outlay
          </span>
          <span className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5 block">
            ₹{simulationResult.allocatedBudget.toLocaleString('en-IN')} Cr
          </span>
          <span className="text-[10px] text-slate-500">
            Current: ₹{simulationResult.currentActualSpent.toLocaleString('en-IN')} Cr spent
          </span>
        </div>

        {/* Expected Median Year-End Gap (P50) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-500 block tracking-wider">
            Predicted End-of-Year Gap (P50)
          </span>
          <span
            className={`text-lg font-extrabold mt-0.5 block ${
              isLapseDominant ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isLapseDominant ? '+' : ''}₹{simulationResult.expectedGap.toLocaleString('en-IN')} Cr
          </span>
          <span className="text-[10px] text-slate-500">
            {isLapseDominant ? 'Unspent Surrender Risk' : 'Supplementary Deficit Risk'}
          </span>
        </div>

        {/* Confidence Corridor [P10 - P90] */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-indigo-500 block tracking-wider">
            Gap Corridor [P10–P90]
          </span>
          <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-1 block font-mono">
            ₹{simulationResult.gapP10.toLocaleString('en-IN')} to ₹{simulationResult.gapP90.toLocaleString('en-IN')} Cr
          </span>
          <span className="text-[10px] text-slate-500">80% Confidence Interval</span>
        </div>

        {/* Probability of Lapse */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-500 block tracking-wider">
            Prob. of Fund Surrender
          </span>
          <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
            {simulationResult.probSurrenderLapse}%
          </span>
          <span className="text-[10px] text-slate-500">P(Year-End Spend &lt; Outlay)</span>
        </div>

        {/* Probability of Deficit */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-rose-500 block tracking-wider">
            Prob. of Deficit / Shortfall
          </span>
          <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 block">
            {simulationResult.probDeficitGap}%
          </span>
          <span className="text-[10px] text-slate-500">P(Demand &gt; Outlay)</span>
        </div>

        {/* 95% Value-at-Risk */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-purple-500 block tracking-wider">
            95% Value-at-Risk (VaR)
          </span>
          <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-0.5 block font-mono">
            ₹{simulationResult.valueAtRisk95.toLocaleString('en-IN')} Cr
          </span>
          <span className="text-[10px] text-slate-500">Max tail variance (95% CL)</span>
        </div>
      </div>

      {/* Interactive Tabs for Visualization Modes */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="tab-sim-distribution"
              onClick={() => setActiveTab('DISTRIBUTION')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'DISTRIBUTION'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Probability Density Bell Curve</span>
            </button>
            <button
              id="tab-sim-trajectory"
              onClick={() => setActiveTab('TRAJECTORY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'TRAJECTORY'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Stochastic Trajectory Fan Chart</span>
            </button>
            <button
              id="tab-sim-sensitivity"
              onClick={() => setActiveTab('SENSITIVITY')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'SENSITIVITY'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Department Gap Sensitivity Matrix</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            {iterations.toLocaleString()} paths · σ: {volatilityLevel} · March Rush: {marchRushMultiplier}x
          </div>
        </div>

        {/* TAB 1: Probability Distribution Histogram / Bell Curve */}
        {activeTab === 'DISTRIBUTION' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-xs text-slate-900 dark:text-white">
                  Predicted Year-End Expenditure Probability Distribution
                </h3>
                <p className="text-[11px] text-slate-500">
                  Visualizes the likelihood of final spending. Bars left of the statutory allocation represent unspent surrender gaps; bars to the right represent potential deficit pressures.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[10px] font-medium flex-wrap">
                <span className="flex items-center gap-1 text-amber-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  Unspent Surrender Risk ({simulationResult.probSurrenderLapse}%)
                </span>
                <span className="flex items-center gap-1 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Optimal Corridor (±1%)
                </span>
                <span className="flex items-center gap-1 text-rose-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                  Deficit / Supplementary ({simulationResult.probDeficitGap}%)
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={simulationResult.distributionHistogram} margin={{ top: 10, right: 20, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="binLabel"
                    stroke="#94a3b8"
                    fontSize={10}
                    angle={-25}
                    textAnchor="end"
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                    formatter={(val: any, name: any, item: any) => {
                      const cat = item.payload.category;
                      const catLabel = cat === 'SURRENDER' ? 'Unspent Surrender Zone' : cat === 'DEFICIT' ? 'Deficit / Supplementary Zone' : 'Optimal Corridor';
                      return [
                        `${val} paths (${Math.round((val / iterations) * 1000) / 10}%) — ${catLabel}`,
                        'Frequency',
                      ];
                    }}
                  />
                  <ReferenceLine
                    x={simulationResult.distributionHistogram.find(b => b.binStart <= simulationResult.allocatedBudget && b.binEnd >= simulationResult.allocatedBudget)?.binLabel}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    label={{
                      value: `Outlay Ceiling (₹${simulationResult.allocatedBudget.toLocaleString('en-IN')} Cr)`,
                      position: 'top',
                      fill: '#3b82f6',
                      fontSize: 10,
                    }}
                  />
                  <Bar dataKey="frequency" radius={[4, 4, 0, 0]}>
                    {simulationResult.distributionHistogram.map((entry, idx) => {
                      let fillColor = '#f59e0b'; // Amber for surrender
                      if (entry.category === 'CORRIDOR') fillColor = '#10b981';
                      if (entry.category === 'DEFICIT') fillColor = '#f43f5e';
                      return <Cell key={`cell-${idx}`} fill={fillColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: Stochastic Trajectory Fan Chart */}
        {activeTab === 'TRAJECTORY' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-xs text-slate-900 dark:text-white">
                  Monthly Trajectory Fan Chart & Percentile Envelopes
                </h3>
                <p className="text-[11px] text-slate-500">
                  Solid blue curve indicates verified historic spending. Shaded confidence ribbons illustrate the stochastic dispersion of prospective spending paths towards March 31.
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={simulationResult.monthlyTrajectoryBands} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')} Cr`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  {/* Outer percentile band (P10 to P90) */}
                  <Area
                    type="monotone"
                    dataKey="p90"
                    fill="#f59e0b"
                    fillOpacity={0.12}
                    stroke="none"
                    name="P90 Upper Envelope"
                  />
                  <Area
                    type="monotone"
                    dataKey="p75"
                    fill="#3b82f6"
                    fillOpacity={0.15}
                    stroke="none"
                    name="P75 Corridor"
                  />
                  {/* Median Line */}
                  <Line
                    type="monotone"
                    dataKey="p50"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                    name="P50 Expected Median"
                  />
                  {/* Actual Spending */}
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="Verified Historical Actual"
                  />
                  {/* Target Guideline */}
                  <Line
                    type="monotone"
                    dataKey="targetGuideline"
                    stroke="#94a3b8"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                    name="Statutory Target Corridor"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: Department Gap Sensitivity Matrix */}
        {activeTab === 'SENSITIVITY' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-xs text-slate-900 dark:text-white">
                  Department-Level End-of-Year Gap Contributions
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ranking departments by their projected variance against statutory grants under the current stochastic volatility parameters.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Department / Ministry</th>
                    <th className="p-3 text-right whitespace-nowrap">Allocated Outlay</th>
                    <th className="p-3 text-right whitespace-nowrap">Predicted Spend</th>
                    <th className="p-3 text-right whitespace-nowrap">Predicted Year-End Gap</th>
                    <th className="p-3 text-center whitespace-nowrap">Lapse Risk</th>
                    <th className="p-3 text-right whitespace-nowrap">Volatility Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {simulationResult.departmentSensitivity.slice(0, 8).map(dept => {
                    const isSurplus = dept.medianGap > 0;

                    return (
                      <tr key={dept.departmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dept.departmentName}</span>
                        </td>

                        <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          ₹{dept.allocated.toLocaleString('en-IN')} Cr
                        </td>

                        <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          ₹{dept.meanPredictedSpend.toLocaleString('en-IN')} Cr
                        </td>

                        <td className="p-3 text-right font-mono">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-md ${
                              isSurplus
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {isSurplus ? '+' : ''}₹{dept.medianGap.toLocaleString('en-IN')} Cr {isSurplus ? '(Surplus)' : '(Deficit)'}
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              dept.lapseRiskProb > 60
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {dept.lapseRiskProb}%
                          </span>
                        </td>

                        <td className="p-3 text-right font-semibold">
                          <span
                            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                              dept.volatilityRank === 'HIGH'
                                ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10'
                                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
                            }`}
                          >
                            {dept.volatilityRank}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Actionable Statutory Insights from Simulation */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-transparent border border-amber-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
            Statutory Gap Remediation Advisories (GFR 2017 & PFMS)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {simulationResult.statutoryRecommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    rec.severity === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : rec.severity === 'CRITICAL'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {rec.severity}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Mandate</span>
              </div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                {rec.title}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                {rec.description}
              </p>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono pt-1">
                {rec.statutoryRule}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
