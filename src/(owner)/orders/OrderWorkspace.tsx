import { RecordListTable } from '@/components/common/RecordListTable';
import { Fragment, useEffect, useId, useState, type ReactNode } from 'react';
import { useRealtimeOrders } from '@/lib/context/useRealtimeOrder';
import { ORDER_PAGE_SIZE } from '@/lib/context/realtime-order';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { ownerApi } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import './order-workspace.css';

function HistoryDetail({ order, storeId }: { order: any; storeId: string }) {
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setDetail(null); setError(null);
    ownerApi.getOrder(storeId, order.id).then(data => { if (live) setDetail(data?.order ?? data); }).catch(err => { if (live) setError(err); });
    return () => { live = false; };
  }, [storeId, order.id, attempt]);
  if (error) return <ErrorState error={error} onRetry={() => setAttempt(value => value + 1)} />;
  if (!detail) return <p role="status">Loading order details…</p>;
  return <div className="order-history-detail">
    <div><h3>Order items</h3>{detail.items?.length ? <ul>{detail.items.map((item: any, i: number) => <li key={item.id ?? i}><strong>{item.quantity ?? 1} × {item.product_name ?? item.name ?? 'Item'}</strong>{item.item_notes && <p>{item.item_notes}</p>}</li>)}</ul> : <p>No item details were recorded.</p>}</div>
    <div><h3>Order information</h3><p>Customer contact: {detail.customer_phone || 'Not supplied'}</p>{detail.delivery_address && <p>{[detail.delivery_address.line1, detail.delivery_address.city].filter(Boolean).join(', ')}</p>}{detail.notes && <p>{detail.notes}</p>}<p>Payment method: {String(detail.payment_method || 'Not recorded').replaceAll('_', ' ')}</p></div>
  </div>;
}

function OrderHistoryTable() {
  const { orders, total, loading, error, refreshOrders } = useRealtimeOrders();
  const { selectedStoreId } = useMarketplace();
  const [expanded, setExpanded] = useState<string | null>(null);
  const id = useId();
  if (loading && !orders.length) return <TableSkeleton rows={5} cols={6} />;
  if (error) return <ErrorState error={error} onRetry={refreshOrders} />;
  return <section aria-labelledby={`${id}-title`} className="order-history">
    <div className="order-history-heading"><WorkflowIcon name="checkCircle" size={22} /><div><h2 id={`${id}-title`}>Order history</h2><p>Served, completed and cancelled orders stay here. No records are deleted.</p></div><span>{total} orders</span></div>
    {orders.length ? <div className="order-history-scroll" tabIndex={0} role="region" aria-label="Order history table"><RecordListTable><thead><tr><th>Order</th><th>Customer / table</th><th>Fulfilment</th><th>Date placed</th><th className="order-money">Total</th><th>Status</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{orders.map(order => {
      const isExpanded = expanded === order.id;
      return <Fragment key={order.id}><tr><th scope="row">#{order.order_number ?? order.id?.slice(0, 8)}</th><td>{order.fulfillment_type === 'dine_in' ? `Table ${order.table_number ?? 'Not recorded'}` : order.customer_phone || 'Not supplied'}</td><td>{order.fulfillment_type === 'dine_in' ? 'Dine-in' : order.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'}</td><td>{order.created_at ? new Date(order.created_at).toLocaleString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Not recorded'}</td><td className="order-money">{formatCurrency(order.total ?? order.total_amount, order.currency)}</td><td><StatusBadge status={order.status} />{order.status === 'completed' && order.fulfillment_type === 'dine_in' && <small>Served</small>}</td><td><button type="button" className="order-detail-toggle" aria-label={`${isExpanded ? 'Hide' : 'View'} order ${order.order_number ?? order.id?.slice(0, 8)}`} aria-expanded={isExpanded} aria-controls={`${id}-${order.id}`} onClick={() => setExpanded(isExpanded ? null : order.id)}>{isExpanded ? 'Hide' : 'View'}<WorkflowIcon name="arrowRight" size={16} /></button></td></tr>{isExpanded && <tr id={`${id}-${order.id}`}><td colSpan={7}>{selectedStoreId && <HistoryDetail order={order} storeId={selectedStoreId} />}</td></tr>}</Fragment>;
    })}</tbody></RecordListTable></div> : <p className="order-workspace-empty">No orders match these filters. Completed orders appear here after handover or service.</p>}
  </section>;
}

export function OrderWorkspace({ children }: { children: ReactNode }) {
  const { filters, setFilters, orders, total, page, setPage, loading, refreshOrders } = useRealtimeOrders();
  const { selectedStore } = useMarketplace();
  const capabilities = useMarketplaceCapabilities(selectedStore);
  const [search, setSearch] = useState('');
  const id = useId();
  useEffect(() => {
    if (search.trim() === filters.q) return;
    const timer = setTimeout(() => setFilters({ q: search.trim() }), 300);
    return () => clearTimeout(timer);
  }, [search, filters.q, setFilters]);
  const history = filters.view === 'history';
  return <div className="order-workspace">
    <div className="order-workspace-tabs" role="tablist" aria-label="Order workspace">
      <button id={`${id}-active`} role="tab" type="button" aria-selected={!history} aria-controls={`${id}-panel`} onClick={() => setFilters({ view: 'active', status: '' })}><WorkflowIcon name="layers" size={18} />Live board</button>
      <button id={`${id}-history`} role="tab" type="button" aria-selected={history} aria-controls={`${id}-panel`} onClick={() => setFilters({ view: 'history', status: '' })}><WorkflowIcon name="checkCircle" size={18} />History</button>
    </div>
    <div className="order-workspace-toolbar">
      <label className="order-search"><WorkflowIcon name="search" size={18} /><span className="sr-only">Find an order</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Order number, table or phone" /></label>
      <label><span>Fulfilment</span><select value={filters.fulfillment} onChange={event => setFilters({ fulfillment: event.target.value })}><option value="">All orders</option>{capabilities.isFood && <option value="dine_in">Dine-in</option>}<option value="pickup">Pickup</option><option value="delivery">Delivery</option></select></label>
      {history && <label><span>Status</span><select value={filters.status} onChange={event => setFilters({ status: event.target.value })}><option value="">All history</option><option value="completed">Completed / served</option><option value="cancelled">Cancelled</option></select></label>}
      <button type="button" className="order-refresh" disabled={loading} onClick={() => { void refreshOrders(); }}><WorkflowIcon name="refresh" size={17} />Refresh</button>
    </div>
    <p className="order-workspace-note">{history ? 'History is searchable across this branch, not just the current page.' : 'Only unfinished orders stay on this board. Completed and served orders move to History automatically.'}</p>
    <div role="tabpanel" id={`${id}-panel`} aria-labelledby={history ? `${id}-history` : `${id}-active`}>{history ? <OrderHistoryTable /> : children}</div>
    <nav className="order-workspace-pagination" aria-label="Order pages"><span>{loading && !orders.length ? 'Loading orders…' : total ? `${page * ORDER_PAGE_SIZE + 1}–${Math.min((page + 1) * ORDER_PAGE_SIZE, total)} of ${total} orders` : '0 orders'}</span><div><button type="button" disabled={loading || page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={loading || (page + 1) * ORDER_PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>Next</button></div></nav>
  </div>;
}
