import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { SpendingForecast } from '../../types';
import {
  Calendar,
  CloudRain,
  Sun,
  Flame,
  FileCheck2,
  TrendingUp,
  Info,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Building2,
  Wallet,
  SendHorizontal,
  Briefcase,
  Pin,
  PinOff,
  Check,
  MousePointerClick,
  Filter,
} from 'lucide-react';

interface MonthlyExpenditureTrendsChartProps {
  forecast: SpendingForecast;
  financialYear: string;
  onNavigate?: (route: string) => void;
  onAskAI?: (prompt: string) => void;
}

type ViewType = 'RUN_RATE' | 'CUMULATIVE';
type SpendingCategory = 'ALL' | 'CAPEX' | 'REVENUE';
type TooltipCategoryFilter = 'ALL' | 'capex' | 'dbt' | 'css' | 'admin';

export interface MonthlyCategorySpending {
  id: 'capex' | 'dbt' | 'css' | 'admin';
  name: string;
  shortName: string;
  amount: number;
  percentage: number;
  color: string;
  textColor: string;
  badgeBg: string;
  badgeBorder: string;
  driver: string;
  trendBadge: string;
}

export interface MonthlyTrendDataPoint {
  month: string;
  fullName: string;
  quarter: string;
  seasonName: string;
  weatherFactor: string;
  seasonalIndex: number;
  icon: string;
  actual: number | null;
  projected: number;
  effectiveTotal: number;
  historicalBaseline: number;
  upperBound: number;
  lowerBound: number;
  cumulativeActual: number | null;
  cumulativeProjected: number;
  cumulativeHistorical: number;
  categorySpending: MonthlyCategorySpending[];
}

