import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCart } from '@/lib/context/useCart';
import { useAuth } from '@/lib/context/useAuth';
import { storefrontApi } from '@/lib/api/services';
import { useAsync } from '@/hooks/useAsync';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { usePaymentMode } from '@/hooks/usePaymentMode';
import { formatCurrency, getStoreTheme } from '@/lib/utils';
import { estimateDeliveryFee } from '@/lib/deliveryFee';
import { DEFAULT_COUNTRY_CODE, DEFAULT_CURRENCY, DEFAULT_PHONE_PLACEHOLDER } from '@/lib/locale';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { internationalPhone, localPhone, validPhone, PHONE_ERROR } from '@/lib/phone';
import { storeHomePath, storeOrderTrackingPath } from '@/lib/storeRouting';
import { ensureGuestSessionId, qrSessionForStore } from '@/lib/qrSession';
import { CheckoutSummary } from '@/components/storefront/CheckoutSummary';
import { PaymentStatus } from '@/components/storefront/PaymentStatus';
import { ServiceBookingCalendar } from '@/components/scheduling/ServiceBookingCalendar';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';

const BASE_FULFILLMENT = [
  { value: 'dine_in', label: 'Dine-in', hint: 'Eat at the restaurant' },
  { value: 'self_pickup', label: 'Pickup', hint: 'Collect at the store' },
  { value: 'delivery', label: 'Delivery', hint: 'Brought to your address' },
] as const;

const RETAIL_FULFILLMENT = [
  { value: 'self_pickup', label: 'Pickup', hint: 'Collect at the store' },
  { value: 'delivery', label: 'Delivery', hint: 'Brought to your address' },
] as const;

