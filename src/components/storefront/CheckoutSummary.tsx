import { formatCurrency } from '@/lib/utils';

export function CheckoutSummary({
  items,
  totals,
  currency,
  brandColor,
  showDelivery = false,
  compact = false,
}) {
  return (
    <div
      className={
        compact
          ? 'space-y-3'
          : 'rounded-2xl border border-cream-dark bg-white p-5 shadow-sm'
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg text-forest">Your order</h3>
        <span className="text-xs text-forest-muted">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <ul className="divide-y divide-cream-dark text-sm">
        {items.map((item) => {
          const modifiersTotal = (item.modifiers ?? []).reduce(
            (sum, m) => sum + (parseFloat(String(m.price_delta ?? 0)) || 0),
            0,
          );
          const lineTotal =
            (parseFloat(item.unit_price ?? item.price) + modifiersTotal) * item.quantity;
          return (
            <li key={item.line_id ?? item.product_id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-charcoal">
                    <span className="mr-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-cream px-1 text-xs font-semibold text-forest">
                      {item.quantity}
                    </span>
                    {item.name}
                    {item.variant_label ? (
                      <span className="font-normal text-forest-muted"> · {item.variant_label}</span>
                    ) : null}
                  </p>
                  {item.modifiers?.length > 0 && (
                    <p className="mt-0.5 text-xs text-forest-muted">
                      {item.modifiers.map((m) => m.name).join(', ')}
                    </p>
                  )}
                  {item.item_notes && (
                    <p className="mt-0.5 text-xs italic text-forest-muted">“{item.item_notes}”</p>
                  )}
                </div>
                <span className="shrink-0 tabular-nums text-charcoal">
                  {formatCurrency(lineTotal, currency)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="space-y-1.5 border-t border-cream-dark pt-3 text-sm">
        <div className="flex justify-between text-forest-muted">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatCurrency(totals.subtotal, currency)}</span>
        </div>
        {showDelivery && (
          <div className="flex justify-between text-forest-muted">
            <span>Delivery</span>
            <span className="tabular-nums">{formatCurrency(totals.delivery, currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-forest-muted">
          <span>VAT (16%)</span>
          <span className="tabular-nums">{formatCurrency(totals.tax, currency)}</span>
        </div>
        <div className="flex justify-between pt-2 text-base font-bold text-charcoal">
          <span>Total due</span>
          <span className="tabular-nums" style={{ color: brandColor }}>
            {formatCurrency(totals.total, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
