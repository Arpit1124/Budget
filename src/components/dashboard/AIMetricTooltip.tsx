import React, { useState } from 'react';
import { Sparkles, Bot, ArrowRight, X, CheckCircle2, TrendingUp, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface AIMetricInsight {
  metricName: string;
  metricValue: string;
  trendDirection: 'UP' | 'DOWN' | 'STABLE' | 'WARNING';
  groundedSummary: string;
  keyDrivers: string[];
  fiscalRecommendation: string;
  queryPrompt: string;
}

interface AIMetricTooltipProps {
  insight: AIMetricInsight;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
}

export const AIMetricTooltip: React.FC<AIMetricTooltipProps> = ({
  insight,
  position = 'top',
  children,
}) => {
  const { setIsAskAIOpen, recordAuditAction } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAIExplanation = async () => {
    setIsLoading(true);
    setAiResponse(null);

    // Record audit event for compliance
    recordAuditAction({
      action: 'AI_METRIC_INSIGHT_ACCESSED',
      category: 'MODIFICATION',
      description: `User requested AI natural language explanation for metric '${insight.metricName}' (${insight.metricValue}).`,
      recordType: 'DASHBOARD_METRIC',
      newValue: insight.metricValue,
      status: 'VERIFIED',
    });

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: insight.queryPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.answer) {
          setAiResponse(data.answer);
          setIsLoading(false);
          return;
        }
      }
      // Fallback to grounded summary
      setAiResponse(insight.groundedSummary);
    } catch {
      setAiResponse(insight.groundedSummary);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && !aiResponse) {
      fetchAIExplanation();
    }
  };

  const handleOpenFullChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsAskAIOpen(true);
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Interactive Trigger Button */}
      <button
        type="button"
        onClick={handleClick}
        className="group/ai relative flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 transition-all text-[10px] font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
        title="Click for AI natural language explanation of this metric"
        aria-label={`Get AI explanation for ${insight.metricName}`}
      >
        <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
        <span className="truncate">AI Trend Insight</span>

        {/* Hover Tooltip Hint */}
        <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/ai:opacity-100 transition-opacity bg-zinc-900 text-white text-[9px] px-2 py-1 rounded-md whitespace-nowrap shadow-lg border border-zinc-700 z-30">
          Click for Natural Language Explanation
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={`AI analysis of ${insight.metricName}`}
          className="fixed inset-0 sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2 z-50 w-full sm:w-96 max-w-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-indigo-500/40 rounded-2xl shadow-2xl p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                  AI Financial Analyst
                </span>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                  {insight.metricName} Analysis
                </h4>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close insight"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metric Snapshot */}
          <div className="my-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Current Status:</span>
            <span className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5">
              {insight.trendDirection === 'UP' && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
              {insight.trendDirection === 'WARNING' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              {insight.metricValue}
            </span>
          </div>

          {/* Natural Language Explanation */}
          <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-2 mb-3">
            {isLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-[11px]">Analyzing Union fiscal ledger & trends...</span>
              </div>
            ) : (
              <>
                <p className="bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-200/50 dark:border-indigo-800/40 text-[11px] leading-relaxed">
                  {aiResponse || insight.groundedSummary}
                </p>

                {/* Key Drivers */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
                    Key Fiscal Drivers:
                  </span>
                  <ul className="space-y-1">
                    {insight.keyDrivers.map((driver, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                        <span>{driver}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Compliance Advisory */}
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mb-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Recommended Action:
                  </span>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 italic">
                    {insight.fiscalRecommendation}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              onClick={handleOpenFullChat}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Ask Follow-up in AI Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
