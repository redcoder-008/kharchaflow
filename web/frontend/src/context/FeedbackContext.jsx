import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const FeedbackContext = createContext(null);

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) throw new Error("useFeedback must be used inside FeedbackProvider.");
  return context;
}

const toneStyles = {
  danger: { icon: AlertTriangle, iconClass: "text-rose-400 bg-rose-500/10", actionClass: "bg-rose-500 hover:bg-rose-400 text-white" },
  success: { icon: CheckCircle2, iconClass: "text-emerald-400 bg-emerald-500/10", actionClass: "bg-emerald-500 hover:bg-emerald-400 text-zinc-950" },
  info: { icon: Info, iconClass: "text-indigo-400 bg-indigo-500/10", actionClass: "bg-indigo-500 hover:bg-indigo-400 text-white" }
};

export function FeedbackProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState(null);

  const confirm = useCallback((options) => new Promise((resolve) => {
    setDialog({
      title: "Please confirm",
      message: "Are you sure you want to continue?",
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      tone: "danger",
      ...options,
      resolve
    });
  }), []);

  const notify = useCallback((message, tone = "info") => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!dialog) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        dialog.resolve(false);
        setDialog(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog]);

  const closeDialog = (confirmed) => {
    dialog?.resolve(confirmed);
    setDialog(null);
  };

  const dialogStyle = toneStyles[dialog?.tone] || toneStyles.danger;
  const DialogIcon = dialogStyle.icon;
  const toastStyle = toneStyles[toast?.tone] || toneStyles.info;
  const ToastIcon = toastStyle.icon;

  return (
    <FeedbackContext.Provider value={{ confirm, notify }}>
      {children}

      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirmation-title">
          <button className="absolute inset-0 cursor-default" onClick={() => closeDialog(false)} aria-label="Close confirmation" />
          <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6 shadow-2xl animate-slide-up">
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${dialogStyle.iconClass}`}><DialogIcon className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h2 id="confirmation-title" className="text-base font-bold text-white">{dialog.title}</h2>
                  <button onClick={() => closeDialog(false)} className="p-1 text-zinc-500 hover:text-zinc-200 rounded-lg" aria-label="Close"><X className="w-4 h-4" /></button>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">{dialog.message}</p>
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                  <button onClick={() => closeDialog(false)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:border-zinc-700">{dialog.cancelLabel}</button>
                  <button onClick={() => closeDialog(true)} className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${dialogStyle.actionClass}`}>{dialog.confirmLabel}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed z-[101] left-4 right-4 bottom-5 sm:left-auto sm:right-6 sm:bottom-6 sm:w-full sm:max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/95 backdrop-blur p-4 shadow-2xl animate-slide-up" role="status">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${toastStyle.iconClass}`}><ToastIcon className="w-4 h-4" /></div>
            <p className="flex-1 pt-1 text-xs font-semibold leading-relaxed text-zinc-200">{toast.message}</p>
            <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-zinc-200" aria-label="Dismiss"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
