import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { storefrontApi } from '@/lib/api/services';
import { storeHomePath } from '@/lib/storeRouting';
import { useAsync } from '@/hooks/useAsync';
import { getStoreTheme } from '@/lib/utils';
import { DEFAULT_CURRENCY } from '@/lib/locale';
import { qrSessionForStore } from '@/lib/qrSession';
import { statusLabelForOrder } from '@/lib/workflows';
import { OrderReceipt } from '@/components/storefront/OrderReceipt';
import { OrderStatusTracker } from '@/components/storefront/OrderStatusTracker';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';

const POLL_MS = 8000;
const TERMINAL = new Set(['completed', 'cancelled']);

/** Public order tracking — receipt + live status after checkout. */
export default function OrderTrackingPage() {
  const { store_slug: storeSlugParam, orderId } = useParams();
  const homePath = storeHomePath(storeSlugParam);
  const [liveOrder, setLiveOrder] = useState(null);

  const { data: storeData, loading: storeLoading } = useAsync(async () => {
    if (!storeSlugParam) throw new Error('Store not found');
    return storefrontApi.getStoreBySlug(storeSlugParam);
  }, [storeSlugParam]);

  const storeId = storeData?.id;
  const currency = storeData?.currency ?? DEFAULT_CURRENCY;
  const { primary: brandColor } = getStoreTheme(storeData);
  const qrSession = qrSessionForStore(storeId);

  const {
    data: order,
    loading: orderLoading,
    error: orderError,
    retry,
  } = useAsync(async () => {
    if (!storeId || !orderId) return null;
    const data = await storefrontApi.getOrder(storeId, orderId);
    return data.order ?? data;
  }, [storeId, orderId]);

  useEffect(() => {
    if (order) setLiveOrder(order);
  }, [order]);

  useEffect(() => {
    if (!storeId || !orderId) return undefined;
    const id = setInterval(async () => {
      try {
        const data = await storefrontApi.getOrder(storeId, orderId);
        const next = data.order ?? data;
        setLiveOrder(next);
        if (TERMINAL.has(next?.status)) clearInterval(id);
      } catch {
        /* keep last good snapshot */
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [storeId, orderId]);

  const isDineIn =
    liveOrder?.fulfillment_type === 'dine_in' || Boolean(qrSession?.tableId);
  const isLive = liveOrder && !TERMINAL.has(liveOrder.status);

  if (storeLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-cream px-4 py-8">
        <div className="mx-auto max-w-lg space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (orderError || !liveOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-4">
        <ErrorState error={orderError ?? new Error('Order not found')} onRetry={retry} title="Order not found" />
      </div>
    );
  }

  const orderLabel = liveOrder.order_number ?? liveOrder.id?.slice(0, 8);

  return (
    <div className="min-h-screen bg-cream pb-10 print:bg-white">
      <header className="border-b border-cream-dark/80 bg-cream/90 px-4 py-4 backdrop-blur-sm print:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <Link to={homePath} className="text-sm font-medium text-forest-muted hover:text-forest">
            ← {isDineIn ? 'Menu' : storeData?.name ?? 'Store'}
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-cream-dark px-3 py-1.5 text-xs font-semibold text-forest-muted hover:border-forest hover:text-forest"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-6">
        <div className="print:hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-muted">
            {isDineIn ? 'Your table order' : 'Order tracking'}
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
            <h1 className="font-serif text-2xl text-forest">Order #{orderLabel}</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                liveOrder.status === 'completed'
                  ? 'bg-sage text-forest'
                  : liveOrder.status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-50 text-amber-900'
              }`}
            >
              {statusLabelForOrder(liveOrder)}
            </span>
          </div>
          {isLive && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-forest-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest" />
              Live updates — refreshes automatically
            </p>
          )}
          {isDineIn && liveOrder.table_number && (
            <p className="mt-2 inline-flex rounded-full bg-sage px-3 py-1 text-xs font-semibold text-forest">
              Table {liveOrder.table_number}
            </p>
          )}
        </div>

        {liveOrder.status !== 'cancelled' && (
          <div className="print:hidden">
            <OrderStatusTracker order={liveOrder} dineInMode={isDineIn} />
          </div>
        )}

        <OrderReceipt
          order={liveOrder}
          currency={currency}
          brandColor={brandColor}
          dineInMode={isDineIn}
          storeName={storeData?.name}
          showPrintButton={false}
        />

        {isDineIn && liveOrder.status !== 'cancelled' && (
          <Link
            to={homePath}
            className="block w-full rounded-full border border-forest/25 py-3 text-center text-sm font-semibold text-forest transition hover:border-forest hover:bg-sage/40 print:hidden"
          >
            Order more for this table
          </Link>
        )}

        {!isDineIn && liveOrder.status === 'completed' && (
          <Link
            to={homePath}
            className="block w-full rounded-full bg-forest py-3 text-center text-sm font-semibold text-white transition hover:bg-forest-dark print:hidden"
          >
            Back to {storeData?.name ?? 'store'}
          </Link>
        )}
      </div>
    </div>
  );
}
