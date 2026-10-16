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
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-info-light text-info-fg',
  accepted: 'bg-success-light text-success-fg',
  rejected: 'bg-danger-light text-danger-fg',
  expired: 'bg-warning-light text-warning-fg',
  requested: 'bg-warning-light text-warning-fg',
  confirmed: 'bg-info-light text-info-fg',
  scheduled: 'bg-info-light text-info-fg',
  arrived: 'bg-info-light text-info-fg',
  checked_in: 'bg-info-light text-info-fg',
  provider_completed: 'bg-warning-light text-warning-fg',
  assigned: 'bg-info-light text-info-fg',
  in_progress: 'bg-info-light text-info-fg',
  awaiting_customer: 'bg-warning-light text-warning-fg',
  customer_confirmed: 'bg-success-light text-success-fg',
  disputed: 'bg-danger-light text-danger-fg',
  no_show: 'bg-warning-light text-warning-fg',
  producing: 'bg-info-light text-info-fg',
  allocating: 'bg-info-light text-info-fg',
  handed_over: 'bg-success-light text-success-fg',
  successful: 'bg-success-light text-success-fg',
  held: 'bg-warning-light text-warning-fg',
  released: 'bg-info-light text-info-fg',
  paid_out: 'bg-success-light text-success-fg',
  verification_required: 'bg-warning-light text-warning-fg',
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
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize leading-none ${styles} ${className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {formatStatus(key)}
    </span>
  );
}

export default StatusBadge;
