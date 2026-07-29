import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTo?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-cream-dark bg-cream/40 px-6 py-10 text-center">
      {icon && (
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-forest-muted">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-charcoal">{title}</p>
      {description && <p className="mt-1 text-xs text-forest-muted">{description}</p>}
      {actionLabel && actionTo && (
        <Button asChild className="mt-4" size="sm">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      )}
      {actionLabel && onAction && !actionTo && (
        <Button type="button" className="mt-4" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
