import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { customerApi } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AccountNav } from '@/components/customer/AccountNav';
import { DEFAULT_LOCALE } from '@/lib/locale';
import {
  TRANSACTION_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type CustomerPurchaseHistory,
  type Transaction,
} from '@/types/transaction';

export default function TransactionsPage() {
  const { hasRole, isAuthenticated } = useAuth();
  const isCustomer = hasRole('customer');

  const { data, loading, error, retry } = useFetchWrapper(
    () => customerApi.getPurchaseHistory({ limit: 50, offset: 0 }),
    [],
    { enabled: isAuthenticated && isCustomer },
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/portal" replace />;

  const history = data as CustomerPurchaseHistory | null;
  const transactions: Transaction[] = history?.transactions ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Transactions</h1>
          <p className="mt-1 text-sm text-forest-muted">
            Payments, refunds, and adjustments across your marketplace purchases.
          </p>
        </div>
        <AccountNav />
      </header>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : (
        <div className="dashboard-card overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cream-dark bg-cream/50 text-xs uppercase text-forest-muted">
              <tr>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-forest-muted">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-cream/40">
                    <td className="px-4 py-3">
                      <Link
                        to={`/account/transactions/${txn.id}`}
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
