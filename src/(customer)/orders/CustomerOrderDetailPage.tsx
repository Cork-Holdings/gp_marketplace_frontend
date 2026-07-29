import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { customerApi } from '@/lib/api/services';
import { useAsync } from '@/hooks/useAsync';
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

export default function CustomerOrderDetailPage() {
  const { isAuthenticated, hasRole } = useAuth();
  const isCustomer = hasRole('customer');
  const { orderId } = useParams();

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

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 md:p-8">
      <Link to="/account/ledger" className="text-sm text-forest-muted hover:text-forest">
        ← Back to purchase ledger
      </Link>
      <h1 className="text-2xl font-bold text-charcoal">Order Details</h1>

      {loading ? (
        <TableSkeleton rows={4} cols={2} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : (
        <>
          <OrderReceipt order={order} currency={order?.currency ?? DEFAULT_CURRENCY} />

          {transactions.length > 0 && (
            <section className="dashboard-card space-y-3 p-5">
              <h2 className="text-sm font-semibold text-charcoal">Transactions</h2>
              <ul className="divide-y divide-cream-dark">
                {transactions.map((txn) => (
                  <li key={txn.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link
                        to={`/account/transactions/${txn.id}`}
                        className="font-mono text-xs text-forest hover:underline"
                      >
                        #{txn.id.slice(0, 8)}
                      </Link>
                      <p className="mt-0.5 text-xs text-forest-muted">
                        {TRANSACTION_TYPE_LABELS[txn.transaction_type] ?? txn.transaction_type}
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
    </div>
  );
}