function StepPill({ step, label, active, done }: { step: number; label: string; active: boolean; done: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs font-medium ${
        active ? 'text-forest' : done ? 'text-forest-muted' : 'text-forest-muted/60'
      }`}
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
          active
            ? 'bg-forest text-cream'
            : done
              ? 'bg-sage text-forest'
              : 'bg-cream-dark text-forest-muted'
        }`}
      >
        {done && !active ? '✓' : step}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

export default function CheckoutPage() {
  const { store_slug: storeSlugParam } = useParams();
  const navigate = useNavigate();
  const { items, totals, store, storeId, checkoutPayload, clearCart } = useCart();
  const { user } = useAuth();
  const simulated = usePaymentMode();
  const homePath = storeHomePath(storeSlugParam);

  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('self_pickup');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tableTouched, setTableTouched] = useState(false);
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [submitError, setSubmitError] = useState(null);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [addressLine, setAddressLine] = useState('');
  const [addressCity, setAddressCity] = useState('');

  const { data: storeData, loading: storeLoading } = useAsync(async () => {
    if (!storeSlugParam) throw new Error('Store not found');
    return storefrontApi.getStoreBySlug(storeSlugParam);
  }, [storeSlugParam]);

  const activeStore = store ?? storeData;
  const activeStoreId = storeId ?? storeData?.id;
  const { primary: brandColor } = getStoreTheme(activeStore);
  const currency = activeStore?.currency ?? DEFAULT_CURRENCY;
  const capabilities = useMarketplaceCapabilities(activeStore);
  const loading = storeLoading;
  const qrSession = qrSessionForStore(activeStoreId);

  const isDineIn = fulfillmentType === 'dine_in';

  const fulfillmentOptions = capabilities.supportsDineIn ? BASE_FULFILLMENT : RETAIL_FULFILLMENT;

  const { data: tables, loading: tablesLoading } = useAsync(async () => {
    if (!activeStoreId || !capabilities.supportsDineIn) return [];
    return storefrontApi.listTables(activeStoreId);
  }, [activeStoreId, capabilities.supportsDineIn]);

  const activeTables = useMemo(
    () => (tables ?? []).filter((t) => t.is_active !== false),
    [tables],
  );

  const linkedTableId = qrSession?.tableId ?? selectedTableId;
  const linkedTableNumber =
    qrSession?.tableNumber ??
    (selectedTableId ? activeTables.find((t) => t.id === selectedTableId)?.table_number : null);

  useEffect(() => {
    if (qrSession?.tableId) {
      setFulfillmentType('dine_in');
      setSelectedTableId(qrSession.tableId);
    }
  }, [qrSession?.tableId]);

  useEffect(() => {
    if (!phoneTouched && !phone && typeof user?.phone === 'string') setPhone(localPhone(user.phone));
  }, [phoneTouched, phone, user?.phone]);

  const isDelivery = fulfillmentType === 'delivery';
  const phoneValid = simulated || validPhone(phone);
  const tableValid = !isDineIn || Boolean(linkedTableId);
  const needsDeliveryAddress = isDelivery && !booking?.delivery_address;
  const addressValid = !needsDeliveryAddress || (addressLine.trim().length > 0 && addressCity.trim().length > 0);

  const checkoutTotals = useMemo(() => {
    const delivery = estimateDeliveryFee(activeStore, {
      fulfillmentType,
      deliveryLatitude: booking?.delivery_latitude,
      deliveryLongitude: booking?.delivery_longitude,
    });
    const total = Math.round((totals.total + delivery) * 100) / 100;
    return { ...totals, delivery, total };
  }, [activeStore, fulfillmentType, booking, totals]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeStoreId || items.length === 0 || submitLock.current) return;
    setPhoneTouched(true);
    setAddressTouched(true);
    if (isDineIn) setTableTouched(true);
    if (!phoneValid || !tableValid || !addressValid) return;
    submitLock.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: any = checkoutPayload(simulated ? '0970000000' : internationalPhone(phone), notes, {
        fulfillment_type: fulfillmentType,
        payment_method: 'mobile_money',
        scheduled_date: booking?.scheduled_date,
        scheduled_time: booking?.scheduled_time,
        delivery_address: isDineIn || !isDelivery ? undefined : booking?.delivery_address ?? {
          line1: addressLine.trim(), city: addressCity.trim(), country: activeStore?.country_code ?? DEFAULT_COUNTRY_CODE,
          ...(user?.full_name ? { contact_name: user.full_name } : {}), phone: phone ? internationalPhone(phone) : '',
        },
        delivery_latitude: isDineIn || !isDelivery ? undefined : booking?.delivery_latitude,
        delivery_longitude: isDineIn || !isDelivery ? undefined : booking?.delivery_longitude,
        table_id: isDineIn ? linkedTableId : undefined,
        qr_code_id: qrSession?.qrCodeId,
        guest_session_id: qrSession?.guestSessionId ?? ensureGuestSessionId(),
        order_source: qrSession?.tableId ? 'qr' : 'storefront',
      });
      payload.total = checkoutTotals.total;
      payload.currency = currency;

      // Guest checkout stays available; a signed-in customer's verified session
      // links the order to account history without trusting a client customer ID.
      const result = await storefrontApi.checkout(activeStoreId, payload, Boolean(user));
      setCheckoutResult(result);
      clearCart();
    } catch (err) {
      setSubmitError(err);
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream px-4 py-8">
        <div className="mx-auto max-w-lg space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (checkoutResult) {
    const paidOrder = checkoutResult.order;
    const checkoutDineIn = paidOrder?.fulfillment_type === 'dine_in' || isDineIn;

    const goAfterPay = () => {
      if (paidOrder?.id) {
        navigate(storeOrderTrackingPath(storeSlugParam, paidOrder.id));
        return;
      }
      navigate(homePath);
    };

    return (
      <div className="min-h-screen bg-cream px-4 py-8">
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <StepPill step={1} label="Order" active={false} done />
            <div className="h-px w-6 bg-sage sm:w-10" aria-hidden="true" />
            <StepPill step={2} label="Details" active={false} done />
            <div className="h-px w-6 bg-sage sm:w-10" aria-hidden="true" />
            <StepPill step={3} label="Pay" active done={false} />
          </div>
          <PaymentStatus
            ussdPayload={checkoutResult.ussd_payload ?? checkoutResult.qr_data}
            qrData={checkoutResult.qr_data ?? checkoutResult.ussd_payload}
            order={paidOrder}
            storeId={activeStoreId}
            storeSlugParam={storeSlugParam}
            currency={currency}
            brandColor={brandColor}
            collectionEnabled={Boolean(checkoutResult.collection_enabled)}
            collectionStatus={checkoutResult.collection_status ?? ''}
            collectionMessage={checkoutResult.collection_message ?? ''}
            collectionProvider={checkoutResult.collection_provider ?? ''}
            dineInMode={checkoutDineIn}
            onPaymentConfirmed={goAfterPay}
          />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream p-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage text-2xl text-forest" aria-hidden="true">
          ◌
        </div>
        <div>
          <p className="font-serif text-xl text-forest">Your cart is empty</p>
          <p className="mt-1 text-sm text-forest-muted">Add items from the menu to check out.</p>
        </div>
        <Link
          to={homePath}
          className="rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-white hover:bg-forest-dark"
        >
          {qrSession?.tableId ? 'Back to menu' : 'Back to store'}
        </Link>
      </div>
    );
  }

  const storeName = activeStore?.name ?? 'Store';
  const gridCols =
    fulfillmentOptions.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';

  return (
    <div className="min-h-screen bg-cream pb-28 md:pb-10">
      <header className="border-b border-cream-dark/80 bg-cream/90 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <Link
            to={homePath}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-muted transition hover:text-forest"
          >
            <span aria-hidden="true">←</span>
            {qrSession?.tableId ? 'Menu' : storeName}
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <StepPill step={1} label="Order" active={false} done />
            <div className="h-px w-4 bg-cream-dark sm:w-8" aria-hidden="true" />
            <StepPill step={2} label="Details" active done={false} />
            <div className="h-px w-4 bg-cream-dark sm:w-8" aria-hidden="true" />
            <StepPill step={3} label="Pay" active={false} done={false} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-4xl gap-6 px-4 py-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-5">
          <div>
            <h1 className="font-serif text-2xl text-forest sm:text-3xl">Checkout</h1>
            <p className="mt-1 text-sm text-forest-muted">
              {simulated ? 'Choose pickup or delivery, then rehearse the payment. No money moves.' : 'Choose how you’d like your order, then pay with mobile money.'}
            </p>
          </div>

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-5">
            {!capabilities.isService && (
              <section className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-charcoal">How will you get it?</h2>
                <p className="mt-0.5 text-xs text-forest-muted">
                  {capabilities.supportsDineIn
                    ? 'Dine-in, pickup, or delivery'
                    : 'Pickup or delivery'}
                </p>
                <div
                  className={`mt-3 grid grid-cols-1 gap-2 ${gridCols}`}
                  role="radiogroup"
                  aria-label="Fulfillment"
                >
                  {fulfillmentOptions.map((opt) => {
                    const selected = fulfillmentType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-label={opt.label}
                        aria-checked={selected}
                        onClick={() => setFulfillmentType(opt.value)}
                        className={`rounded-xl border px-3 py-3 text-left transition ${
                          selected
                            ? 'border-forest bg-sage/40 ring-1 ring-forest/30'
                            : 'border-cream-dark bg-cream/40 hover:border-forest/25'
                        }`}
                      >
                        <p className={`text-sm font-semibold ${selected ? 'text-forest' : 'text-charcoal'}`}>
                          {opt.label}
                        </p>
                        <p className="mt-0.5 text-xs text-forest-muted">{opt.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {isDineIn && (
              <section className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-charcoal">Your table</h2>
                {qrSession?.tableId ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-forest/15 bg-sage/50 px-4 py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest text-sm font-bold text-cream">
                      T{qrSession.tableNumber}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-forest">
                        Table {qrSession.tableNumber}
                      </p>
                      <p className="text-xs text-forest-muted">Linked from your QR scan</p>
                    </div>
                  </div>
                ) : tablesLoading ? (
                  <Skeleton className="mt-3 h-24 w-full rounded-xl" />
                ) : activeTables.length === 0 ? (
                  <p className="mt-3 text-sm text-forest-muted">
                    No tables are set up yet. Ask staff for your table number or scan the QR at your
                    seat.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-forest-muted">Select where you&apos;re seated</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {activeTables.map((table) => {
                        const selected = selectedTableId === table.id;
                        const label = table.label ?? `Table ${table.table_number}`;
                        return (
                          <button
                            key={table.id}
                            type="button"
                            onClick={() => setSelectedTableId(table.id)}
                            className={`rounded-xl border px-2 py-3 text-center transition ${
                              selected
                                ? 'border-forest bg-sage/40 ring-1 ring-forest/30'
                                : 'border-cream-dark bg-cream/40 hover:border-forest/25'
                            }`}
                          >
                            <span className="block text-sm font-bold text-charcoal">
                              {table.table_number}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-forest-muted">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {tableTouched && !tableValid && (
                      <p className="mt-2 text-xs text-red-600">Please select your table.</p>
                    )}
                  </>
                )}
              </section>
            )}

            {capabilities.supportsScheduling && !isDineIn && (
              <section className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-charcoal">Schedule</h2>
                <ServiceBookingCalendar
                  showMap={capabilities.category === 'ON_SITE_SERVICE'}
                  onBook={setBooking}
                />
              </section>
            )}

            {needsDeliveryAddress && (
              <section className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-charcoal">Delivery address</h2>
                <p className="mt-1 text-xs text-forest-muted">Tell the business where to bring your order. Your contact name and payment phone are included automatically.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="delivery-line" className="mb-1.5 block text-sm font-medium text-charcoal">Street address</label>
                    <input id="delivery-line" type="text" autoComplete="street-address" required value={addressLine} onChange={event => setAddressLine(event.target.value)} onBlur={() => setAddressTouched(true)} aria-invalid={addressTouched && !addressLine.trim()} className="w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20" placeholder="Street and building number" />
                  </div>
                  <div>
                    <label htmlFor="delivery-city" className="mb-1.5 block text-sm font-medium text-charcoal">City or town</label>
                    <input id="delivery-city" type="text" autoComplete="address-level2" required value={addressCity} onChange={event => setAddressCity(event.target.value)} onBlur={() => setAddressTouched(true)} aria-invalid={addressTouched && !addressCity.trim()} className="w-full rounded-xl border border-cream-dark bg-white px-3 py-2.5 text-sm text-charcoal focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20" placeholder="e.g. Lusaka" />
                  </div>
                </div>
                {addressTouched && !addressValid && <p className="mt-2 text-xs text-red-700" role="alert">Enter a street address and city for delivery.</p>}
              </section>
            )}

            <section className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-charcoal">Payment</h2>
              <p className="mt-0.5 text-xs text-forest-muted">
                {simulated ? 'Local simulation: no phone prompt, charge or merchant payout.' : 'We\u2019ll send a mobile money prompt to this number'}
              </p>

              {!simulated && <div className="mt-4">
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-charcoal">
                  Mobile money phone
                </label>
                <PhoneInput
                  id="phone"
                  name="phone"
                  required
                  placeholder={DEFAULT_PHONE_PLACEHOLDER}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setPhoneTouched(true)}
                  aria-invalid={phoneTouched && !phoneValid}
                  className={`w-full rounded-xl border bg-cream/30 px-4 py-3 text-sm tabular-nums tracking-wide text-charcoal placeholder:text-forest-muted/50 focus:outline-none focus:ring-2 ${
                    phoneTouched && !phoneValid
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-cream-dark focus:border-forest/40 focus:ring-forest/15'
                  }`}
                />
                {phoneTouched && !phoneValid ? (
                  <p className="mt-1.5 text-xs text-red-600">{PHONE_ERROR}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-forest-muted">MTN, Airtel, or Zamtel</p>
                )}
              </div>}
              <div className="mt-4">
                <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-charcoal">
                  Order notes <span className="font-normal text-forest-muted">(optional)</span>
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  placeholder={
                    isDineIn
                      ? 'Allergies, spice level, extra napkins…'
                      : isDelivery
                        ? 'Gate code, landmark, delivery instructions…'
                        : 'Special requests…'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full resize-none rounded-xl border border-cream-dark bg-cream/30 px-4 py-3 text-sm text-charcoal placeholder:text-forest-muted/50 focus:border-forest/40 focus:outline-none focus:ring-2 focus:ring-forest/15"
                />
              </div>
            </section>

            {submitError && <ErrorState error={submitError} title="Checkout failed" />}

            <button
              type="submit"
              disabled={submitting}
              className="hidden w-full rounded-full bg-forest py-3.5 text-sm font-semibold text-white transition hover:bg-forest-dark active:scale-[0.98] disabled:opacity-60 md:block"
            >
              {submitting
                ? 'Placing order…'
                : simulated
                  ? `Simulate order · ${formatCurrency(checkoutTotals.total, currency)}`
                : isDineIn
                  ? `Pay ${formatCurrency(checkoutTotals.total, currency)}`
                  : `Place order · ${formatCurrency(checkoutTotals.total, currency)}`}
            </button>
          </form>
        </div>

        <aside className="lg:sticky lg:top-6">
          <div className="rounded-2xl border border-cream-dark bg-cream-dark/30 p-5">
            {isDineIn && linkedTableNumber && (
              <p className="mb-3 inline-flex rounded-full bg-sage px-3 py-1 text-xs font-semibold text-forest">
                Dine-in · Table {linkedTableNumber}
              </p>
            )}
            <CheckoutSummary
              items={items}
              totals={checkoutTotals}
              currency={currency}
              brandColor={brandColor}
              showDelivery={isDelivery}
              compact
            />
            <p className="mt-4 text-xs leading-relaxed text-forest-muted">
              {simulated ? 'Test payment only. No money moves and no phone approval is needed.' : isDineIn
                ? 'After you approve payment on your phone, the kitchen gets your ticket.'
                : 'You confirm payment on your phone after placing the order.'}
            </p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cream-dark bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-forest-muted">Total</p>
            <p className="truncate text-lg font-bold tabular-nums" style={{ color: brandColor }}>
              {formatCurrency(checkoutTotals.total, currency)}
            </p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="shrink-0 rounded-full bg-forest px-6 py-3.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? 'Placing…' : simulated ? 'Simulate order' : isDineIn ? 'Pay now' : 'Place order'}
          </button>
        </div>
      </div>
    </div>
  );
}
