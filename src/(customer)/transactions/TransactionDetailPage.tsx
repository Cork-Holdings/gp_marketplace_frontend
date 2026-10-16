import { Link, Navigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { customerApi } from '@/lib/api/services';
import { useAsync } from '@/hooks/useAsync';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/lib/locale';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  TRANSACTION_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  type Transaction,
} from '@/types/transaction';

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#edf0f6] py-4 last:border-0">
      <dt className="text-sm text-[#59657c]">{label}</dt>
      <dd className="max-w-[70%] break-words text-right text-sm font-medium text-[#101834]">{children}</dd>
    </div>
  );
}

export default function TransactionDetailPage() {
  const { isAuthenticated, hasRole } = useAuth();
  const isCustomer = hasRole('customer');
  const { transactionId } = useParams();

  const { data, loading, error, retry } = useAsync(async () => {
    if (!transactionId) return null;
    const res = await customerApi.getTransaction(transactionId);
    return (res?.transaction ?? res) as Transaction;
  }, [transactionId]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/portal" replace />;

  const txn = data as Transaction | null;

  return (
    <main className="workflow-page">
      <Link to="/account/transactions" className="workflow-back-link">← All payments</Link>
      <header className="workflow-header"><p className="workflow-eyebrow">Your account / Payments</p><h1>Payment details</h1><p>Check the amount, method and status of this payment activity.</p></header>

      {loading ? (
        <TableSkeleton rows={6} cols={2} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : !txn ? (
        <p className="text-sm text-forest-muted">Transaction not found.</p>
      ) : (
        <section className="workflow-panel max-w-3xl">
          <dl className="px-6">
            <DetailRow label="Status">
              <StatusBadge status={txn.status} />
            </DetailRow>
            <DetailRow label="Type">
              {TRANSACTION_TYPE_LABELS[txn.transaction_type] ?? txn.transaction_type}
            </DetailRow>
            <DetailRow label="Amount">
              <span className="tabular-nums text-base">
                {formatCurrency(txn.amount, txn.currency ?? DEFAULT_CURRENCY)}
              </span>
            </DetailRow>
            <DetailRow label="Payment method">
              {txn.payment_method
                ? (PAYMENT_METHOD_LABELS[txn.payment_method] ??
                  String(txn.payment_method).replace(/_/g, ' '))
                : '—'}
            </DetailRow>
            <DetailRow label="Reference">
              <span className="font-mono text-xs">
                {txn.external_reference ?? '—'}
              </span>
            </DetailRow>
            <DetailRow label="Related order">
              {txn.order_id ? (
                <Link
                  to={`/account/orders/${txn.order_id}`}
                  className="font-semibold text-[#257DC1] hover:underline"
                >
                  View order
                </Link>
              ) : (
                '—'
              )}
            </DetailRow>
            <DetailRow label="Date">
              {txn.created_at
                ? new Date(txn.created_at).toLocaleString(DEFAULT_LOCALE)
                : '—'}
            </DetailRow>
          </dl>
        </section>
      )}
    </main>
  );
}
