import { formatCurrency } from '@/lib/utils';
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/lib/locale';
import { statusLabelForOrder } from '@/lib/workflows';

function modifiersFromItem(item) {
  const attrs = item?.variant_attributes ?? {};
  const extra = attrs.extra ?? attrs.Extra ?? {};
  const mods = extra.modifiers ?? item?.modifiers ?? [];
  if (!Array.isArray(mods)) return [];
  return mods.map((m) => (typeof m === 'string' ? m : m.name ?? m.label)).filter(Boolean);
}

function lineTotal(item) {
  const qty = item.quantity ?? 1;
  const unit = parseFloat(String(item.unit_price ?? item.price ?? 0)) || 0;
  return unit * qty;
}

function fulfillmentLabel(order) {
  if (order.fulfillment_type === 'dine_in') {
    return `Dine-in${order.table_number ? ` · Table ${order.table_number}` : ''}`;
  }
  if (order.fulfillment_type === 'delivery') return 'Delivery';
  if (order.fulfillment_type === 'self_pickup' || order.fulfillment_type === 'pickup') {
    return 'Pickup';
  }
  return order.fulfillment_type?.replace(/_/g, ' ') ?? '—';
}

/** Settled-order receipt with print-optimized layout. */
export function OrderReceipt({
  order,
  currency = DEFAULT_CURRENCY,
  brandColor = '#383d92',
  dineInMode = false,
  storeName,
  showPrintButton = true,
}) {
  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const orderCurrency = order.currency ?? currency;
  const isDineIn = dineInMode || order.fulfillment_type === 'dine_in';
  const displayStore = storeName ?? order.store_name;
  const subtotal =
    order.subtotal ??
    items.reduce((sum, item) => sum + lineTotal(item), 0);
  const tax = order.tax ?? order.tax_amount;
  const total = order.total ?? order.total_amount;

  return (
    <div id="receipt-print" className="receipt-root rounded-2xl border border-cream-dark bg-white p-5 shadow-sm print:border-0 print:shadow-none">
      {/* Print header — hidden on screen if store name already shown in page */}
      <div className="receipt-print-header mb-4 hidden border-b border-dashed border-charcoal/20 pb-4 print:block">
        <p className="text-center text-lg font-bold text-charcoal">{displayStore ?? 'Receipt'}</p>
        <p className="text-center text-xs text-charcoal/70">Thank you for your order</p>
      </div>

      <div className="mb-4 flex items-start justify-between gap-3 print:mb-3">
        <div>
          <h3 className="font-serif text-lg text-forest print:text-base print:font-bold print:text-charcoal">
            Order #{order.order_number ?? order.id?.slice(0, 8)}
          </h3>
          {displayStore && (
            <p className="text-xs text-forest-muted print:text-charcoal">{displayStore}</p>
          )}
          {order.created_at && (
            <p className="text-xs text-forest-muted print:text-charcoal/80">
              {new Date(order.created_at).toLocaleString(DEFAULT_LOCALE)}
            </p>
          )}
        </div>
        <span className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-forest print:hidden">
          {statusLabelForOrder(order)}
        </span>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 border-b border-cream-dark pb-4 text-xs print:mb-3 print:pb-3">
        <div>
          <dt className="uppercase tracking-wide text-forest-muted print:text-charcoal/60">Fulfillment</dt>
          <dd className="mt-0.5 font-medium text-charcoal">{fulfillmentLabel(order)}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide text-forest-muted print:text-charcoal/60">Payment</dt>
          <dd className="mt-0.5 font-medium text-charcoal">
            {order.payment_method === 'pay_at_counter' ? 'Pay at counter' : 'Mobile money'}
          </dd>
        </div>
        {order.customer_phone && (
          <div className="col-span-2">
            <dt className="uppercase tracking-wide text-forest-muted print:text-charcoal/60">Phone</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-charcoal">{order.customer_phone}</dd>
          </div>
        )}
        <div className="col-span-2 print:block hidden">
          <dt className="uppercase tracking-wide text-charcoal/60">Status</dt>
          <dd className="mt-0.5 font-medium text-charcoal">{statusLabelForOrder(order)}</dd>
        </div>
      </dl>

      {items.length > 0 && (
        <>
          <table className="mb-4 w-full text-sm print:mb-3">
            <thead className="border-b border-cream-dark text-left text-xs uppercase tracking-wide text-forest-muted print:text-charcoal/60">
              <tr>
                <th className="pb-2 pr-2 font-medium">Item</th>
                <th className="pb-2 pr-2 text-center font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-dark/80">
              {items.map((item, index) => {
                const mods = modifiersFromItem(item);
                const notes = item.item_notes;
                const name = item.name ?? item.product_name ?? 'Item';
                const qty = item.quantity ?? 1;
                const amount = lineTotal(item);
                return (
                  <tr key={item.id ?? item.product_id ?? index}>
                    <td className="py-2.5 pr-2 align-top">
                      <span className="font-medium text-charcoal">{name}</span>
                      {mods.length > 0 && (
                        <p className="mt-0.5 text-xs text-forest-muted print:text-charcoal/70">
                          + {mods.join(', ')}
                        </p>
                      )}
                      {notes && (
                        <p className="mt-0.5 text-xs italic text-forest-muted print:text-charcoal/70">
                          “{notes}”
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 pr-2 text-center tabular-nums text-charcoal">{qty}</td>
                    <td className="py-2.5 text-right tabular-nums text-charcoal">
                      {formatCurrency(amount, orderCurrency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="space-y-1 border-t border-cream-dark pt-3 text-sm print:text-xs">
            {subtotal != null && (
              <div className="flex justify-between text-forest-muted print:text-charcoal/80">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(subtotal, orderCurrency)}</span>
              </div>
            )}
            {tax != null && Number(tax) > 0 && (
              <div className="flex justify-between text-forest-muted print:text-charcoal/80">
                <span>VAT</span>
                <span className="tabular-nums">{formatCurrency(tax, orderCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-base font-bold text-charcoal print:text-sm">
              <span>Total</span>
              <span className="tabular-nums" style={{ color: brandColor }}>
                {formatCurrency(total, orderCurrency)}
              </span>
            </div>
          </div>
        </>
      )}

      {order.notes && (
        <p className="mt-4 border-t border-cream-dark pt-3 text-xs italic text-forest-muted print:mt-3 print:text-charcoal/80">
          Notes: {order.notes}
        </p>
      )}

      <p className="receipt-print-footer mt-4 hidden text-center text-[10px] text-charcoal/60 print:mt-6 print:block">
        Powered by Geepay · {new Date().toLocaleDateString(DEFAULT_LOCALE)}
      </p>

      {showPrintButton && (
        <button
          type="button"
          onClick={() => window.print()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-cream-dark py-2.5 text-sm font-semibold text-forest-muted transition hover:border-forest hover:text-forest print:hidden"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print receipt
        </button>
      )}
    </div>
  );
}

export default OrderReceipt;
