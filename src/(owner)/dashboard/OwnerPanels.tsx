import { useState, useEffect } from 'react';
import { ownerApi } from '@/lib/api/services';
import { normalizeOrderList, normalizeStoreList } from '@/lib/normalizeApi';
import { useAsync } from '@/hooks/useAsync';
import { formatCurrency, formatOrderTime } from '@/lib/utils';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/useConfirm';

export function StoreSelector({ storeId, onSelect }) {
  const { data, loading, error, retry } = useAsync(() => ownerApi.listStores(), []);

  const stores = normalizeStoreList(data);

  useEffect(() => {
    if (stores.length > 0 && !storeId && onSelect) {
      onSelect(stores[0].id);
    }
  }, [stores, storeId, onSelect]);

  if (loading) return <TableSkeleton rows={1} cols={3} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  if (stores.length === 0) {
    return <p className="text-sm text-forest-muted">No stores assigned to your account.</p>;
  }

  return (
    <select
      value={storeId ?? stores[0]?.id ?? ''}
      onChange={(e) => onSelect(e.target.value)}
      className="rounded-lg border border-cream-dark bg-white px-3 py-2 text-sm font-medium text-charcoal focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
      aria-label="Select store"
    >
      {stores.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

export function ProductTable({ storeId, listOnly = false, onRequestCreate }) {
  const { data, loading, error, retry } = useAsync(
    () => (storeId ? ownerApi.listProducts(storeId) : Promise.resolve([])),
    [storeId],
  );
  const { confirm, dialog } = useConfirm();
  const [deleteError, setDeleteError] = useState(null);

  const products = Array.isArray(data) ? data : data?.products ?? data?.items ?? data?.data ?? [];

  const handleDelete = async (productId, productName) => {
    const ok = await confirm({
      title: 'Delete product?',
      description: `“${productName ?? 'This product'}” will be removed from the catalog. This cannot be undone.`,
      confirmLabel: 'Delete product',
      tone: 'danger',
    });
    if (!ok) return;
    setDeleteError(null);
    try {
      await ownerApi.deleteProduct(storeId, productId);
      retry();
    } catch (err) {
      setDeleteError(err);
    }
  };

  if (!storeId) return null;
  if (loading) return <TableSkeleton rows={5} cols={5} />;
  if (error) return <ErrorState error={error} onRetry={retry} />;

  return (
    <div className="space-y-4">
      {dialog}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-charcoal">Products</h2>
        {listOnly && onRequestCreate && (
          <Button type="button" size="sm" variant="secondary" onClick={onRequestCreate}>
            + Add
          </Button>
        )}
      </div>

      {deleteError && <ErrorState error={deleteError} />}

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first item to start selling from this branch."
          actionLabel={onRequestCreate ? 'Add product' : undefined}
          onAction={onRequestCreate}
        />
      ) : (
        <div className="dashboard-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-cream-dark bg-cream/60 text-[11px] font-medium uppercase tracking-wide text-forest-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-cream/40">
                    <td className="px-4 py-3 font-medium text-charcoal">{p.name}</td>
                    <td className="px-4 py-3 text-forest-muted">{p.sku}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3">{p.stock_quantity ?? '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id, p.name)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const ORDER_COLUMNS = [
  { key: 'pending_payment', label: 'Pending Payment', color: 'border-amber-400' },
  { key: 'paid', label: 'Paid', color: 'border-blue-400' },
  { key: 'fulfilled', label: 'Fulfilled', color: 'border-green-400' },
  { key: 'cancelled', label: 'Cancelled', color: 'border-gray-400' },
];

export function OrderKanban({ storeId, orders: externalOrders, onStatusChange, capabilities }) {
  const { data, loading, error, retry } = useAsync(
    () => (storeId && !externalOrders ? ownerApi.listOrders(storeId) : Promise.resolve([])),
    [storeId, externalOrders],
  );

  const orders = externalOrders ?? normalizeOrderList(data);

  const lanes = capabilities?.kanbanLanes ?? ORDER_COLUMNS.map((col) => ({
    key: col.key,
    label: col.label,
    statuses: [col.key],
    color: col.color,
  }));

  const handleStatusChange = async (orderId, payload) => {
    const body = typeof payload === 'string' ? { status: payload } : payload;
    try {
      if (onStatusChange) {
        await onStatusChange(orderId, body);
      } else {
        await ownerApi.updateOrderStatus(storeId, orderId, body);
        retry();
      }
    } catch {
      /* silent */
    }
  };

  if (!storeId && !externalOrders) return null;
  if (!externalOrders && loading) return <TableSkeleton rows={3} cols={4} />;
  if (!externalOrders && error) return <ErrorState error={error} onRetry={retry} />;

  const grouped = lanes.reduce((acc, lane) => {
    acc[lane.key] = orders.filter((o) =>
      (lane.statuses ?? [lane.key]).includes(o.status ?? 'pending_payment'),
    );
    return acc;
  }, {});

  const laneColors = {
    pending_payment: 'border-t-amber-400',
    incoming: 'border-t-amber-400',
    paid: 'border-t-blue-400',
    scheduled: 'border-t-blue-400',
    preparing: 'border-t-forest-muted',
    active: 'border-t-forest',
    fulfilled: 'border-t-green-400',
    cancelled: 'border-t-gray-400',
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {lanes.map((lane) => {
        const laneOrders = grouped[lane.key] ?? [];
        return (
          <div
            key={lane.key}
            className={`flex w-[min(100%,22rem)] shrink-0 flex-col rounded-2xl border border-cream-dark border-t-4 bg-cream/40 ${lane.color ?? laneColors[lane.key] ?? 'border-t-forest'}`}
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
                  const next = capabilities?.getNextStatus?.(order.status ?? 'pending_payment')?.[0];
                  return (
                    <li
                      key={order.id}
                      className="rounded-xl border border-cream-dark bg-white p-4 text-sm shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-base font-bold text-charcoal">
                            #{order.order_number ?? order.id?.slice(0, 8)}
                          </p>
                          <p className="mt-1 text-sm text-forest-muted">
                            {order.customer_phone ?? 'No phone'}
                            {order.created_at && (
                              <>
                                <span className="mx-1.5 text-cream-dark" aria-hidden="true">
                                  ·
                                </span>
                                <span title={new Date(order.created_at).toLocaleString()}>
                                  {formatOrderTime(order.created_at)}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                        <StatusBadge status={order.status} className="shrink-0 text-[11px]" />
                      </div>
                      <p className="mt-3 border-b border-cream-dark pb-3 text-lg font-bold tabular-nums text-charcoal">
                        {formatCurrency(order.total ?? order.total_amount, order.currency)}
                      </p>
                      {order.notes && (
                        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                          {order.notes}
                        </p>
                      )}
                      {next && (
                        <Button
                          type="button"
                          size="sm"
                          className="mt-4 w-full"
                          onClick={() => handleStatusChange(order.id, { status: next })}
                        >
                          Advance order
                        </Button>
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsCards({ storeId }) {
  const { data, loading } = useAsync(
    () => (storeId ? ownerApi.listOrders(storeId) : Promise.resolve([])),
    [storeId],
  );

  const orders = normalizeOrderList(data);
  const paidOrders = orders.filter((o) => ['paid', 'fulfilled', 'completed'].includes(o.status));
  const revenue = paidOrders.reduce((sum, o) => sum + (parseFloat(String(o.total ?? o.total_amount)) || 0), 0);
  const pending = orders.filter((o) => o.status === 'pending_payment').length;

  if (loading) return <TableSkeleton rows={1} cols={3} />;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { label: 'Total Revenue', value: formatCurrency(revenue) },
        { label: 'Paid Orders', value: paidOrders.length },
        { label: 'Pending Payment', value: pending },
      ].map((card) => (
        <div key={card.label} className="dashboard-card">
          <p className="text-xs text-forest-muted">{card.label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-charcoal">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
