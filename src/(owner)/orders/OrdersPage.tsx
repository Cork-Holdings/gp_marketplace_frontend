import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { StoreCategoryBadge } from '../stores/BranchSelector';
import { OrderWorkflowBoard } from './OrderWorkflowBoard';
import { RealtimeOrderProvider } from '@/lib/context/realtime-order';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { WorkflowPageHeader } from '@/components/common/WorkflowVisuals';
import { OrderWorkspace } from './OrderWorkspace';

function OrdersContent() {
  const { selectedStoreId } = useMarketplace();

  return (
    <RealtimeOrderProvider key={selectedStoreId} storeId={selectedStoreId} enabled={Boolean(selectedStoreId)}>
      <OrderWorkspace><OrderWorkflowBoard /></OrderWorkspace>
    </RealtimeOrderProvider>
  );
}

export default function MerchantOrdersPage() {
  const { isStoreOwner } = useAuth();
  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  return (
    <div className="space-y-6">
      <WorkflowPageHeader kind="order" eyebrow="Daily work" title="Orders" description="Keep every order moving. See what's new, what's being prepared and what's ready to hand over."><div className="mt-3"><StoreCategoryBadge /></div></WorkflowPageHeader>
      <OrdersContent />
    </div>
  );
}
