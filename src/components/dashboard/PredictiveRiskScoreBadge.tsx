import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, TrendingUp, Calendar, Zap, ShieldAlert } from 'lucide-react';

interface PredictiveRiskScoreBadgeProps {
  allocatedBudget: number;
  spent: number;
  financialProgress?: number;
  physicalProgress?: number;
  quarterName?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const PredictiveRiskScoreBadge: React.FC<PredictiveRiskScoreBadgeProps> = ({
  allocatedBudget,
  spent,
  financialProgress,
  physicalProgress,
  quarterName = 'Q4 FY 2025-26',
  size = 'sm',
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Quarterly timeline assumption (Day 72 of 90, Q4 sprint)
  const totalQuarterDays = 90;
  const elapsedDays = 71;
  const remainingDays = totalQuarterDays - elapsedDays; // 19 days remaining

  const currentBurnRate = spent / Math.max(1, elapsedDays); // Cr per day
  const projectedTotalSpend = spent + currentBurnRate * remainingDays;
  const projectedShortfall = Math.max(0, projectedTotalSpend - allocatedBudget);

  // Calculate deficit probability (0 - 100%)
  let calculatedRisk = 0;
  if (projectedTotalSpend > allocatedBudget) {
    const overrunRatio = (projectedTotalSpend - allocatedBudget) / Math.max(1, allocatedBudget);
    calculatedRisk = Math.min(98, Math.round(55 + overrunRatio * 80));
  } else {
    const safetyBufferRatio = (allocatedBudget - projectedTotalSpend) / Math.max(1, allocatedBudget);
    calculatedRisk = Math.max(8, Math.round(45 - safetyBufferRatio * 60));
  }

  // Factor in physical progress lag if present
  if (
    financialProgress !== undefined &&
    physicalProgress !== undefined &&
    financialProgress - physicalProgress >= 15
  ) {
    calculatedRisk = Math.min(99, calculatedRisk + 12);
  }

  // Estimated exhaustion day
  const daysUntilExhaustion = currentBurnRate > 0 ? (allocatedBudget - spent) / currentBurnRate : 999;
  const willExhaustBeforeQuarterEnd = daysUntilExhaustion < remainingDays;
  const exhaustionDaysFromNow = Math.max(1, Math.round(daysUntilExhaustion));

  const isCritical = calculatedRisk >= 75;
  const isHigh = calculatedRisk >= 50 && calculatedRisk < 75;
  const isModerate = calculatedRisk >= 25 && calculatedRisk < 50;

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider transition-all cursor-pointer select-none ${
          size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        } ${
          isCritical
            ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 shadow-xs shadow-rose-950/40'
            : isHigh
            ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40'
            : isModerate
            ? 'bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/30'
            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
        }`}
      >
        {isCritical ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <AlertCircle className="w-3 h-3" />
            <span>{calculatedRisk}% Deficit Risk</span>
          </>
        ) : isHigh ? (
          <>
            <AlertTriangle className="w-3 h-3" />
            <span>{calculatedRisk}% Deficit Risk</span>
          </>
        ) : isModerate ? (
          <>
            <TrendingUp className="w-3 h-3" />
            <span>{calculatedRisk}% Risk</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3 h-3" />
            <span>{calculatedRisk}% Safe</span>
          </>
        )}
      </button>

      {/* Floating Detailed Risk Breakdown Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-700 shadow-2xl text-left text-xs space-y-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert
                className={`w-4 h-4 ${
                  isCritical ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-emerald-400'
                }`}
              />
              <span className="font-bold text-white tracking-tight">
                Quarterly Deficit Prediction
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">{quarterName}</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Deficit Likelihood:</span>
              <span
                className={`font-bold ${
                  isCritical ? 'text-rose-400' : isHigh ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {calculatedRisk}% ({isCritical ? 'Critical Overrun' : isHigh ? 'High Risk' : 'Within Budget'})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Burn Velocity:</span>
              <span className="font-mono text-zinc-200">₹{currentBurnRate.toFixed(2)} Cr/day</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Projected Q-End Spend:</span>
              <span className="font-mono text-zinc-200">
                ₹{projectedTotalSpend.toFixed(1)} Cr / ₹{allocatedBudget} Cr
              </span>
            </div>

            {projectedShortfall > 0 ? (
              <div className="flex items-center justify-between text-rose-300 font-semibold pt-1 border-t border-zinc-800/80">
                <span>Anticipated Shortfall:</span>
                <span className="font-mono font-bold">₹{projectedShortfall.toFixed(2)} Cr</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-emerald-300 font-semibold pt-1 border-t border-zinc-800/80">
                <span>Estimated Cushion:</span>
                <span className="font-mono font-bold">
                  ₹{(allocatedBudget - projectedTotalSpend).toFixed(2)} Cr
                </span>
              </div>
            )}

            {willExhaustBeforeQuarterEnd && (
              <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-900/60 text-[10px] text-rose-300">
                <span className="font-bold block">⚠️ Budget Depletion Alert:</span>
                At current velocity, allocation will be exhausted in ~{exhaustionDaysFromNow} days ({remainingDays - exhaustionDaysFromNow} days before quarter closes).
              </div>
            )}
          </div>

          <div className="text-[10px] text-zinc-400 bg-zinc-900 p-2 rounded-xl border border-zinc-800">
            <span className="font-bold text-zinc-300">AI Mitigation: </span>
            {isCritical
              ? 'Trigger GFR Rule 10 Re-appropriation or seek Supplementary Grant approval.'
              : isHigh
              ? 'Cap discretionary procurement tranches and review running account bills.'
              : 'Disbursements tracking along expected linear fiscal profile.'}
          </div>
        </div>
      )}
    </div>
  );
};
