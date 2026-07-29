import { Link } from 'react-router-dom';
import { useCart } from '@/lib/context/useCart';
import { formatCurrency } from '@/lib/utils';
import { storeCheckoutPath } from '@/lib/storeRouting';

function CartLineDetails({ item }) {
  return (
    <>
      {item.variant_label && (
        <p className="text-xs text-forest-muted">{item.variant_label}</p>
      )}
      {item.modifiers?.length > 0 && (
        <p className="mt-0.5 text-xs text-forest-muted">
          {item.modifiers.map((m) => m.name).join(', ')}
        </p>
      )}
      {item.item_notes && (
        <p className="mt-0.5 text-xs italic text-forest-muted">“{item.item_notes}”</p>
      )}
    </>
  );
}

export function CartSlideOver({ storeSlugParam, brandColor, currency, tableParam, dineInMode = false }) {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    totals,
  } = useCart();

  const basePath = storeCheckoutPath(storeSlugParam);
  const checkoutPath = tableParam ? `${basePath}?table=${encodeURIComponent(tableParam)}` : basePath;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-forest-dark/40 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className="cart-slide-over fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-2xl"
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="border-b border-cream-dark px-5 py-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-forest">Your order</h2>
            <button
              type="button"
              onClick={closeCart}
              className="rounded-full p-2 text-forest-muted transition hover:bg-sage"
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>
          {dineInMode && tableParam && (
            <p className="mt-2 inline-flex rounded-full bg-sage px-3 py-1 text-xs font-medium text-forest">
              Table {tableParam}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-forest-muted">Your cart is empty.</p>
              <button
                type="button"
                onClick={closeCart}
                className="text-sm font-semibold text-forest underline"
              >
                Back to menu
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-cream-dark">
              {items.map((item) => {
                const modifiersTotal = (item.modifiers ?? []).reduce(
                  (sum, m) => sum + (parseFloat(String(m.price_delta ?? 0)) || 0),
                  0,
                );
                const unit = (parseFloat(item.unit_price ?? item.price) || 0) + modifiersTotal;
                return (
                  <li key={item.line_id ?? item.product_id} className="flex gap-3 py-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal">{item.name}</p>
                      <CartLineDetails item={item} />
                      <p className="mt-1 text-sm text-forest-muted">
                        {formatCurrency(unit, currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.line_id ?? item.product_id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-cream-dark text-sm text-forest"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.line_id ?? item.product_id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-cream-dark text-sm text-forest"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.line_id ?? item.product_id)}
                        className="ml-1 text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-cream-dark px-5 py-5">
            <div className="mb-1 flex justify-between text-sm text-forest-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal, currency)}</span>
            </div>
            <div className="mb-3 flex justify-between text-sm text-forest-muted">
              <span>Tax (16%)</span>
              <span>{formatCurrency(totals.tax, currency)}</span>
            </div>
            <div className="mb-5 flex justify-between text-base font-bold text-charcoal">
              <span>Total</span>
              <span style={{ color: brandColor }}>{formatCurrency(totals.total, currency)}</span>
            </div>
            <Link
              to={checkoutPath}
              onClick={closeCart}
              className="block w-full rounded-full bg-forest py-3.5 text-center text-sm font-semibold text-white transition hover:bg-forest-dark active:scale-[0.98]"
            >
              {dineInMode ? 'Checkout & pay' : 'Proceed to Checkout'}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
