import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCodeDisplay } from './QrCodeDisplay';
import { useOrderPolling } from '../../hooks/useOrderPolling';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_CURRENCY, DEFAULT_PHONE_PLACEHOLDER } from '@/lib/locale';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { internationalPhone, localPhone, validPhone, PHONE_ERROR } from '@/lib/phone';
import { storeOrderTrackingPath } from '@/lib/storeRouting';
import { storefrontApi } from '@/lib/api/services';
import { usePaymentMode } from '@/hooks/usePaymentMode';
import { userMessage } from '@/lib/userMessage';

const FAILED_COLLECTION = new Set(['failed', 'failure', 'rejected', 'cancelled', 'canceled']);

function WaitingPulse() {
  return (
    <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center" aria-hidden="true">
      <span className="absolute inset-0 animate-ping rounded-full bg-forest/20" />
      <span className="absolute inset-1 rounded-full bg-forest/10" />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-forest text-cream">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </span>
    </div>
  );
}

function SuccessIcon() {
  return (
    <div
      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest text-cream"
      aria-hidden="true"
    >
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function OrderSummaryCard({ order, currency, brandColor, statusLabel }) {
  return (
    <div className="rounded-2xl border border-cream-dark bg-cream/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forest-muted">Order</p>
          <p className="text-lg font-bold text-charcoal">
            #{order.order_number ?? order.id?.slice(0, 8)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-forest-muted">Amount</p>
          <p className="text-lg font-bold tabular-nums" style={{ color: brandColor }}>
            {formatCurrency(order.total ?? order.total_amount, currency)}
          </p>
        </div>
      </div>
      {statusLabel && (
        <p className="mt-3 inline-flex rounded-full bg-white px-2.5 py-0.5 text-xs font-medium capitalize text-charcoal">
          {statusLabel.replace(/_/g, ' ')}
        </p>
      )}
    </div>
  );
}

/** Post-checkout payment panel — mobile-money collect primary, USSD/QR fallback. */
export function PaymentStatus({
  ussdPayload,
  qrData,
  order,
  storeId,
  storeSlugParam,
  currency = DEFAULT_CURRENCY,
  brandColor = '#257DC1',
  onPaymentConfirmed,
  collectionEnabled = false,
  collectionStatus: initialCollectionStatus = '',
  collectionMessage: _providerMessage = '',
  collectionProvider = '',
  dineInMode = false,
}) {
  const simulated = usePaymentMode();
  const [copied, setCopied] = useState(false);
  const [retryPhone, setRetryPhone] = useState(localPhone(order?.customer_phone));
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);
  const [localCollection, setLocalCollection] = useState({
    status: initialCollectionStatus,
    provider: collectionProvider,
  });
  const orderId = order?.id;
  const dialPayload = ussdPayload || qrData || '';

  const { status, isPaid, confirmPaid, polling, error, collection } = useOrderPolling(
    storeId,
    orderId,
    Boolean(orderId),
  );

  const activeCollection = {
    status: collection?.status || localCollection.status,
    provider: collection?.provider || localCollection.provider,
    enabled: collection?.enabled ?? collectionEnabled,
  };
  const collectionFailed = FAILED_COLLECTION.has(String(activeCollection.status).toLowerCase());
  const showCollectUI = activeCollection.enabled || collectionEnabled;
  const timedOut = !polling && !isPaid && !collectionFailed && Boolean(orderId);
  const statusLabel = activeCollection.status || status || 'pending';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dialPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleRetryCollect = async () => {
    if (!storeId || !orderId) return;
    if (!simulated && !validPhone(retryPhone)) { setRetryError(new Error(PHONE_ERROR)); return; }
    setRetrying(true);
    setRetryError(null);
    try {
      const data = await storefrontApi.collectPayment(storeId, orderId, {
        phone_number: simulated ? '0970000000' : internationalPhone(retryPhone),
        retry: true,
      });
      setLocalCollection({
        status: data.collection_status ?? 'pending',
        provider: data.collection_provider ?? '',
      });
      confirmPaid();
    } catch (err) {
      setRetryError(err);
    } finally {
      setRetrying(false);
    }
  };

  const trackingPath =
    order?.id && storeSlugParam !== undefined
      ? storeOrderTrackingPath(storeSlugParam, order.id)
      : null;

  const shellClass =
    'overflow-hidden rounded-2xl border border-cream-dark bg-white shadow-sm';

  if (isPaid) {
    return (
      <div className={`${shellClass} p-6 text-center`}>
        <SuccessIcon />
        <h3 className="font-serif text-2xl text-forest">{simulated ? 'Simulated payment confirmed' : 'Payment confirmed'}</h3>
        {simulated && <p className="mt-2 text-sm text-forest-muted">Local test only. No money has moved.</p>}
        <p className="mt-2 text-sm text-forest-muted">
          Order #{order?.order_number ?? order?.id?.slice(0, 8)} is paid
          {dineInMode ? ' — the kitchen has your ticket.' : '.'}
        </p>
        {order && (
          <div className="mt-4">
            <OrderSummaryCard
              order={order}
              currency={currency}
              brandColor={brandColor}
              statusLabel="paid"
            />
          </div>
        )}
        <div className="mt-5 flex flex-col gap-2">
          {trackingPath && (
            <Link
              to={trackingPath}
              className="w-full rounded-full bg-forest py-3.5 text-sm font-semibold text-white transition hover:bg-forest-dark active:scale-[0.98]"
            >
              {dineInMode ? 'Track kitchen status' : 'View receipt & track order'}
            </Link>
          )}
          {onPaymentConfirmed && (
            <button
              type="button"
              onClick={onPaymentConfirmed}
              className={`w-full rounded-full py-3 text-sm font-semibold transition active:scale-[0.98] ${
                trackingPath
                  ? 'border border-cream-dark text-forest-muted hover:border-forest hover:text-forest'
                  : 'bg-forest text-white hover:bg-forest-dark'
              }`}
            >
              {dineInMode ? 'Back to menu' : 'Continue shopping'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (showCollectUI) {

    return (
      <div className={shellClass}>
        <div className="border-b border-cream-dark bg-gradient-to-b from-sage/30 to-white px-6 py-6 text-center">
          {!collectionFailed && <WaitingPulse />}
          {collectionFailed && (
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <h3 className="font-serif text-xl text-forest">
            {collectionFailed ? 'Payment not completed' : simulated ? 'Checking simulated payment' : 'Approve on your phone'}
          </h3>
          <p className="mt-1 text-sm text-forest-muted">
            {simulated ? 'Local test only. No charge or phone prompt. Check the result before retrying.' : collectionFailed
              ? 'Payment was not completed. Check your payment history before trying again. If you were charged, contact the business instead of paying again.'
              : 'Check your phone for the mobile-money prompt and approve it if the amount is correct. This page will check the result. Do not pay again while it is pending.'}
          </p>
        </div>

        <div className="space-y-4 p-6">
          {order && (
            <OrderSummaryCard
              order={order}
              currency={currency}
              brandColor={brandColor}
              statusLabel={statusLabel}
            />
          )}

          {!collectionFailed && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4">
              <p className="text-xs font-semibold text-amber-950">What to do</p>
              <ol className="mt-2 space-y-2">
                {(simulated ? ['No phone approval is needed', 'Payment status is stored by the test provider', 'This page updates automatically'] : [
                  'Check your phone for the payment notification',
                  'Enter your mobile money PIN to approve',
                  'This page updates automatically when paid',
                ]).map((step, i) => (
                  <li key={step} className="flex items-start gap-2.5 text-xs text-amber-900">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              {polling && (
                <p className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-forest">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest" />
                  Checking payment status…
                </p>
              )}
              {timedOut && (
                <div className="mt-3 border-t border-amber-200/60 pt-3 text-center">
                  <p className="text-xs font-medium text-amber-950">Still waiting?</p>
                  <button
                    type="button"
                    onClick={confirmPaid}
                    className="mt-2 rounded-full border border-forest/30 px-4 py-1.5 text-xs font-semibold text-forest"
                  >
                    Check again
                  </button>
                </div>
              )}
            </div>
          )}

          {collectionFailed && (
            <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <label className="block text-xs font-medium text-red-900" htmlFor="retry-phone">
                Phone number
              </label>
              {!simulated && <PhoneInput
                id="retry-phone"
                name="phone"
                value={retryPhone}
                onChange={(e) => setRetryPhone(e.target.value)}
                className="w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm tabular-nums text-charcoal"
                placeholder={DEFAULT_PHONE_PLACEHOLDER}
              />}
              <button
                type="button"
                onClick={handleRetryCollect}
                disabled={retrying || (!simulated && !validPhone(retryPhone))}
                className="w-full rounded-full bg-forest py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {retrying ? 'Sending…' : simulated ? 'Retry simulated payment' : 'Send new payment prompt'}
              </button>
              {retryError && (
                  <p role="alert" className="text-xs text-red-700">{userMessage(retryError, 'Could not confirm the payment result. Check its status before trying again. If you were charged, do not pay again; contact the business.')}</p>
              )}
            </div>
          )}

          {error && !collectionFailed && (
            <p className="text-center text-xs text-red-600">
              Could not verify payment. We&apos;ll keep checking automatically.
            </p>
          )}

          {trackingPath && (
            <p className="text-center text-xs text-forest-muted">
              Already paid?{' '}
              <Link to={trackingPath} className="font-semibold text-forest underline">
                View your receipt
              </Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <div className="border-b border-cream-dark bg-gradient-to-b from-sage/30 to-white px-6 py-6 text-center">
        <WaitingPulse />
        <h3 className="font-serif text-xl text-forest">Pay with mobile money</h3>
        <p className="mt-1 text-sm text-forest-muted">Dial the USSD code or scan the QR below</p>
      </div>

      <div className="space-y-4 p-6">
        {order && (
          <OrderSummaryCard order={order} currency={currency} brandColor={brandColor} statusLabel={status} />
        )}

        <div className="rounded-2xl bg-cream p-4 text-center">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-forest-muted">
            USSD code
          </p>
          <p className="font-mono text-xl font-bold tracking-wider text-forest">{dialPayload}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 text-xs font-semibold text-forest underline"
          >
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>

        {dialPayload && (
          <div className="flex justify-center rounded-2xl border border-cream-dark bg-white p-4">
            <QrCodeDisplay text={dialPayload} moduleSize={5} margin={4} ariaLabel="USSD payment QR code" />
          </div>
        )}

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4">
          <p className="text-xs font-semibold text-amber-950">How to pay</p>
          <ol className="mt-2 space-y-2">
            {[
              'Dial the USSD code on your phone',
              'Enter your PIN to confirm payment',
              'Tap “I have paid” once done',
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-2.5 text-xs text-amber-900">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200/80 text-[10px] font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <button
          type="button"
          onClick={confirmPaid}
          disabled={polling}
          className="w-full rounded-full bg-forest py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {polling ? 'Checking payment…' : 'I have paid'}
        </button>

        {error && (
          <p className="text-center text-xs text-red-600">
            Could not verify payment. We&apos;ll keep checking automatically.
          </p>
        )}

        {trackingPath && (
          <p className="text-center text-xs text-forest-muted">
            <Link to={trackingPath} className="font-semibold text-forest underline">
              View receipt / track order
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default PaymentStatus;
