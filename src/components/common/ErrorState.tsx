import { ApiError } from '../../lib/api/crud';

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }: ErrorStateProps) {
  const isOffline = error instanceof ApiError && error.code === 'OFFLINE';
  const message = error instanceof Error ? error.message : 'An unexpected error occurred.';

  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center"
      role="alert"
    >
      <div className="mb-2 text-3xl" aria-hidden="true">
        {isOffline ? '📡' : '⚠️'}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-red-800">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 active:scale-95"
        >
          Try again
        </button>
      )}
    </div>
  );
}
