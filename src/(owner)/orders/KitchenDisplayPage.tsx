import { Navigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
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
import { OrderWorkspace } from './OrderWorkspace';
import { WorkflowPageHeader } from '@/components/common/WorkflowVisuals';

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
  const { orders, filters, loading, error, refreshOrders } = useRealtimeOrders();
  const filter = filters.fulfillment || 'all';

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
      return KITCHEN_ACTIVE_STATUSES.has(o.status);
    });
  }, [orders]);

  const lanes = useMemo(() => {
    if (filter === 'dine_in') return DINE_IN_KANBAN_LANES.filter(lane => lane.key !== 'served');
    if (filter === 'delivery' || filter === 'pickup') return FOOD_KANBAN_LANES;
    // Mixed board: merge dine-in "ready to serve" label with dispatch lane.
    return [
      { key: 'incoming', label: 'Incoming / New', statuses: ['pending_payment', 'paid'] },
      { key: 'preparing', label: 'In Preparation', statuses: ['preparing'] },
      { key: 'ready', label: 'Ready', statuses: ['ready_for_dispatch'] },
      { key: 'out', label: 'Out for delivery / pickup', statuses: ['dispatched'] },
    ];
  }, [filter]);

  if (loading && !orders.length) return <TableSkeleton rows={3} cols={4} />;
  if (error) return <ErrorState error={error} onRetry={refreshOrders} />;

  return (
    <div className="space-y-4">
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
      <WorkflowPageHeader kind="order" eyebrow="Daily work" title="Kitchen" description="Prepare and serve live tickets. Completed orders remain available in History." />

      <RealtimeOrderProvider key={selectedStoreId} storeId={selectedStoreId} enabled>
        <OrderWorkspace><KitchenBoard store={selectedStore} /></OrderWorkspace>
      </RealtimeOrderProvider>
    </div>
  );
}
