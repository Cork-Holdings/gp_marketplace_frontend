const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-warning-light text-warning-fg',
  pending: 'bg-warning-light text-warning-fg',
  paid: 'bg-info-light text-info-fg',
  preparing: 'bg-info-light text-info-fg',
  ready: 'bg-primary/15 text-primary',
  ready_for_dispatch: 'bg-primary/15 text-primary',
  ready_for_pickup: 'bg-primary/15 text-primary',
  dispatched: 'bg-info-light text-info-fg',
  out_for_delivery: 'bg-info-light text-info-fg',
  fulfilled: 'bg-success-light text-success-fg',
  completed: 'bg-success-light text-success-fg',
  served: 'bg-success-light text-success-fg',
  success: 'bg-success-light text-success-fg',
  failed: 'bg-danger-light text-danger-fg',
  cancelled: 'bg-danger-light text-danger-fg',
  canceled: 'bg-danger-light text-danger-fg',
  refunded: 'bg-muted text-muted-foreground',
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ');
}

export function StatusBadge({
  status,
  className = '',
}: {
  status?: string | null;
  className?: string;
}) {
  const key = (status ?? 'pending').toLowerCase();
  const styles = STATUS_STYLES[key] ?? 'bg-muted text-muted-foreground';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles} ${className}`}
    >
      {formatStatus(key)}
    </span>
  );
}

export default StatusBadge;
