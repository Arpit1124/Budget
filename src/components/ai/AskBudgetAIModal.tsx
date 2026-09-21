import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ShieldAlert,
  FileText,
  HelpCircle,
  CheckCircle2,
  Star,
  ShieldCheck,
  Check,
  MessageSquareHeart,
} from 'lucide-react';
import { BudgetAIMark } from '../common/BudgetAILogo';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: string;
  references?: string[];
}

interface ResponseFeedback {
  rating: number;
  quality: string;
  notes?: string;
  submittedAt: string;
}

export const AskBudgetAIModal: React.FC = () => {
  const { isAskAIOpen, setIsAskAIOpen, recordAuditAction, addToast } = useApp();
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, ResponseFeedback>>({});
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [currentRating, setCurrentRating] = useState<number>(5);
  const [currentNotes, setCurrentNotes] = useState<string>('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'ai',
      text: 'Namaste. I am BudgetAI Gov, your public budget utilization and financial risk assistant. Ask me questions regarding department allocations, project physical/financial progress, anomalous vouchers, or spending forecasts.',
      timestamp: 'Active Now',
      source: 'Grounded Financial Engine',
      references: ['PFMS Database 2026–27', 'Union Expenditure Ledger'],
    },
  ]);

  const quickPrompts = [
    'How much of the education budget has been utilized?',
    'Which departments have utilization below 60%?',
    'Show projects with high financial risk',
    'Summarize this month\'s expenditure',
    'What anomalies were detected recently?',
  ];

  if (!isAskAIOpen) return null;

  const handleSubmitFeedback = (msgId: string) => {
    const qualityLabel =
      currentRating >= 5
        ? 'EXEMPLARY_COMPLIANT'
        : currentRating >= 4
        ? 'ACCURATE'
        : currentRating >= 3
        ? 'ACCEPTABLE'
        : 'NEEDS_REVISION';

    const feedbackEntry: ResponseFeedback = {
      rating: currentRating,
      quality: qualityLabel,
      notes: currentNotes.trim() || undefined,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setFeedbackMap(prev => ({ ...prev, [msgId]: feedbackEntry }));
    setActiveFeedbackId(null);
    setCurrentNotes('');

    recordAuditAction({
      action: 'AI_RESPONSE_FEEDBACK_RECORDED',
      category: 'SECURITY',
      description: `User verified AI explanation (${msgId}) with rating ${currentRating}/5 stars (${qualityLabel}) for compliance audit tracking. Notes: ${currentNotes || 'None'}`,
      recordType: 'AI_EXPLANATION_QUALITY',
      newValue: `${currentRating}/5 Stars (${qualityLabel})`,
      status: 'VERIFIED',
    });

    addToast(
      'Compliance Feedback Recorded',
      `Logged explanation quality rating (${currentRating}/5 stars) in official audit trail.`,
      'SUCCESS'
    );
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.answer || 'I could not retrieve an answer for that inquiry.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source === 'GEMINI_LIVE' ? 'Google Gemini 3.8 Live API' : 'Grounded Decision-Support Engine',
        references: data.dataReferences || ['Central Budget Register'],
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'The AI service encountered a temporary connection issue. However, verified departmental metrics remain accessible across your dashboard.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'Offline Diagnostics',
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[650px] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-cyan-500/30 flex items-center justify-center shadow-xs">
              <BudgetAIMark size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Ask Budget<span className="text-white">AI</span></span>
                <span className="text-[10px] bg-cyan-500/20 text-[#00C9C8] font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                  Gov Assistant
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Grounded Financial Intelligence & GFR 2017 Audit Guidance
              </p>
            </div>
          </div>
          <button
            id="btn-close-ask-ai"
            onClick={() => setIsAskAIOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ethical / Governance Notice */}
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span>
            AI outputs are advisory recommendations for review. Always cross-verify with authorized PFMS records.
          </span>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-xl p-3.5 text-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

                {msg.references && msg.references.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 mb-1">
                      <FileText className="w-3 h-3" /> Data Grounding References:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {msg.references.map((ref, idx) => (
                        <li key={idx}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div
                  className={`mt-1.5 text-[10px] flex items-center justify-between ${
                    msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <span>{msg.source || (msg.sender === 'user' ? 'You' : 'BudgetAI Engine')}</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* AI Response Compliance Feedback Section */}
                {msg.sender === 'ai' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/80">
                    {feedbackMap[msg.id] ? (
                      <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            Compliance Rating: {feedbackMap[msg.id].rating}/5 Stars (
                            {feedbackMap[msg.id].quality.replace(/_/g, ' ')})
                          </span>
                        </div>
                        <span className="text-[9px] font-mono opacity-80">Audit Logged</span>
                      </div>
                    ) : (
                      <div>
                        {activeFeedbackId !== msg.id ? (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              Advisory Quality Review
                            </span>
                            <button
                              id={`btn-provide-feedback-${msg.id}`}
                              onClick={() => {
                                setActiveFeedbackId(msg.id);
                                setCurrentRating(5);
                                setCurrentNotes('');
                              }}
                              className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                            >
                              <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>Provide Feedback</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-white dark:bg-slate-750 rounded-lg border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-2 text-slate-800 dark:text-slate-200 mt-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-blue-600" />
                                Rate AI Explanation Quality (Compliance Record)
                              </span>
                              <button
                                onClick={() => setActiveFeedbackId(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                              >
                                ✕
                              </button>
                            </div>

                            {/* 5-Star Rating Buttons */}
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setCurrentRating(star)}
                                  className="p-1 hover:scale-110 transition-transform"
                                  title={`${star} Star${star > 1 ? 's' : ''}`}
                                >
                                  <Star
                                    className={`w-4 h-4 ${
                                      star <= currentRating
                                        ? 'text-amber-400 fill-amber-400'
                                        : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                  />
                                </button>
                              ))}
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 ml-1.5">
                                {currentRating === 5
                                  ? 'Exemplary / GFR Compliant'
                                  : currentRating === 4
                                  ? 'Accurate'
                                  : currentRating === 3
                                  ? 'Acceptable'
                                  : currentRating === 2
                                  ? 'Needs Clarification'
                                  : 'Inaccurate / Irrelevant'}
                              </span>
                            </div>

                            {/* Compliance Note Input */}
                            <input
                              type="text"
                              value={currentNotes}
                              onChange={e => setCurrentNotes(e.target.value)}
                              placeholder="Optional verification note (e.g., cross-verified with GFR sanction)..."
                              className="w-full px-2 py-1 text-[11px] rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setActiveFeedbackId(null)}
                                className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                              >
                                Cancel
                              </button>
                              <button
                                id={`btn-submit-feedback-${msg.id}`}
                                type="button"
                                onClick={() => handleSubmitFeedback(msg.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                              >
                                <Check className="w-3 h-3" />
                                <span>Submit Official Rating</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs italic">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing central budget ledgers & anomaly records...</span>
            </div>
          )}
        </div>

        {/* Quick Question Prompts */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Suggested Official Queries:
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="input-ask-ai-query"
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="Ask about expenditure trends, risk scores, progress mismatch..."
              disabled={loading}
              className="flex-1 px-3.5 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            <button
              id="btn-send-ask-ai"
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
