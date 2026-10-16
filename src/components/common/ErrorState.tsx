import { userMessage } from '@/lib/userMessage';
import { ApiError } from '../../lib/api/crud';
import { WorkflowIcon } from './WorkflowIcon';

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }: ErrorStateProps) {
  const isOffline = error instanceof ApiError && error.code === 'OFFLINE';
  const message = userMessage(error);

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger-light/30 px-6 py-8 text-center"
      role="alert"
    >
      <div className="text-danger-fg" aria-hidden="true"><WorkflowIcon name="document" size={24} /></div>
      <h3 className="text-base font-semibold text-charcoal">{isOffline ? 'You appear to be offline' : title}</h3>
      <p className="max-w-prose break-words text-sm leading-relaxed text-forest-muted">{isOffline ? 'Reconnect, then try again. Your entered details remain on this page.' : message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 min-h-[44px] rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
        >
          Try again
        </button>
      )}
    </div>
  );
}
