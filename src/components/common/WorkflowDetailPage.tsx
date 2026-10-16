import { userMessage } from '@/lib/userMessage';
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';

type DetailProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  loading?: boolean;
  available?: boolean;
  error?: unknown;
  busy?: boolean;
};

/** Long records use the shell's normal page scroll, never an overlay. */
export function WorkflowDetailPage({ open, onOpenChange, children, loading = false, available = true, error, busy = false }: DetailProps) {
  const pageRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open || loading) return;
    const scroller = pageRef.current?.closest('#account-main, #portal-main');
    if (scroller) scroller.scrollTop = 0;
    pageRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }, [open, loading, available]);
  if (!open) return null;
  return <section ref={pageRef} className="workflow-record-page" aria-label="Record details">
    <button type="button" className="workflow-back-link" disabled={busy} onClick={() => onOpenChange(false)}><WorkflowIcon name="arrowRight" className="rotate-180" />Back to list</button>
    {loading ? <div className="workflow-record-placeholder" role="status"><h1 tabIndex={-1}>Loading details</h1><p>Please wait while we retrieve this record.</p></div>
      : error || !available ? <div className="workflow-record-placeholder" role="alert"><h1 tabIndex={-1}>Details unavailable</h1><p>{userMessage(error, 'This record is unavailable in the current list or selected business. Return to the list and choose a record.')}</p></div>
      : children}
  </section>;
}

export function WorkflowDetailContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`workflow-record-content ${className}`} {...props} />;
}
export function WorkflowDetailHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <header className={`workflow-record-header ${className}`} {...props} />;
}
export function WorkflowDetailTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 tabIndex={-1} className={`workflow-record-title ${className}`} {...props} />;
}
export function WorkflowDetailBody({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`workflow-record-body ${className}`} {...props} />;
}
export function WorkflowDetailFooter({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <footer className={`workflow-record-footer ${className}`} {...props} />;
}
