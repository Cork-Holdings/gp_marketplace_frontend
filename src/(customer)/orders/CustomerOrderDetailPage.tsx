import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { customerApi, StorefrontService } from '@/lib/api/services';
import { useAsync } from '@/hooks/useAsync';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/lib/locale';
import { formatCurrency } from '@/lib/utils';
import { OrderReceipt } from '@/components/storefront/OrderReceipt';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  TRANSACTION_TYPE_LABELS,
  type Transaction,
} from '@/types/transaction';
import type { Store } from '@/types/store';

export default function CustomerOrderDetailPage() {
  const { isAuthenticated, hasRole } = useAuth();
  const isCustomer = hasRole('customer');
  const { orderId } = useParams();
  const { data: storeData } = useFetchWrapper(() => StorefrontService.listStores(), []);

  const {
    data,
    loading,
    error,
    retry,
  } = useAsync(async () => {
    if (!orderId) return null;
    const res = await customerApi.getOrder(orderId);
    return {
      order: res.order ?? res,
      transactions: (res.transactions ?? []) as Transaction[],
    };
  }, [orderId]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/portal" replace />;

  const order = data?.order;
  const transactions = data?.transactions ?? [];
  const stores: Store[] = Array.isArray(storeData) ? storeData : [];
  const storeName = order?.store_name || stores.find(store => store.id === order?.store_id)?.name;

  return (
    <main className="workflow-page">
      <Link to="/account/ledger" className="workflow-back-link">← All orders</Link>
      <header className="workflow-header"><p className="workflow-eyebrow">Your account / Orders</p><h1>{order?.order_number ? `Order #${order.order_number}` : 'Order details'}</h1><p>Review your items, fulfilment and payment activity in one place.</p></header>

      {loading ? (
        <TableSkeleton rows={4} cols={2} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : (
        <>
          <div className="max-w-3xl"><OrderReceipt order={order} currency={order?.currency ?? DEFAULT_CURRENCY} storeName={storeName} /></div>

          {transactions.length > 0 && (
            <section className="workflow-panel max-w-3xl" aria-labelledby="order-payments-heading">
              <div className="workflow-panel-heading"><h2 id="order-payments-heading">Payment activity</h2><p>Payment attempts and their current status for this order.</p></div>
              <ul className="divide-y divide-[#edf0f6] px-6">
                {transactions.map((txn) => (
                  <li key={txn.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link to={`/account/transactions/${txn.id}`} className="customer-activity-title">
                        {TRANSACTION_TYPE_LABELS[txn.transaction_type] ?? txn.transaction_type}
                      </Link>
                      <p className="mt-0.5 text-xs text-[#59657c]">
                        {txn.created_at
                          ? ` · ${new Date(txn.created_at).toLocaleDateString(DEFAULT_LOCALE)}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(txn.amount, txn.currency ?? order?.currency)}
                      </span>
                      <StatusBadge status={txn.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