export const MonthlyExpenditureTrendsChart: React.FC<MonthlyExpenditureTrendsChartProps> = ({
  forecast,
  financialYear,
  onNavigate,
  onAskAI,
}) => {
  const [viewType, setViewType] = useState<ViewType>('RUN_RATE');
  const [spendingCategory, setSpendingCategory] = useState<SpendingCategory>('ALL');
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [showConfidenceBand, setShowConfidenceBand] = useState<boolean>(true);
  const [pinnedMonth, setPinnedMonth] = useState<MonthlyTrendDataPoint | null>(null);
  const [tooltipActiveCategory, setTooltipActiveCategory] = useState<TooltipCategoryFilter>('ALL');

  // Month-by-month seasonality reference database for Indian Financial Year (Apr - Mar)
  const monthlySeasonalityData = useMemo<MonthlyTrendDataPoint[]>(() => {
    // 5-year historical average run-rates reflecting national spending patterns
    const historicalBaseline = [
      640, 780, 910, 1050, 1180, 930, 990, 1040, 1130, 1200, 1290, 1420
    ];

    let cumActual = 0;
    let cumProjected = 0;
    let cumHistorical = 0;

    return forecast.monthlyProjections.map((item, idx) => {
      // Weight adjustments for Capex (high monsoon seasonality) vs Revenue (steady DBT)
      let multiplier = 1.0;
      if (spendingCategory === 'CAPEX') {
        multiplier = [0.28, 0.32, 0.34, 0.30, 0.26, 0.28, 0.35, 0.38, 0.42, 0.44, 0.48, 0.55][idx];
      } else if (spendingCategory === 'REVENUE') {
        multiplier = [0.72, 0.68, 0.66, 0.70, 0.74, 0.72, 0.65, 0.62, 0.58, 0.56, 0.52, 0.45][idx];
      }

      const actualVal = item.actual !== null ? Math.round(item.actual * (spendingCategory === 'ALL' ? 1.0 : multiplier)) : null;
      const projectedVal = Math.round(item.projected * (spendingCategory === 'ALL' ? 1.0 : multiplier));
      const histVal = Math.round(historicalBaseline[idx] * (spendingCategory === 'ALL' ? 1.0 : multiplier));
      const upperVal = Math.round(item.upperBound * (spendingCategory === 'ALL' ? 1.0 : multiplier));
      const lowerVal = Math.round(item.lowerBound * (spendingCategory === 'ALL' ? 1.0 : multiplier));

      if (actualVal !== null) {
        cumActual += actualVal;
      }
      cumProjected += (actualVal !== null ? actualVal : projectedVal);
      cumHistorical += histVal;

      // Seasonal phase metadata
      let quarter = 'Q1';
      let seasonName = 'Initial Sanction & Planning';
      let weatherFactor = 'Pre-Monsoon dry spell, tender issuances';
      let seasonalIndex = 78;
      let icon = 'calendar';

      if (idx <= 2) {
        quarter = 'Q1';
        seasonName = 'Initial Warrant Release & Procurement';
        weatherFactor = 'Moderate spending during budget passage and vendor mobilization.';
        seasonalIndex = idx === 0 ? 65 : idx === 1 ? 78 : 91;
        icon = 'calendar';
      } else if (idx <= 5) {
        quarter = 'Q2';
        seasonName = 'Monsoon Slump & DBT Sustenance';
        weatherFactor = 'Heavy rainfall slows civil infrastructure; DBT transfers continue steady.';
        seasonalIndex = idx === 3 ? 107 : idx === 4 ? 119 : 94;
        icon = 'rain';
      } else if (idx <= 8) {
        quarter = 'Q3';
        seasonName = 'Post-Monsoon Construction Acceleration';
        weatherFactor = 'Optimal weather triggers major billing surges across highway & energy works.';
        seasonalIndex = idx === 6 ? 100 : idx === 7 ? 104 : 113;
        icon = 'sun';
      } else {
        quarter = 'Q4';
        seasonName = 'Year-End Acceleration (March Rush)';
        weatherFactor = 'High-velocity disbursement rush prior to March 31 surrender deadline (GFR Rule 64).';
        seasonalIndex = idx === 9 ? 120 : idx === 10 ? 130 : 142;
        icon = 'flame';
      }

      // Compute specific Category-Wise Spending Breakdown for this month
      let capexShare = 36;
      let dbtShare = 32;
      let cssShare = 20;
      let adminShare = 12;

      if (idx === 0) {
        capexShare = 28; dbtShare = 42; cssShare = 18; adminShare = 12;
      } else if (idx === 1) {
        capexShare = 32; dbtShare = 36; cssShare = 20; adminShare = 12;
      } else if (idx === 2) {
        capexShare = 34; dbtShare = 34; cssShare = 21; adminShare = 11;
      } else if (idx === 3) {
        // July Monsoon Slump in Capex, Surge in Kharif DBT
        capexShare = 22; dbtShare = 46; cssShare = 20; adminShare = 12;
      } else if (idx === 4) {
        // August Peak Monsoon
        capexShare = 24; dbtShare = 44; cssShare = 21; adminShare = 11;
      } else if (idx === 5) {
        capexShare = 28; dbtShare = 38; cssShare = 23; adminShare = 11;
      } else if (idx === 6) {
        capexShare = 36; dbtShare = 32; cssShare = 21; adminShare = 11;
      } else if (idx === 7) {
        // November Post-monsoon surge
        capexShare = 42; dbtShare = 29; cssShare = 19; adminShare = 10;
      } else if (idx === 8) {
        // December
        capexShare = 44; dbtShare = 27; cssShare = 19; adminShare = 10;
      } else if (idx === 9) {
        // January
        capexShare = 45; dbtShare = 26; cssShare = 19; adminShare = 10;
      } else if (idx === 10) {
        // February
        capexShare = 48; dbtShare = 24; cssShare = 18; adminShare = 10;
      } else if (idx === 11) {
        // March Rush (GFR Rule 64)
        capexShare = 50; dbtShare = 22; cssShare = 20; adminShare = 8;
      }

      const effectiveTotal = actualVal !== null ? actualVal : projectedVal;
      const capexAmount = Math.round((effectiveTotal * capexShare) / 100);
      const dbtAmount = Math.round((effectiveTotal * dbtShare) / 100);
      const cssAmount = Math.round((effectiveTotal * cssShare) / 100);
      const adminAmount = Math.max(0, effectiveTotal - (capexAmount + dbtAmount + cssAmount));

      const categorySpending: MonthlyCategorySpending[] = [
        {
          id: 'capex',
          name: 'Capital Works & Civil Infrastructure',
          shortName: 'Capex',
          amount: capexAmount,
          percentage: capexShare,
          color: '#6366f1',
          textColor: 'text-indigo-400',
          badgeBg: 'bg-indigo-500/20',
          badgeBorder: 'border-indigo-500/30',
          driver: idx >= 3 && idx <= 5
            ? 'Monsoon rains pausing civil earthworks & highway paving.'
            : idx >= 7 && idx <= 8
            ? 'Dry weather accelerating NHAI corridors & railway electrification.'
            : idx === 11
            ? 'Year-end contract milestone settlements under GFR Rule 64.'
            : 'Vendor mobilization & initial engineering procurement.',
          trendBadge: idx === 3 ? 'Monsoon Slump (-22%)' : idx === 7 ? 'Dry Rebound (+34%)' : idx === 11 ? 'March Rush (+48%)' : 'Normal Velocity',
        },
        {
          id: 'dbt',
          name: 'Direct Benefit Transfers & Social Welfare',
          shortName: 'DBT Welfare',
          amount: dbtAmount,
          percentage: dbtShare,
          color: '#10b981',
          textColor: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20',
          badgeBorder: 'border-emerald-500/30',
          driver: idx >= 3 && idx <= 4
            ? 'Kharif crop sowing DBT & monsoon livelihood sustenance tranches.'
            : idx === 0
            ? 'PM-KISAN first instalment release & fertilizer subsidy advance.'
            : 'Aadhaar-enabled public food distribution & social security pensions.',
          trendBadge: idx >= 3 && idx <= 4 ? 'Welfare Surge (+24%)' : 'Linear Sustenance',
        },
        {
          id: 'css',
          name: 'Centrally Sponsored Schemes & State Grants',
          shortName: 'CSS Grants',
          amount: cssAmount,
          percentage: cssShare,
          color: '#f59e0b',
          textColor: 'text-amber-400',
          badgeBg: 'bg-amber-500/20',
          badgeBorder: 'border-amber-500/30',
          driver: 'Jal Jeevan Mission, Samagra Shiksha & state treasury devolution.',
          trendBadge: (idx % 3 === 2) ? 'Quarterly Tranche Release' : 'Regular Grant-in-Aid',
        },
        {
          id: 'admin',
          name: 'Operations, Salaries & IT Governance',
          shortName: 'Opex & IT',
          amount: adminAmount,
          percentage: adminShare,
          color: '#ec4899',
          textColor: 'text-pink-400',
          badgeBg: 'bg-pink-500/20',
          badgeBorder: 'border-pink-500/30',
          driver: 'PFMS clearing infrastructure, GeM platform & central civilian payroll.',
          trendBadge: 'Fixed Overhead',
        },
      ];

      return {
        month: item.month,
        fullName: `${item.month} ${idx < 9 ? '2026' : '2027'}`,
        quarter,
        seasonName,
        weatherFactor,
        seasonalIndex,
        icon,
        actual: actualVal,
        projected: projectedVal,
        effectiveTotal,
        historicalBaseline: histVal,
        upperBound: upperVal,
        lowerBound: lowerVal,
        cumulativeActual: actualVal !== null ? cumActual : null,
        cumulativeProjected: cumProjected,
        cumulativeHistorical: cumHistorical,
        categorySpending,
      };
    });
  }, [forecast, spendingCategory]);

  // Key stats
  const activeMonths = monthlySeasonalityData.filter((d) => d.actual !== null);
  const totalExpendedSoFar = activeMonths.reduce((acc, d) => acc + (d.actual || 0), 0);
  const averageMonthlyBurn = Math.round(totalExpendedSoFar / (activeMonths.length || 1));
  const peakMonth = useMemo(() => {
    return monthlySeasonalityData.reduce((prev, current) =>
      (prev.projected > current.projected) ? prev : current
    );
  }, [monthlySeasonalityData]);

  // Interactive Custom Tooltip displaying specific category-wise spending
  const InteractiveCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MonthlyTrendDataPoint = payload[0].payload;
      const isActual = data.actual !== null;
      const totalAmount = isActual ? data.actual! : data.projected;

      // Filtered categories based on interactive pill selection inside tooltip
      const displayedCategories = tooltipActiveCategory === 'ALL'
        ? data.categorySpending
        : data.categorySpending.filter((c) => c.id === tooltipActiveCategory);

      return (
        <div
          id="expenditure-trend-interactive-tooltip"
          className="bg-zinc-950/95 border border-zinc-700 rounded-3xl p-4 sm:p-5 shadow-2xl text-xs text-white w-80 sm:w-96 backdrop-blur-xl pointer-events-auto transition-all animate-fadeIn"
          style={{ minWidth: '320px' }}
        >
          {/* Header Row: Month Name, Status Tag, and Seasonal Index */}
          <div className="flex items-start justify-between border-b border-zinc-800 pb-3 mb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-zinc-100">
                  {data.fullName}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                  {data.quarter}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 block mt-0.5 font-medium">
                {data.seasonName}
              </span>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                isActual
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-violet-500/20 text-violet-300 border-violet-500/40'
              }`}>
                {isActual ? 'Actual Disbursed' : 'AI Projected'}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-1">
                Index: <strong className="text-zinc-200">{data.seasonalIndex}</strong>
              </span>
            </div>
          </div>

          {/* Monthly Total Expenditure Highlight */}
          <div className="p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 mb-3 flex items-center justify-between">
            <span className="text-xs text-zinc-300 flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isActual ? 'bg-emerald-400 animate-pulse' : 'bg-violet-400'}`} />
              Total Monthly Spending:
            </span>
            <span className={`text-sm sm:text-base font-black font-mono ${isActual ? 'text-emerald-400' : 'text-violet-400'}`}>
              ₹{totalAmount.toLocaleString('en-IN')} Cr
            </span>
          </div>

          {/* Interactive Category-Wise Spending Section */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-zinc-200 font-bold text-xs">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Category-Wise Spending Breakdown:</span>
              </div>
              <span className="text-[10px] text-zinc-400">Interactive Drilldown</span>
            </div>

            {/* Segmented Proportional Distribution Bar */}
            <div className="w-full h-2 rounded-full flex overflow-hidden mb-2.5 bg-zinc-900 border border-zinc-800">
              {data.categorySpending.map((cat) => (
                <div
                  key={cat.id}
                  title={`${cat.name}: ₹${cat.amount} Cr (${cat.percentage}%)`}
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                    opacity: tooltipActiveCategory === 'ALL' || tooltipActiveCategory === cat.id ? 1 : 0.25,
                  }}
                  className="h-full transition-all cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTooltipActiveCategory(cat.id === tooltipActiveCategory ? 'ALL' : cat.id);
                  }}
                />
              ))}
            </div>

            {/* Interactive Category Filter Pills */}
            <div className="flex items-center gap-1 flex-wrap mb-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTooltipActiveCategory('ALL');
                }}
                className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  tooltipActiveCategory === 'ALL'
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                All (4 Categories)
              </button>
              {data.categorySpending.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTooltipActiveCategory(tooltipActiveCategory === cat.id ? 'ALL' : cat.id);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer border ${
                    tooltipActiveCategory === cat.id
                      ? `${cat.badgeBg} ${cat.textColor} ${cat.badgeBorder} shadow-sm`
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                  }`}
                >
                  {cat.shortName} ({cat.percentage}%)
                </button>
              ))}
            </div>

            {/* Category Spending Details List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
              {displayedCategories.map((cat) => {
                const IconComponent =
                  cat.id === 'capex'
                    ? Building2
                    : cat.id === 'dbt'
                    ? Wallet
                    : cat.id === 'css'
                    ? SendHorizontal
                    : Briefcase;

                return (
                  <div
                    key={cat.id}
                    className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-semibold text-zinc-200 truncate text-[11px]">
                          {cat.name}
                        </span>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-1.5">
                        <span className="font-bold text-white font-mono text-xs">
                          ₹{cat.amount.toLocaleString('en-IN')} Cr
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.2 rounded-md"
                          style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                        >
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1 pl-3.5">
                      <span className="truncate pr-1 text-zinc-400">{cat.driver}</span>
                      <span className="shrink-0 text-[9px] font-mono text-zinc-500 bg-zinc-800/60 px-1 py-0.5 rounded">
                        {cat.trendBadge}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seasonal Context Note */}
          <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 leading-snug">
            <span className="text-zinc-300 font-semibold block mb-0.5">Seasonal Weather Factor:</span>
            {data.weatherFactor}
          </div>

          {/* Interactive Tooltip Actions Bar */}
          <div className="pt-2.5 mt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPinnedMonth(data);
              }}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Pin className="w-3 h-3" />
              <span>Pin Details</span>
            </button>

            {onAskAI && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAskAI(
                    `Analyze the category-wise spending for ${data.fullName}: Capital Works was ₹${data.categorySpending[0].amount} Cr (${data.categorySpending[0].percentage}%), DBT Welfare was ₹${data.categorySpending[1].amount} Cr (${data.categorySpending[1].percentage}%), and CSS Grants was ₹${data.categorySpending[2].amount} Cr. Explain how seasonal factors affected this distribution.`
                  );
                }}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Ask AI</span>
              </button>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="chart-monthly-expenditure-trends"
      className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-xl relative overflow-hidden"
    >
      {/* Header and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3" />
              <span>Macro Fiscal Run-Rate & Seasonality</span>
            </span>
            <span className="text-xs text-zinc-400 font-medium">
              FY {financialYear} • 12-Month Trajectory
            </span>
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Monthly Expenditure Trends & Category-Wise Spending</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Hover over any monthly point to view interactive category-wise spending (Capex, DBT Welfare, CSS Grants, Opex).
          </p>
        </div>

        {/* View Switchers & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Outlay Filter Pill: ALL / CAPEX / REVENUE */}
          <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setSpendingCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                spendingCategory === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Outlays
            </button>
            <button
              onClick={() => setSpendingCategory('CAPEX')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                spendingCategory === 'CAPEX'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Filters Capital Infrastructure (High monsoon dip, sharp March rush)"
            >
              Capex (Volatile)
            </button>
            <button
              onClick={() => setSpendingCategory('REVENUE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                spendingCategory === 'REVENUE'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Filters Revenue & DBT (Linear year-round profile)"
            >
              DBT / Welfare
            </button>
          </div>

          {/* Velocity vs Cumulative Toggle */}
          <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setViewType('RUN_RATE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewType === 'RUN_RATE'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Monthly Burn
            </button>
            <button
              onClick={() => setViewType('CUMULATIVE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewType === 'CUMULATIVE'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cumulative
            </button>
          </div>
        </div>
      </div>

      {/* Seasonal Phase Overview Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Q1: Apr–Jun</span>
          </div>
          <div className="text-xs font-semibold text-zinc-200">Procurement & Warrants</div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Initial slow spend as tenders are awarded (Index ~78).
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold mb-1">
            <CloudRain className="w-3.5 h-3.5" />
            <span>Q2: Jul–Sep</span>
          </div>
          <div className="text-xs font-semibold text-zinc-200">Monsoon Civil Slump</div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Heavy rains slow highway work; sustained by welfare DBT.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
            <Sun className="w-3.5 h-3.5" />
            <span>Q3: Oct–Dec</span>
          </div>
          <div className="text-xs font-semibold text-zinc-200">Dry Weather Acceleration</div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Construction rebounds; major harvest & festive tranches.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mb-1">
            <Flame className="w-3.5 h-3.5" />
            <span>Q4: Jan–Mar</span>
          </div>
          <div className="text-xs font-semibold text-zinc-200">Year-End March Rush</div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Peak surge before March 31 surrender limit (GFR Rule 64).
          </p>
        </div>
      </div>

      {/* Main Recharts Line Chart Container with Interactive Tooltip */}
      <div className="h-72 sm:h-80 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={monthlySeasonalityData}
            margin={{ top: 15, right: 20, left: -10, bottom: 15 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length) {
                setPinnedMonth(state.activePayload[0].payload);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              tickFormatter={(val) => `₹${val}`}
            />
            <Tooltip
              content={<InteractiveCustomTooltip />}
              wrapperStyle={{ pointerEvents: 'auto', outline: 'none', zIndex: 100 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '16px', fontSize: '12px' }}
              iconType="circle"
              iconSize={8}
            />

            {/* Reference Line for Current Month Sep */}
            <ReferenceLine
              x="Sep"
              stroke="#3f3f46"
              strokeDasharray="4 4"
              label={{ value: 'Current Month', fill: '#a1a1aa', fontSize: 10, position: 'top' }}
            />

            {viewType === 'RUN_RATE' ? (
              <>
                {/* 5-Year Historical Baseline Pattern */}
                {showBenchmark && (
                  <Line
                    type="monotone"
                    dataKey="historicalBaseline"
                    name="5-Yr Historical Seasonal Baseline"
                    stroke="#71717a"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}

                {/* Projected Trajectory (Full year dashed) */}
                <Line
                  type="monotone"
                  dataKey="projected"
                  name="Projected Seasonal Curve"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 1 }}
                  activeDot={{ r: 7, stroke: '#8b5cf6', strokeWidth: 2 }}
                />

                {/* Actual Recorded Spending (Solid Emerald for active months) */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual Monthly Expenditure"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#064e3b' }}
                  activeDot={{ r: 8, stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls={false}
                />
              </>
            ) : (
              <>
                {/* Cumulative Historical Benchmark */}
                {showBenchmark && (
                  <Line
                    type="monotone"
                    dataKey="cumulativeHistorical"
                    name="5-Yr Historical Cumulative"
                    stroke="#71717a"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                )}

                {/* Cumulative Projected Trajectory */}
                <Line
                  type="monotone"
                  dataKey="cumulativeProjected"
                  name="Projected Total Trajectory"
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#8b5cf6' }}
                />

                {/* Cumulative Actual Recorded */}
                <Line
                  type="monotone"
                  dataKey="cumulativeActual"
                  name="Cumulative Actual Disbursed"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  connectNulls={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pinned Month Category Breakdown Detail Panel (when a month is pinned) */}
      {pinnedMonth && (
        <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-indigo-500/40 animate-fadeIn shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Pin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Pinned Month Inspection: {pinnedMonth.fullName}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
                    {pinnedMonth.quarter} • Index {pinnedMonth.seasonalIndex}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Total Monthly Disbursement: <strong className="text-emerald-400 font-mono">₹{pinnedMonth.effectiveTotal.toLocaleString('en-IN')} Cr</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onAskAI && (
                <button
                  onClick={() =>
                    onAskAI(
                      `Analyze the category breakdown of ${pinnedMonth.fullName} in detail: Capex ₹${pinnedMonth.categorySpending[0].amount} Cr (${pinnedMonth.categorySpending[0].percentage}%), DBT Welfare ₹${pinnedMonth.categorySpending[1].amount} Cr (${pinnedMonth.categorySpending[1].percentage}%), CSS Grants ₹${pinnedMonth.categorySpending[2].amount} Cr (${pinnedMonth.categorySpending[2].percentage}%). Provide statutory advice on utilization velocity.`
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ask AI Analysis</span>
                </button>
              )}
              <button
                onClick={() => setPinnedMonth(null)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition-colors border border-zinc-800 flex items-center gap-1.5 cursor-pointer"
              >
                <PinOff className="w-3.5 h-3.5" />
                <span>Unpin</span>
              </button>
            </div>
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pinnedMonth.categorySpending.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color,
                      borderColor: `${cat.color}40`,
                    }}
                  >
                    {cat.percentage}% of Month
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{cat.trendBadge}</span>
                </div>
                <div className="text-xs font-bold text-zinc-100">{cat.name}</div>
                <div
                  className="text-base font-black font-mono mt-1"
                  style={{ color: cat.color }}
                >
                  ₹{cat.amount.toLocaleString('en-IN')} Cr
                </div>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-snug">{cat.driver}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seasonality Insights and Analytical Notes */}
      <div className="mt-4 pt-4 border-t border-zinc-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex items-start gap-2 text-zinc-300">
          <CloudRain className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-zinc-100 block">Monsoon Expenditure Contraction:</strong>
            Civil engineering contracts drop by ~21% in July–September due to ground waterlogging. Resumption occurs promptly in October.
          </div>
        </div>

        <div className="flex items-start gap-2 text-zinc-300">
          <Flame className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-zinc-100 block">Q4 March Rush Surveillance:</strong>
            March projection of ₹{peakMonth.projected} Cr represents 13.6% of annual budget. Monitored strictly under GFR Rule 64 to avoid fund lapsing.
          </div>
        </div>

        <div className="flex items-start gap-2 text-zinc-300">
          <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-zinc-100 block">Current Velocity:</strong>
            Tracking at ₹{averageMonthlyBurn} Cr/month (6.4% above 5-year historical median), driven by infrastructure capex acceleration.
          </div>
        </div>
      </div>

      {/* Footer controls & toggles */}
      <div className="mt-4 pt-3 border-t border-zinc-800/50 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-zinc-400 gap-2">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-zinc-200">
            <input
              type="checkbox"
              checked={showBenchmark}
              onChange={(e) => setShowBenchmark(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0 w-3.5 h-3.5"
            />
            <span>Show 5-Year Historical Baseline</span>
          </label>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400 flex items-center gap-1">
            <MousePointerClick className="w-3 h-3 text-indigo-400" />
            Click any point to pin category breakdown
          </span>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('/ai-forecast')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Detailed AI Predictive Modeling</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
