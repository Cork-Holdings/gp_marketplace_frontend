import { useEffect, useState } from 'react';
import { formatCurrency, formatOrderTime } from '@/lib/utils';
import { STATUS_LABELS } from '@/lib/workflows';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/shared/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ownerApi } from '@/lib/api/services';
import { useMarketplace } from '@/lib/context/useMarketplace';

function modifiersFromItem(item) {
  const attrs = item?.variant_attributes ?? {};
  const extra = attrs.extra ?? attrs.Extra ?? {};
  const mods = extra.modifiers ?? item?.modifiers ?? [];
  if (!Array.isArray(mods)) return [];
  return mods.map((m) => (typeof m === 'string' ? m : m.name ?? m.label)).filter(Boolean);
}

function fulfillmentLabel(order) {
  if (order.fulfillment_type === 'dine_in') return 'Dine-in';
  if (order.fulfillment_type === 'delivery') return 'Delivery';
  return 'Pickup';
}

function deliveryAddressLine(order) {
  const addr = order?.delivery_address;
  if (!addr) return null;
  const parts = [addr.line1, addr.city].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

function OrderItemsList({ items, loading, error, limit = null }) {
  if (loading) {
    return (
      <div className="mt-3 rounded-lg border border-cream-dark bg-cream/40 px-3 py-2.5">
        <p className="text-sm text-forest-muted">Loading items…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
        <p className="text-sm text-red-700">Could not load items.</p>
      </div>
    );
  }
  if (!items?.length) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-cream-dark px-3 py-2.5">
        <p className="text-sm text-forest-muted">No line items.</p>
      </div>
    );
  }

  const visible = limit ? items.slice(0, limit) : items;
  const remaining = limit && items.length > limit ? items.length - limit : 0;

  return (
    <ul className="mt-3 space-y-2 rounded-lg border border-cream-dark bg-cream/30 px-3 py-2.5">
      {visible.map((item) => {
        const name = item.product_name ?? item.name ?? 'Item';
        const mods = modifiersFromItem(item);
        const notes = item.item_notes;
        return (
          <li key={item.id ?? `${name}-${item.quantity}`} className="text-sm leading-snug text-charcoal">
            <span className="font-semibold">
              {item.quantity ?? 1}× {name}
            </span>
            {mods.length > 0 && <p className="mt-0.5 text-forest-muted">{mods.join(', ')}</p>}
            {notes && <p className="mt-0.5 italic text-forest-muted">“{notes}”</p>}
          </li>
        );
      })}
      {remaining > 0 && (
        <li className="text-sm font-medium text-forest-muted">+{remaining} more item{remaining > 1 ? 's' : ''}</li>
      )}
    </ul>
  );
}

function OrderMetaBadge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-cream text-forest-muted border-cream-dark',
    accent: 'bg-forest/10 text-forest border-forest/20',
    warn: 'bg-amber-50 text-amber-900 border-amber-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${tones[tone] ?? tones.neutral}`}
    >
      {children}
    </span>
  );
}

