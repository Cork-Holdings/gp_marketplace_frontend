import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { customerApi, StorefrontService } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { WorkflowPageHeader, WorkflowGlyph, WorkflowMeta, WorkflowEmpty } from '@/components/common/WorkflowVisuals';
import { DEFAULT_LOCALE } from '@/lib/locale';
import type { Store } from '@/types/store';

type CustomerOrder = { id: string; store_id?: string; store_name?: string; order_number?: number; status: string; total?: string | number; total_amount?: string | number; currency?: string; created_at?: string };

export default function CustomerLedgerPage() {
  const { hasRole, isAuthenticated } = useAuth();
  const customer = hasRole('customer');
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const { data, loading, error, retry } = useFetchWrapper(() => customerApi.getPurchaseHistory({ limit: pageSize, offset: page * pageSize }), [page, isAuthenticated, customer], { enabled: isAuthenticated && customer });
  const total = typeof data?.total === 'number' ? data.total : 0;
  useEffect(() => {
    if (!loading && !error && page > 0 && page * pageSize >= total) setPage(Math.max(0, Math.ceil(total / pageSize) - 1));
  }, [loading, error, page, total]);
  const { data: storeData } = useFetchWrapper(() => StorefrontService.listStores(), []);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!customer) return <Navigate to="/portal" replace />;

  const orders: CustomerOrder[] = data?.orders ?? data?.items ?? data?.history ?? [];
  const stores: Store[] = Array.isArray(storeData) ? storeData : [];
  const storeName = (order: CustomerOrder) => order.store_name || stores.find(store => store.id === order.store_id)?.name || 'Marketplace store';

  return <main className="workflow-page">
    <WorkflowPageHeader kind="order" title="Your orders" description="From your first purchase to your doorstep. Find your orders, pickup updates and receipts here." />
    {loading ? <TableSkeleton rows={5} cols={4} /> : error ? <ErrorState error={error} onRetry={retry} /> : <section className="workflow-panel" aria-labelledby="orders-heading">
      <div className="workflow-panel-heading"><h2 id="orders-heading">Purchase history</h2><p>Open an order for its details and receipt.</p></div>
      {orders.length ? <ul className="customer-activity-list customer-order-list">{orders.map(order => <li key={order.id}>
        <Link to={`/account/orders/${encodeURIComponent(order.id)}`} className="customer-order-link">
          <WorkflowGlyph name="package" /><div className="customer-order-copy"><strong className="customer-activity-title">{order.order_number ? `Order #${order.order_number}` : 'Your order'}</strong><WorkflowMeta icon="store">{storeName(order)}</WorkflowMeta><WorkflowMeta icon="calendar">{order.created_at && Number.isFinite(Date.parse(order.created_at)) ? new Date(order.created_at).toLocaleDateString(DEFAULT_LOCALE) : 'Date unavailable'}</WorkflowMeta></div>
          <div className="customer-order-value"><StatusBadge status={order.status} /><strong>{formatCurrency(order.total ?? order.total_amount, order.currency)}</strong><span>View order <WorkflowIcon name="arrowRight" size={16} /></span></div>
        </Link>
      </li>)}</ul> : <WorkflowEmpty kind="order" title="Your next find is waiting" description="Your purchases will appear here with pickup or delivery updates."><Link to="/?kind=products" className="workflow-primary">Explore products <WorkflowIcon name="arrowRight" /></Link></WorkflowEmpty>}
      {total > pageSize && <nav className="booking-pagination" aria-label="Purchase history pages"><span>Page {page + 1} of {Math.ceil(total / pageSize)}</span><div><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)}>Next</button></div></nav>}
    </section>}
  </main>;
}
