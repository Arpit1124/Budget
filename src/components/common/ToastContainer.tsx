import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map(toast => {
        const isSuccess = toast.type === 'SUCCESS';
        const isError = toast.type === 'ERROR';
        const isWarning = toast.type === 'WARNING';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3 transition-all animate-fadeIn ${
              isSuccess
                ? 'bg-zinc-900/95 border-emerald-500/40 text-white'
                : isError
                ? 'bg-zinc-900/95 border-rose-500/40 text-white'
                : isWarning
                ? 'bg-zinc-900/95 border-amber-500/40 text-white'
                : 'bg-zinc-900/95 border-indigo-500/40 text-white'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertOctagon className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold truncate text-white">{toast.title}</h4>
                <span className="text-[10px] text-zinc-500 font-mono">{toast.timestamp}</span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-white transition-colors shrink-0 -mr-1 -mt-1 p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
