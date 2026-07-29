import { DINE_IN_STATUS_LABELS, STATUS_LABELS } from '@/lib/workflows';

type Step = { key: string; label: string; statuses: string[] };

const DINE_IN_STEPS: Step[] = [
  { key: 'received', label: 'Received', statuses: ['pending_payment', 'paid'] },
  { key: 'preparing', label: 'Preparing', statuses: ['preparing'] },
  { key: 'ready', label: 'Ready to serve', statuses: ['ready_for_dispatch'] },
  { key: 'served', label: 'Served', statuses: ['completed'] },
];

const FOOD_STEPS: Step[] = [
  { key: 'received', label: 'Received', statuses: ['pending_payment', 'paid'] },
  { key: 'preparing', label: 'Preparing', statuses: ['preparing'] },
  { key: 'ready', label: 'Ready', statuses: ['ready_for_dispatch'] },
  { key: 'out', label: 'Out for delivery', statuses: ['dispatched'] },
  { key: 'done', label: 'Completed', statuses: ['completed'] },
];

const PICKUP_STEPS: Step[] = [
  { key: 'received', label: 'Received', statuses: ['pending_payment', 'paid'] },
  { key: 'preparing', label: 'Preparing', statuses: ['preparing'] },
  { key: 'ready', label: 'Ready for pickup', statuses: ['ready_for_dispatch', 'dispatched'] },
  { key: 'done', label: 'Completed', statuses: ['completed'] },
];

function stepsForOrder(order, dineInMode: boolean): Step[] {
  if (dineInMode || order?.fulfillment_type === 'dine_in') return DINE_IN_STEPS;
  if (order?.fulfillment_type === 'self_pickup' || order?.fulfillment_type === 'pickup') {
    return PICKUP_STEPS;
  }
  return FOOD_STEPS;
}

function stepIndex(steps: Step[], status: string): number {
  const idx = steps.findIndex((s) => s.statuses.includes(status));
  return idx >= 0 ? idx : 0;
}

export function OrderStatusTracker({
  order,
  dineInMode = false,
  compact = false,
}: {
  order: { status?: string; fulfillment_type?: string };
  dineInMode?: boolean;
  compact?: boolean;
}) {
  if (!order?.status) return null;

  const status = order.status;
  const cancelled = status === 'cancelled';
  const steps = stepsForOrder(order, dineInMode);
  const activeIdx = stepIndex(steps, status);
  const labels = dineInMode || order.fulfillment_type === 'dine_in' ? DINE_IN_STATUS_LABELS : STATUS_LABELS;
  const currentLabel = labels[status] ?? STATUS_LABELS[status] ?? status.replace(/_/g, ' ');

  if (cancelled) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center">
        <p className="text-sm font-semibold text-red-800">Order cancelled</p>
      </div>
    );
  }

  const done = status === 'completed';

  return (
    <div className={`rounded-2xl border border-cream-dark bg-white ${compact ? 'p-4' : 'p-5'} shadow-sm`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-charcoal">Order progress</p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            done ? 'bg-sage text-forest' : 'bg-amber-50 text-amber-900'
          }`}
        >
          {currentLabel}
        </span>
      </div>

      <ol className="flex items-start justify-between gap-1">
        {steps.map((step, i) => {
          const isDone = i < activeIdx || (i === activeIdx && done);
          const isActive = i === activeIdx && !done;
          return (
            <li key={step.key} className="flex min-w-0 flex-1 flex-col items-center text-center">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                  isDone
                    ? 'bg-forest text-cream'
                    : isActive
                      ? 'bg-forest/15 text-forest ring-2 ring-forest/40'
                      : 'bg-cream-dark text-forest-muted'
                }`}
                aria-hidden="true"
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span
                className={`mt-1.5 hidden text-[10px] leading-tight sm:block ${
                  isActive || isDone ? 'font-medium text-forest' : 'text-forest-muted'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Connector bars — mobile-friendly strip under dots */}
      <div className="mt-2 flex gap-0.5 sm:hidden">
        {steps.map((step, i) => (
          <div
            key={`bar-${step.key}`}
            className={`h-1 flex-1 rounded-full ${i <= activeIdx ? 'bg-forest' : 'bg-cream-dark'}`}
          />
        ))}
      </div>

      {!done && (
        <p className="mt-4 text-center text-xs text-forest-muted">
          {dineInMode || order.fulfillment_type === 'dine_in'
            ? 'We update this automatically while the kitchen prepares your order.'
            : 'Status updates automatically — no need to refresh.'}
        </p>
      )}
    </div>
  );
}

export default OrderStatusTracker;
