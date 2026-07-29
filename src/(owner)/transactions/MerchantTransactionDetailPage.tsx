import { Link, Navigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { ownerApi } from '@/lib/api/services';
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
    <div className="flex items-start justify-between gap-4 border-b border-cream-dark py-3 last:border-0">
      <dt className="text-sm text-forest-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-charcoal">{children}</dd>
    </div>
  );
}

export default function MerchantTransactionDetailPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStoreId } = useMarketplace();
  const { transactionId } = useParams();

  const { data, loading, error, retry } = useAsync(async () => {
    if (!selectedStoreId || !transactionId) return null;
    const res = await ownerApi.getTransaction(selectedStoreId, transactionId);
    return (res?.transaction ?? res) as Transaction;
  }, [selectedStoreId, transactionId]);

  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  const txn = data as Transaction | null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link to="/portal/owner/transactions" className="text-sm text-forest-muted hover:text-forest">
        ← Back to transactions
      </Link>
      <h1 className="text-2xl font-bold text-charcoal">Transaction Details</h1>

      {!selectedStoreId ? (
        <p className="text-sm text-forest-muted">Select a store to view this transaction.</p>
      ) : loading ? (
        <TableSkeleton rows={6} cols={2} />
      ) : error ? (
        <ErrorState error={error} onRetry={retry} />
      ) : !txn ? (
        <p className="text-sm text-forest-muted">Transaction not found.</p>
      ) : (
        <div className="dashboard-card space-y-1 p-5">
          <dl>
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
              <span className="font-mono text-xs">{txn.external_reference ?? '—'}</span>
            </DetailRow>
            <DetailRow label="Order">
              {txn.order_id ? (
                <Link
                  to="/portal/owner/orders"
                  className="font-mono text-xs text-forest hover:underline"
                >
                  #{txn.order_id.slice(0, 8)}
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
            <DetailRow label="Transaction ID">
              <span className="break-all font-mono text-xs">{txn.id}</span>
            </DetailRow>
          </dl>
        </div>
      )}
    </div>
  );
}