function OrderCard({ order, onAdvance, nextStatus, laneColor, storeId }) {
  const total = order.total ?? order.total_amount;
  const isDineIn = order.fulfillment_type === 'dine_in';
  const isDelivery = order.fulfillment_type === 'delivery';
  const payAtCounter = order.payment_method === 'pay_at_counter';
  const orderRef = order.order_number ?? order.id?.slice(0, 8);
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState(order.items ?? null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState(false);

  useEffect(() => {
    if (items || !storeId || !order.id) return;
    let cancelled = false;
    setItemsLoading(true);
    setItemsError(false);
    ownerApi
      .getOrder(storeId, order.id)
      .then((data) => {
        if (cancelled) return;
        const detail = data?.order ?? data;
        setItems(detail?.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItemsError(true);
      })
      .finally(() => {
        if (!cancelled) setItemsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [items, storeId, order.id]);

  const title = isDineIn ? `Table ${order.table_number ?? '—'}` : `Order #${orderRef}`;
  const itemCount = items?.length ?? 0;
  const hasMore = itemCount > 4;
  const deliveryLine = isDelivery ? deliveryAddressLine(order) : null;

  return (
    <li className={`rounded-xl border border-cream-dark bg-white p-4 shadow-sm border-t-[3px] ${laneColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-tight text-charcoal">{title}</p>
          <p className="mt-1 text-sm text-forest-muted">
            {isDineIn ? `#${orderRef}` : (order.customer_phone ?? 'No phone')}
            {order.created_at && (
              <>
                <span className="mx-1.5 text-cream-dark" aria-hidden="true">
                  ·
                </span>
                <span title={new Date(order.created_at).toLocaleString()}>{formatOrderTime(order.created_at)}</span>
              </>
            )}
          </p>
        </div>
        <StatusBadge status={order.status} className="shrink-0 text-[11px]" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <OrderMetaBadge>{fulfillmentLabel(order)}</OrderMetaBadge>
        {order.order_source === 'qr' && <OrderMetaBadge tone="accent">QR</OrderMetaBadge>}
        {payAtCounter && <OrderMetaBadge tone="warn">Pay at counter</OrderMetaBadge>}
        {itemCount > 0 && (
          <OrderMetaBadge>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </OrderMetaBadge>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2 border-b border-cream-dark pb-3">
        <p className="text-lg font-bold tabular-nums text-charcoal">{formatCurrency(total, order.currency)}</p>
        {order.payment_method && order.payment_method !== 'pay_at_counter' && (
          <p className="text-xs capitalize text-forest-muted">{String(order.payment_method).replace(/_/g, ' ')}</p>
        )}
      </div>

      {deliveryLine && (
        <p className="mt-2 text-sm leading-snug text-charcoal">
          <span className="font-medium text-forest-muted">Deliver to: </span>
          {deliveryLine}
        </p>
      )}

      {order.notes && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Order note</p>
          <p className="mt-0.5 text-sm text-amber-950">{order.notes}</p>
        </div>
      )}

      <OrderItemsList items={items} loading={itemsLoading} error={itemsError} limit={expanded ? null : 4} />

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-medium text-forest hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? 'Show fewer items' : `Show all ${itemCount} items`}
        </button>
      )}

      {nextStatus && (
        <Button type="button" size="sm" className="mt-4 w-full text-sm" onClick={() => onAdvance(order, nextStatus)}>
          →{' '}
          {isDineIn && nextStatus === 'ready_for_dispatch'
            ? 'Ready to Serve'
            : isDineIn && nextStatus === 'completed'
              ? 'Served'
              : (STATUS_LABELS[nextStatus] ?? nextStatus)}
        </Button>
      )}
    </li>
  );
}

export function DispatchPanel({ order, open, onClose, onDispatch }) {
  const [notes, setNotes] = useState('Rider assigned');
  const [submitting, setSubmitting] = useState(false);
  const fee = order?.delivery_fee ?? '0';
  const payload = order?.dispatch_payload;

  const handleDispatch = async () => {
    setSubmitting(true);
    try {
      await onDispatch?.({ status: 'dispatched', notes });
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="External Dispatch"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDispatch} disabled={submitting}>
            {submitting ? 'Dispatching…' : 'Transmit to Aggregator'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="rounded-xl bg-cream/60 p-4">
          <p className="text-xs text-forest-muted">Delivery fee window</p>
          <p className="text-lg font-bold text-charcoal">{formatCurrency(fee)}</p>
          {order?.delivery_address && (
            <p className="mt-2 text-sm text-forest-muted">
              {order.delivery_address.line1}, {order.delivery_address.city}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-forest-muted">Dispatch notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="field-input w-full"
          />
        </div>

        {payload && (
          <div>
            <p className="mb-1 text-xs font-medium text-forest-muted">Dispatch metadata packet</p>
            <pre className="max-h-40 overflow-auto rounded-lg bg-charcoal p-3 text-xs text-cream">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function FoodOrderKanban({ orders, lanes, getNextStatus, onStatusChange, store: _store }) {
  const { selectedStoreId } = useMarketplace();
  const [dispatchOrder, setDispatchOrder] = useState(null);

  const grouped = lanes.reduce((acc, lane) => {
    acc[lane.key] = orders.filter((o) => lane.statuses.includes(o.status ?? 'pending_payment'));
    return acc;
  }, {});

  const laneColors = {
    incoming: 'border-t-amber-400',
    preparing: 'border-t-blue-500',
    ready: 'border-t-forest',
    out: 'border-t-violet-500',
    served: 'border-t-emerald-500',
    scheduled: 'border-t-blue-400',
    active: 'border-t-forest',
    done: 'border-t-emerald-500',
  };

  const handleAdvance = async (order, nextStatus) => {
    if (nextStatus === 'dispatched' && order.fulfillment_type === 'delivery') {
      setDispatchOrder(order);
      return;
    }
    await onStatusChange?.(order.id, { status: nextStatus });
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {lanes.map((lane) => {
          const laneOrders = grouped[lane.key] ?? [];
          return (
            <div
              key={lane.key}
              className="flex w-[min(100%,22rem)] shrink-0 flex-col rounded-2xl border border-cream-dark bg-cream/40"
            >
              <div className="sticky top-0 z-10 rounded-t-2xl border-b border-cream-dark bg-white/95 px-4 py-3 backdrop-blur-sm">
                <h3 className="flex items-center justify-between text-sm font-semibold text-charcoal">
                  <span>{lane.label}</span>
                  <span className="rounded-full bg-cream px-2.5 py-0.5 text-xs font-bold tabular-nums text-forest">
                    {laneOrders.length}
                  </span>
                </h3>
              </div>

              <ul className="min-h-[12rem] max-h-[calc(100vh-18rem)] space-y-3 overflow-y-auto p-3">
                {laneOrders.length === 0 ? (
                  <li className="rounded-xl border border-dashed border-cream-dark bg-white/60 px-4 py-10 text-center text-sm text-forest-muted">
                    No orders in this stage
                  </li>
                ) : (
                  laneOrders.map((order) => {
                    const next = getNextStatus?.(order.status ?? 'pending_payment', order.fulfillment_type)?.[0];
                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        nextStatus={next}
                        laneColor={laneColors[lane.key]}
                        onAdvance={handleAdvance}
                        storeId={selectedStoreId}
                      />
                    );
                  })
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <DispatchPanel
        order={dispatchOrder}
        open={Boolean(dispatchOrder)}
        onClose={() => setDispatchOrder(null)}
        onDispatch={(payload) => onStatusChange?.(dispatchOrder.id, payload).then(() => setDispatchOrder(null))}
      />
    </>
  );
}

export default FoodOrderKanban;
