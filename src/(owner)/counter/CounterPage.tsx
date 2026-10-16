import { userMessage } from '@/lib/userMessage';
import { useMemo, useState, useCallback, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { useAsync } from '@/hooks/useAsync';
import { useCart } from '@/lib/context/useCart';
import { ownerApi } from '@/lib/api/services';
import { normalizeMenuCategoryList, normalizeProductList } from '@/lib/normalizeApi';
import { formatCurrency, cn } from '@/lib/utils';
import { AddToCartButton } from '@/components/variants/AddToCartButton';
import { CounterCartProvider } from './CounterCartProvider';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/Skeleton';

const iconClass = 'h-4 w-4 shrink-0';

const Icons = {
  search: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  grid: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  menu: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  folder: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  ),
  pickup: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  ),
  dineIn: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M3 14h18M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
      />
    </svg>
  ),
  table: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 12h16M4 19h16" />
    </svg>
  ),
  minus: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
  ),
  plus: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  trash: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
  check: (
    <svg className="h-7 w-7 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  cart: (
    <svg className="h-5 w-5 text-forest-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
};

type TabOption = {
  id: string;
  label: string;
  icon?: ReactNode;
};

function CategoryTabs({
  options,
  value,
  onChange,
}: {
  options: TabOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-cream-dark bg-white p-1.5 shadow-sm">
      <div
        className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="tablist"
        aria-label="Menu categories"
      >
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition',
                active
                  ? 'bg-forest text-white shadow-md ring-2 ring-forest/20'
                  : 'bg-cream/40 text-forest-muted hover:bg-cream hover:text-charcoal',
              )}
            >
              {opt.icon}
              <span className="whitespace-nowrap">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FulfillmentTabs({
  value,
  onChange,
}: {
  value: 'self_pickup' | 'dine_in';
  onChange: (next: 'self_pickup' | 'dine_in') => void;
}) {
  const options: Array<{ id: 'self_pickup' | 'dine_in'; label: string; icon: ReactNode }> = [
    { id: 'self_pickup', label: 'Pickup', icon: Icons.pickup },
    { id: 'dine_in', label: 'Dine-in', icon: Icons.dineIn },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-0.5 rounded-lg bg-cream/70 p-0.5 ring-1 ring-cream-dark"
      role="tablist"
      aria-label="Order fulfillment"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition active:scale-[0.98]',
              active
                ? 'bg-white text-forest shadow-sm'
                : 'text-forest-muted hover:text-charcoal',
            )}
          >
            <span className={cn(active ? 'text-forest' : 'text-forest-muted/70')}>{opt.icon}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function productMatchesQuery(product: any, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    product.name?.toLowerCase().includes(q) ||
    product.description?.toLowerCase().includes(q) ||
    product.sku?.toLowerCase().includes(q)
  );
}

