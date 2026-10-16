import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { usePaymentMode } from '@/hooks/usePaymentMode';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { customerApi, StorefrontService } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DEFAULT_LOCALE } from '@/lib/locale';
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS, type CustomerPurchaseHistory, type Transaction } from '@/types/transaction';
import type { Store } from '@/types/store';

export default function TransactionsPage() {
  const simulated = usePaymentMode();
  const { hasRole, isAuthenticated } = useAuth();
  const customer = hasRole('customer');
  const { data, loading, error, retry } = useFetchWrapper(() => customerApi.getPurchaseHistory({ limit: 50, offset: 0 }), [], { enabled: isAuthenticated && customer });
  const { data: storeData } = useFetchWrapper(() => StorefrontService.listStores(), []);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!customer) return <Navigate to="/portal" replace />;

  const history = data as CustomerPurchaseHistory | null;
  const transactions: Transaction[] = history?.transactions ?? [];
  const stores: Store[] = Array.isArray(storeData) ? storeData : [];
  const storeName = (transaction: Transaction) => stores.find(store => store.id === transaction.store_id)?.name || 'Marketplace purchase';

  return <main className="workflow-page">
    <header className="workflow-header"><p className="workflow-eyebrow">Your account</p><h1>Payments</h1><p>Review money paid, refunds, and adjustments for your purchases.</p></header>
    {simulated && <Link to="/account/settlements" className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-cream-dark bg-sage/20 p-4 text-sm font-semibold text-forest">View simulated payments for all workflows<span aria-hidden="true">→</span></Link>}
    {loading ? <TableSkeleton rows={5} cols={4} /> : error ? <ErrorState error={error} onRetry={retry} /> : <section className="workflow-panel" aria-labelledby="payments-heading">
      <div className="workflow-panel-heading"><h2 id="payments-heading">Payment activity</h2><p>Open a payment to see the reference and receipt details.</p></div>
      {transactions.length ? <ul className="customer-activity-list">{transactions.map(transaction => <li key={transaction.id} className="customer-activity-row">
        <div className="customer-activity-main"><Link to={`/account/transactions/${transaction.id}`} className="customer-activity-title">{TRANSACTION_TYPE_LABELS[transaction.transaction_type] ?? transaction.transaction_type} · {storeName(transaction)}</Link><span>{transaction.payment_method ? PAYMENT_METHOD_LABELS[transaction.payment_method] ?? transaction.payment_method.replaceAll('_', ' ') : 'Payment method unavailable'} · {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString(DEFAULT_LOCALE) : 'Date unavailable'}</span></div>
        <div className="customer-activity-meta"><strong>{formatCurrency(transaction.amount, transaction.currency)}</strong><StatusBadge status={transaction.status} /></div>
      </li>)}</ul> : <div className="workflow-empty"><p>No payment activity yet.</p><Link to="/" className="customer-empty-link">Browse stores to make your first purchase</Link></div>}
    </section>}
  </main>;
}
