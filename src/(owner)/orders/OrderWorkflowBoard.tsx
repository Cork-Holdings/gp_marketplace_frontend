import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ownerApi } from '@/lib/api/services';
import { useRealtimeOrders } from '@/lib/context/useRealtimeOrder';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { DINE_IN_KANBAN_LANES } from '@/lib/workflows';
import { FoodOrderKanban } from './FoodOrderKanban';
import { OrderKanban } from '../dashboard/OwnerPanels';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';

type BoardMode = 'delivery' | 'dine_in';

function OrderSummaryBar({ orders }) {
  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;
    const incoming = orders.filter((o) => ['pending_payment', 'paid'].includes(o.status ?? '')).length;
    const inProgress = orders.filter((o) =>
      ['preparing', 'scheduled', 'in_service', 'assigned', 'job_in_progress', 'packaged'].includes(o.status ?? ''),
    ).length;
    const ready = orders.filter((o) =>
      ['ready_for_dispatch', 'dispatched', 'arrived'].includes(o.status ?? ''),
    ).length;
    return { active, incoming, inProgress, ready, total: orders.length };
  }, [orders]);

  const cards = [
    { label: 'Active', value: stats.active, hint: 'Not completed or cancelled' },
    { label: 'New / incoming', value: stats.incoming, hint: 'Awaiting payment or just paid' },
    { label: 'In progress', value: stats.inProgress, hint: 'Being prepared or serviced' },
    { label: 'Ready / out', value: stats.ready, hint: 'Ready for pickup, delivery, or serve' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-cream-dark bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-forest-muted">{card.label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-charcoal">{card.value}</p>
          <p className="mt-0.5 text-xs text-forest-muted">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}

export function OrderWorkflowBoard() {
  const { selectedStore, selectedStoreId } = useMarketplace();
  const capabilities = useMarketplaceCapabilities(selectedStore);
  const { orders, loading, error, refreshOrders, soundEnabled, setSoundEnabled, acknowledgeAlerts, hasActiveAlerts } =
    useRealtimeOrders();

  const deliveryOrders = useMemo(
    () => orders.filter((o) => o.fulfillment_type !== 'dine_in'),
    [orders],
  );
  const dineInOrders = useMemo(
    () => orders.filter((o) => o.fulfillment_type === 'dine_in'),
    [orders],
  );

  const defaultMode: BoardMode =
    dineInOrders.length > deliveryOrders.length ? 'dine_in' : 'delivery';
  const [mode, setMode] = useState<BoardMode | null>(null);
  const activeMode = mode ?? defaultMode;
  const boardOrders = activeMode === 'dine_in' ? dineInOrders : deliveryOrders;

  const handleStatusChange = useCallback(
    async (orderId, payload) => {
      if (!selectedStoreId) return;
      await ownerApi.updateOrderStatus(selectedStoreId, orderId, payload);
      await refreshOrders();
    },
    [selectedStoreId, refreshOrders],
  );

  if (!selectedStoreId) {
    return <p className="text-sm text-forest-muted">Select a store branch to view orders.</p>;
  }

  if (loading && !orders.length) return <TableSkeleton rows={3} cols={4} />;
  if (error) return <ErrorState error={error} onRetry={refreshOrders} />;

  return (
    <div className="space-y-5">
      <OrderSummaryBar orders={capabilities.isFood ? boardOrders : orders} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-dark bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {hasActiveAlerts && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" aria-hidden="true" />
              New orders
            </span>
          )}
          <label className="flex items-center gap-2 text-sm text-forest-muted">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="rounded text-forest focus:ring-forest"
            />
            Sound alerts
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={refreshOrders}>
            Refresh
          </Button>
          {hasActiveAlerts && (
            <Button variant="secondary" size="sm" onClick={acknowledgeAlerts}>
              Acknowledge alerts
            </Button>
          )}
        </div>
      </div>

      {capabilities.isFood && capabilities.kanbanLanes ? (
        <div className="space-y-4">
          <div className="flex rounded-full bg-cream p-1" role="tablist" aria-label="Order board mode">
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'delivery'}
              onClick={() => setMode('delivery')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeMode === 'delivery' ? 'bg-forest text-cream shadow-sm' : 'text-forest-muted hover:text-charcoal'
              }`}
            >
              Pickup &amp; delivery
              <span className="ml-1.5 tabular-nums opacity-80">({deliveryOrders.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeMode === 'dine_in'}
              onClick={() => setMode('dine_in')}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeMode === 'dine_in' ? 'bg-forest text-cream shadow-sm' : 'text-forest-muted hover:text-charcoal'
              }`}
            >
              Dine-in
              <span className="ml-1.5 tabular-nums opacity-80">({dineInOrders.length})</span>
            </button>
          </div>

          {activeMode === 'delivery' ? (
            <FoodOrderKanban
              orders={deliveryOrders}
              lanes={capabilities.kanbanLanes}
              getNextStatus={capabilities.getNextStatus}
              onStatusChange={handleStatusChange}
              store={selectedStore}
            />
          ) : (
            <FoodOrderKanban
              orders={dineInOrders}
              lanes={DINE_IN_KANBAN_LANES}
              getNextStatus={capabilities.getNextStatus}
              onStatusChange={handleStatusChange}
              store={selectedStore}
            />
          )}

          <p className="text-xs text-forest-muted">
            Kitchen staff should use the{' '}
            <Link to="/portal/owner/kitchen" className="font-semibold text-forest hover:underline">
              Kitchen
            </Link>{' '}
            screen for dine-in prep tickets.
          </p>
        </div>
      ) : (
        <OrderKanban
          storeId={selectedStoreId}
          orders={orders}
          onStatusChange={handleStatusChange}
          capabilities={capabilities}
        />
      )}
    </div>
  );
}

export default OrderWorkflowBoard;
