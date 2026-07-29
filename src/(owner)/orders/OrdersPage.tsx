import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { StoreCategoryBadge } from '../stores/BranchSelector';
import { OrderWorkflowBoard } from './OrderWorkflowBoard';
import { RealtimeOrderProvider } from '@/lib/context/realtime-order';
import { useMarketplace } from '@/lib/context/useMarketplace';

function OrdersContent() {
  const { selectedStoreId } = useMarketplace();

  return (
    <RealtimeOrderProvider storeId={selectedStoreId} enabled={Boolean(selectedStoreId)}>
      <OrderWorkflowBoard />
    </RealtimeOrderProvider>
  );
}

export default function MerchantOrdersPage() {
  const { isStoreOwner } = useAuth();
  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">Orders</h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-forest-muted">
              Track live orders, see item details at a glance, and advance each order through your workflow.
            </p>
          </div>
          <StoreCategoryBadge />
        </div>
      </header>
      <OrdersContent />
    </div>
  );
}
