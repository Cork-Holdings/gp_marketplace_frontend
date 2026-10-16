import { useEffect, useState, useSyncExternalStore } from 'react';
import { dismissToast, feedbackStore, showToast } from '@/lib/actionFeedback';

export function ToastNotice({ message }: { message: string | null | undefined }) {
  useEffect(() => { if (message) showToast(message); }, [message]);
  return null;
}

export function ActionFeedback() {
  const { pending, toast } = useSyncExternalStore(feedbackStore.subscribe, feedbackStore.getSnapshot);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!toast || paused) return;
    const timer = window.setTimeout(() => dismissToast(toast.id), toast.tone === 'error' ? 12000 : 7000);
    return () => window.clearTimeout(timer);
  }, [toast, paused]);
  return <>
    {pending > 0 && <div role="status" aria-live="polite" className="fixed inset-x-0 top-0 z-[110] flex items-center justify-center gap-2 border-b border-forest/20 bg-white px-4 py-2 text-sm font-medium text-forest shadow-sm">
      <span className="h-4 w-4 rounded-full border-2 border-forest/25 border-t-forest motion-safe:animate-spin" aria-hidden="true" />Submitting changes…
    </div>}
    <div className="pointer-events-none fixed inset-x-3 top-16 z-[120] mx-auto w-auto max-w-md sm:left-auto sm:right-6 sm:mx-0 sm:w-full" aria-live="polite" aria-atomic="true">
      {toast && <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${toast.tone === 'error' ? 'border-danger-fg/30' : 'border-forest/20'}`}>
        <svg className={`mt-0.5 h-5 w-5 shrink-0 ${toast.tone === 'error' ? 'text-danger-fg' : 'text-forest'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" />{toast.tone === 'error' ? <path d="M12 7v6m0 3h.01" /> : <path d="m7 12 3 3 7-7" />}</svg>
        <p className="min-w-0 flex-1 break-words text-sm leading-relaxed text-charcoal">{toast.message}</p>
        <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification" className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-forest-muted hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest"><span aria-hidden="true">×</span></button>
      </div>}
    </div>
  </>;
}
