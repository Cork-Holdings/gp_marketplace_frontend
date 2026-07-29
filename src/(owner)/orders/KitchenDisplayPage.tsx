import { Navigate } from 'react-router-dom';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { canManageKitchenOrders } from '@/lib/storeConfig';
import { DINE_IN_KANBAN_LANES, FOOD_KANBAN_LANES } from '@/lib/workflows';
import { RealtimeOrderProvider } from '@/lib/context/realtime-order';
import { useRealtimeOrders } from '@/lib/context/useRealtimeOrder';
import { ownerApi } from '@/lib/api/services';
import { FoodOrderKanban } from './FoodOrderKanban';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

type KitchenFilter = 'all' | 'dine_in' | 'delivery' | 'pickup';

const KITCHEN_ACTIVE_STATUSES = new Set([
  'pending_payment',
  'paid',
  'preparing',
  'ready_for_dispatch',
  'dispatched',
]);

function KitchenBoard({ store }) {
  const { selectedStoreId } = useMarketplace();
  const capabilities = useMarketplaceCapabilities(store);
  const { orders, loading, error, refreshOrders } = useRealtimeOrders();
  const [filter, setFilter] = useState<KitchenFilter>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const handleStatusChange = useCallback(
    async (orderId, payload) => {
      if (!selectedStoreId) return;
      await ownerApi.updateOrderStatus(selectedStoreId, orderId, payload);
      await refreshOrders();
    },
    [selectedStoreId, refreshOrders],
  );

  const kitchenOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!showCompleted && o.status === 'completed') return false;
      if (o.status === 'cancelled') return false;
      if (!showCompleted && !KITCHEN_ACTIVE_STATUSES.has(o.status) && o.status !== 'completed') {
        return false;
      }
      if (filter === 'all') return true;
      if (filter === 'dine_in') return o.fulfillment_type === 'dine_in';
      if (filter === 'delivery') return o.fulfillment_type === 'delivery';
      if (filter === 'pickup') return o.fulfillment_type === 'pickup' || o.fulfillment_type === 'collection';
      return true;
    });
  }, [orders, filter, showCompleted]);

  const lanes = useMemo(() => {
    if (filter === 'dine_in') return DINE_IN_KANBAN_LANES;
    if (filter === 'delivery' || filter === 'pickup') return FOOD_KANBAN_LANES;
    // Mixed board: merge dine-in "ready to serve" label with dispatch lane.
    return [
      { key: 'incoming', label: 'Incoming / New', statuses: ['pending_payment', 'paid'] },
      { key: 'preparing', label: 'In Preparation', statuses: ['preparing'] },
      { key: 'ready', label: 'Ready', statuses: ['ready_for_dispatch'] },
      { key: 'out', label: 'Served / Out', statuses: ['completed', 'dispatched'] },
    ];
  }, [filter]);

  if (loading && !orders.length) return <TableSkeleton rows={3} cols={4} />;
  if (error) return <ErrorState error={error} onRetry={refreshOrders} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'All tickets'],
              ['dine_in', 'Dine-in'],
              ['delivery', 'Delivery'],
              ['pickup', 'Pickup'],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={filter === key ? 'primary' : 'secondary'}
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-forest-muted">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            className="rounded text-forest focus:ring-forest"
          />
          Show completed
        </label>
      </div>

      {kitchenOrders.length === 0 ? (
        <EmptyState
          title="Kitchen is clear"
          description={
            filter === 'all'
              ? 'New dine-in, delivery, and pickup orders will appear here as tickets.'
              : `No ${filter.replace('_', '-')} tickets right now.`
          }
        />
      ) : (
        <FoodOrderKanban
          orders={kitchenOrders}
          lanes={lanes}
          getNextStatus={capabilities.getNextStatus}
          onStatusChange={handleStatusChange}
          store={store}
        />
      )}
    </div>
  );
}

/**
 * Kitchen display for food staff — tickets for dine-in, delivery, and pickup
 * with item/modifier detail from the order line snapshot.
 */
export default function KitchenDisplayPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStore, selectedStoreId, memberRole, loading } = useMarketplace();
  const capabilities = useMarketplaceCapabilities(selectedStore);

  // Match other owner pages: auth gate first. memberRole is often null while
  // memberships load (or if that call fails) — canManageKitchenOrders(null)
  // used to bounce everyone to Overview, so Kitchen looked like the wrong tab.
  if (!isStoreOwner) return <Navigate to="/portal" replace />;
  if (memberRole && !canManageKitchenOrders(memberRole)) {
    return <Navigate to="/portal/owner" replace />;
  }
  if (!loading && selectedStore && !capabilities.isFood) {
    return <Navigate to="/portal/owner" replace />;
  }

  if (loading && !selectedStoreId) return <TableSkeleton rows={3} cols={4} />;

  if (!selectedStoreId) {
    return <p className="text-sm text-forest-muted">Select a store branch to view the kitchen board.</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal">Kitchen</h1>
        <p className="mt-1 text-sm text-forest-muted">
          Live tickets with items, modifiers, and notes — advance each order as you cook and plate.
        </p>
      </header>

      <RealtimeOrderProvider storeId={selectedStoreId} enabled>
        <KitchenBoard store={selectedStore} />
      </RealtimeOrderProvider>
    </div>
  );
}