function CounterTill({ store }: { store: any }) {
  const { selectedStoreId } = useMarketplace();
  const { isFood } = useMarketplaceCapabilities(store);
  const { items, totals, addItem, updateQuantity, removeItem, clearCart, checkoutPayload } = useCart();
  const currency = store?.currency ?? 'ZMW';

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderNotes, setOrderNotes] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'self_pickup' | 'dine_in'>('self_pickup');
  const [tableId, setTableId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<any>(null);

  const {
    data: productData,
    loading,
    error,
    retry,
  } = useAsync(
    () => (selectedStoreId ? ownerApi.listProducts(selectedStoreId) : Promise.resolve([])),
    [selectedStoreId],
  );

  const { data: categoryData } = useAsync(
    () => (selectedStoreId && isFood ? ownerApi.listMenuCategories(selectedStoreId) : Promise.resolve([])),
    [selectedStoreId, isFood],
  );

  const { data: tableData } = useAsync(
    () => (selectedStoreId && isFood ? ownerApi.listTables(selectedStoreId) : Promise.resolve([])),
    [selectedStoreId, isFood],
  );

  const products = normalizeProductList(productData).filter((p) => p.is_active !== false);
  const categories = normalizeMenuCategoryList(categoryData);
  const tables = (tableData ?? []).filter((t: any) => t.is_active !== false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!productMatchesQuery(p, search.trim())) return false;
      if (isFood && categoryFilter === 'unassigned' && p.menu_category_id) return false;
      if (isFood && categoryFilter !== 'all' && categoryFilter !== 'unassigned') {
        if (p.menu_category_id !== categoryFilter) return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, isFood]);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedStoreId || !items.length) return;
    if (fulfillmentType === 'dine_in' && !tableId) {
      setSubmitError('Select a table for dine-in orders.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = checkoutPayload('', orderNotes.trim(), {
        payment_method: 'pay_at_counter',
        fulfillment_type: fulfillmentType,
        table_id: fulfillmentType === 'dine_in' ? tableId : undefined,
      });
      const result = await ownerApi.createCounterOrder(selectedStoreId, payload);
      const order = result?.order ?? result;
      setLastOrder(order);
      clearCart();
      setOrderNotes('');
      setTableId('');
      setFulfillmentType('self_pickup');
    } catch (err: any) {
      setSubmitError(userMessage(err, 'Could not place order. Try again.'));
    } finally {
      setSubmitting(false);
    }
  }, [selectedStoreId, items.length, checkoutPayload, orderNotes, fulfillmentType, tableId, clearCart]);

  const dismissSuccess = () => setLastOrder(null);

  const categoryTabs = useMemo<TabOption[]>(() => {
    if (!isFood || categories.length === 0) return [];
    return [
      { id: 'all', label: 'All items', icon: Icons.grid },
      ...categories.map((c: any) => ({ id: c.id, label: c.name, icon: Icons.menu })),
      { id: 'unassigned', label: 'Other', icon: Icons.folder },
    ];
  }, [isFood, categories]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
      {/* Product catalog */}
      <section className="min-w-0 flex-1 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-charcoal">Counter</h1>
            <p className="text-sm text-forest-muted">Take orders for walk-in customers</p>
          </div>
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className="field-input w-full pl-9"
              aria-label="Search products"
            />
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-forest-muted">
              {Icons.search}
            </span>
          </div>
        </div>

        {categoryTabs.length > 0 && (
          <CategoryTabs options={categoryTabs} value={categoryFilter} onChange={setCategoryFilter} />
        )}
        {loading && <TableSkeleton rows={4} cols={3} />}
        {error && <ErrorState error={error} onRetry={retry} />}
        {!loading && !error && filteredProducts.length === 0 && (
          <EmptyState
            title="No items available"
            description="Add products to your catalog to start taking counter orders."
          />
        )}

        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filteredProducts.map((product) => {
              const categoryLabel =
                product.category_name ?? product.menu_category_name ?? product.category ?? null;
              return (
                <AddToCartButton
                  key={product.id}
                  product={product}
                  onAdd={addItem}
                  className={[
                    'group flex flex-col overflow-hidden rounded-xl bg-white text-left',
                    'ring-1 ring-cream-dark transition',
                    'hover:ring-forest/25 hover:shadow-[0_10px_28px_-16px_rgba(8,12,48,0.28)]',
                    'active:scale-[0.98] active:duration-100',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/35',
                    'disabled:opacity-50 disabled:hover:shadow-none disabled:active:scale-100',
                  ].join(' ')}
                >
                  <div className="relative aspect-square overflow-hidden bg-sage-light">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl font-semibold tracking-tight text-forest-muted/30">
                        {product.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span
                      className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-forest text-white shadow-sm transition group-hover:scale-105"
                      aria-hidden="true"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 px-2.5 pb-2.5 pt-2">
                    <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug tracking-tight text-charcoal">
                      {product.name}
                    </h3>
                    {categoryLabel && (
                      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-forest-muted/80">
                        {categoryLabel}
                      </p>
                    )}
                    <p className="mt-auto pt-1 text-[13px] font-semibold tabular-nums text-forest">
                      {formatCurrency(product.price, currency)}
                    </p>
                  </div>
                </AddToCartButton>
              );
            })}
          </div>
        )}
      </section>

      {/* Till / cart panel */}
      <aside className="flex max-h-[min(72vh,42rem)] w-full shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-cream-dark lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)] lg:max-h-none lg:w-[22rem] xl:w-[24rem]">
        <div className="shrink-0 border-b border-cream-dark px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-base font-bold tracking-tight text-charcoal">Current order</h2>
            {items.length > 0 && (
              <span className="rounded-md bg-sage-light px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-forest">
                {totals.itemCount}
              </span>
            )}
          </div>
          <p className="text-xs text-forest-muted">
            {items.length ? `${totals.itemCount} item${totals.itemCount === 1 ? '' : 's'} in cart` : 'Tap items to add'}
          </p>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              {Icons.cart}
              <p className="text-sm font-medium text-forest-muted">Cart is empty</p>
              <p className="text-xs text-forest-muted/80">Tap items on the left to add them</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.line_id}
                className="flex gap-2.5 rounded-xl bg-cream/40 p-2.5 ring-1 ring-cream-dark/70"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-tight text-charcoal">{item.name}</p>
                  {item.variant_label && (
                    <p className="truncate text-[11px] text-forest-muted">{item.variant_label}</p>
                  )}
                  {item.item_notes && (
                    <p className="text-[11px] italic text-forest-muted">{item.item_notes}</p>
                  )}
                  <p className="mt-1 text-sm font-semibold tabular-nums text-forest">
                    {formatCurrency(parseFloat(item.unit_price) * item.quantity, currency)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center overflow-hidden rounded-lg bg-white ring-1 ring-cream-dark">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="flex h-8 w-8 items-center justify-center text-forest transition hover:bg-cream"
                      onClick={() => updateQuantity(item.line_id, item.quantity - 1)}
                    >
                      {Icons.minus}
                    </button>
                    <span className="min-w-[1.75rem] border-x border-cream-dark px-1 text-center text-sm font-bold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="flex h-8 w-8 items-center justify-center text-forest transition hover:bg-cream"
                      onClick={() => updateQuantity(item.line_id, item.quantity + 1)}
                    >
                      {Icons.plus}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700"
                    onClick={() => removeItem(item.line_id)}
                  >
                    {Icons.trash}
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sticky checkout foot: fulfillment, notes, totals, pay */}
        <div className="shrink-0 space-y-2.5 border-t border-cream-dark bg-white p-3 shadow-[0_-8px_24px_-16px_rgba(8,12,48,0.2)]">
          {isFood && (
            <>
              <FulfillmentTabs
                value={fulfillmentType}
                onChange={(next) => {
                  setFulfillmentType(next);
                  if (next === 'self_pickup') setTableId('');
                  setSubmitError(null);
                }}
              />
              {fulfillmentType === 'dine_in' && (
                <div>
                  <label
                    htmlFor="counter-table"
                    className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-forest-muted"
                  >
                    {Icons.table}
                    Table
                  </label>
                  <select
                    id="counter-table"
                    value={tableId}
                    onChange={(e) => {
                      setTableId(e.target.value);
                      setSubmitError(null);
                    }}
                    className="field-input w-full py-2 text-sm font-medium"
                  >
                    <option value="">Choose a table…</option>
                    {tables.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        Table {t.table_number}
                        {t.label ? ` — ${t.label}` : ''}
                      </option>
                    ))}
                  </select>
                  {tables.length === 0 && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-800">
                      <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No tables configured. Add tables under Tables, or switch to Pickup.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <input
            type="text"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Order notes (optional)"
            aria-label="Order notes"
            className="field-input w-full py-2 text-sm"
          />

          <div className="space-y-0.5 rounded-lg bg-cream/50 px-2.5 py-2 text-sm">
            <div className="flex justify-between text-xs text-forest-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(totals.subtotal, currency)}</span>
            </div>
            {totals.tax > 0 && (
              <div className="flex justify-between text-xs text-forest-muted">
                <span>Tax</span>
                <span className="tabular-nums">{formatCurrency(totals.tax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-0.5 text-[15px] font-bold text-charcoal">
              <span>Total</span>
              <span className="tabular-nums text-forest">{formatCurrency(totals.total, currency)}</span>
            </div>
          </div>

          {submitError && (
            <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {submitError}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="h-11 flex-1"
              disabled={!items.length || submitting}
              onClick={clearCart}
            >
              Clear
            </Button>
            <Button
              className="h-11 flex-[2] text-[13px] sm:text-sm"
              disabled={!items.length || submitting}
              onClick={handlePlaceOrder}
            >
              {submitting ? 'Placing…' : 'Complete & pay'}
            </Button>
          </div>
        </div>
      </aside>

      {/* Success overlay */}
      {lastOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              {Icons.check}
            </div>
            <h3 className="text-xl font-bold text-charcoal">Order placed</h3>
            <p className="mt-1 text-sm text-forest-muted">
              Order <span className="font-semibold text-charcoal">#{lastOrder.order_number}</span> is ready for
              fulfillment.
            </p>
            <p className="mt-2 text-lg font-bold text-forest">
              {formatCurrency(lastOrder.total, lastOrder.currency ?? currency)}
            </p>
            <p className="mt-1 text-xs text-forest-muted">Payment: Pay at counter (marked as paid)</p>
            <Button className="mt-6 w-full" onClick={dismissSuccess}>
              New order
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CounterPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStore } = useMarketplace();

  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  if (!selectedStore) {
    return (
      <EmptyState
        title="Select a branch"
        description="Choose a store branch from the top bar to use the counter."
      />
    );
  }

  return (
    <CounterCartProvider store={selectedStore}>
      <CounterTill store={selectedStore} />
    </CounterCartProvider>
  );
}
