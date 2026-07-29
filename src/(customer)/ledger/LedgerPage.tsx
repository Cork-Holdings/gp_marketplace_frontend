import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { customerApi } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { AccountNav } from '@/components/customer/AccountNav';
import { STATUS_LABELS } from '@/lib/workflows';
import { DEFAULT_LOCALE } from '@/lib/locale';

export default function CustomerLedgerPage() {
  const { hasRole, isAuthenticated } = useAuth();
  const isCustomer = hasRole('customer');

  const { data, loading, error, retry } = useFetchWrapper(
    () => customerApi.getPurchaseHistory({ limit: 20, offset: 0 }),
    [],
    { enabled: isAuthenticated && isCustomer },
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/portal" replace />;

  const orders = data?.orders ?? data?.items ?? data?.history ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Purchase Ledger</h1>
          <p className="mt-1 text-sm text-forest-muted">
            Track orders, payments, and transaction receipts across marketplace stores.
          </p>
        </div>
        <AccountNav />
      </header>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : (
        <div className="dashboard-card overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-cream-dark bg-cream/50 text-xs uppercase text-forest-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-forest-muted">
                    No purchase history yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/40">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link to={`/account/orders/${order.id}`} className="text-forest hover:underline">
                        #{order.order_number ?? order.id?.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{order.store_name ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(order.total ?? order.total_amount, order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-sage px-2 py-0.5 text-xs text-forest">
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-forest-muted">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString(DEFAULT_LOCALE)
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
