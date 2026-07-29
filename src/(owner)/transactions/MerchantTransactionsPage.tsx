import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { ownerApi } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StoreCategoryBadge } from '../stores/BranchSelector';
import { DEFAULT_LOCALE } from '@/lib/locale';
import {
  TRANSACTION_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type Transaction,
} from '@/types/transaction';

export default function MerchantTransactionsPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStoreId } = useMarketplace();

  const { data, loading, error, retry } = useFetchWrapper(
    () =>
      selectedStoreId
        ? ownerApi.listTransactions(selectedStoreId, { limit: 50, offset: 0 })
        : Promise.resolve(null),
    [selectedStoreId],
    { enabled: Boolean(selectedStoreId) },
  );

  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  const transactions: Transaction[] = data?.transactions ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">Transactions</h1>
            <p className="mt-1 text-sm text-forest-muted">
              Payments, refunds, and adjustments for this store.
            </p>
          </div>
          <StoreCategoryBadge />
        </div>
      </header>

      {!selectedStoreId ? (
        <EmptyState
          title="Select a store"
          description="Choose a branch from the store selector to view its transactions."
        />
      ) : loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : (
        <div className="dashboard-card overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cream-dark bg-cream/50 text-xs uppercase text-forest-muted">
              <tr>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-forest-muted">
                    No transactions yet for this store.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-cream/40">
                    <td className="px-4 py-3">
                      <Link
                        to={`/portal/owner/transactions/${txn.id}`}
                        className="font-mono text-xs text-forest hover:underline"
                      >
                        #{txn.id?.slice(0, 8)}
                      </Link>
                      {txn.payment_method && (
                        <p className="mt-0.5 text-xs text-forest-muted">
                          {PAYMENT_METHOD_LABELS[txn.payment_method] ??
                            String(txn.payment_method).replace(/_/g, ' ')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-forest-muted">
                      {txn.order_id ? `#${txn.order_id.slice(0, 8)}` : '—'}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {TRANSACTION_TYPE_LABELS[txn.transaction_type] ?? txn.transaction_type}
                    </td>
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {formatCurrency(txn.amount, txn.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={txn.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-forest-muted">
                      {txn.created_at
                        ? new Date(txn.created_at).toLocaleDateString(DEFAULT_LOCALE)
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
