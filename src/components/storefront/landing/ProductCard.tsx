import { formatCurrency } from '@/lib/utils';
import { CatalogueImage } from '@/components/marketplace/CatalogueImage';
import { categoryForItem } from '@/lib/discovery';
import { AddToCartButton } from '../../variants/AddToCartButton';
import type { Product } from '@/types/product';
import type { Store } from '@/types/store';
import { Link } from 'react-router-dom';
import { purchaseActionLabel, purchaseActionPath, purchaseFlowFor } from '@/lib/purchaseFlow';

function getVariantPriceRange(product: Product): { min: number; max: number } | null {
  const variants = product.variants ?? [];
  if (!variants.length) return null;
  const base = parseFloat(product.price as string) || 0;
  const prices = variants
    .map((v) => {
      if (v.price !== undefined) return parseFloat(v.price as string) || 0;
      return base + (parseFloat(v.price_adjustment as string) || 0);
    })
    .filter((n) => !isNaN(n) && n > 0);
  if (!prices.length) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function ProductCard({
  product,
  currency,
  onAdd,
  store,
}: {
  product: Product;
  currency: string;
  onAdd: (...args: unknown[]) => void;
  store?: Store;
  index?: number;
}) {
  const flow = purchaseFlowFor(product, store);
  const actionLabel = purchaseActionLabel(flow);
  const actionPath = store ? purchaseActionPath(flow, product, store) : null;
  const outOfStock = flow === 'checkout' && product.stock_quantity !== undefined && product.stock_quantity <= 0;
  const lowStock = !outOfStock && product.stock_quantity !== undefined && product.stock_quantity <= 5;
  const hasVariants = (product.variants?.length ?? 0) > 0 || !!product.variant_mode;
  const priceRange = hasVariants ? getVariantPriceRange(product) : null;
  const showFromPrice = !!priceRange && priceRange.min < priceRange.max;
  const displayPrice = showFromPrice ? priceRange!.min : product.price;

  const categoryLabel: string | null =
    product.category_name ?? product.menu_category_name ?? product.category ?? null;

  const className = [
        'group flex w-full flex-col overflow-hidden rounded-2xl bg-white text-left',
        'shadow-[0_1px_4px_rgba(0,0,0,0.06),0_6px_18px_-2px_rgba(0,0,0,0.08)]',
        'transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none',
        'hover:-translate-y-1 hover:shadow-[0_4px_22px_rgba(37, 125, 193,0.2),0_1px_4px_rgba(0,0,0,0.06)]',
        'active:scale-[0.98] active:duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'disabled:hover:translate-y-0 disabled:hover:shadow-[0_1px_4px_rgba(0,0,0,0.06),0_6px_18px_-2px_rgba(0,0,0,0.08)]',
        'disabled:active:scale-100',
      ].join(' ');
  const content = <>
      {/* ── Image ──────────────────────────────────────────────────────── */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-cobalt-50/60 to-sky-50/60">
        <CatalogueImage imageUrl={product.image_url} alt={product.name} category={categoryForItem(product, store)}
          label="Illustration"
          className={`h-full w-full object-cover transition-transform duration-500 ease-out motion-reduce:transition-none motion-safe:group-hover:scale-[1.03] ${outOfStock ? 'saturate-50 brightness-90' : ''}`}
          labelClassName="absolute bottom-3 left-3 max-w-[calc(100%-4rem)] rounded bg-white/95 px-2 py-1 text-[10px] text-forest-muted"
        />

        {/* Category chip — glass overlay */}
        {categoryLabel && (
          <span className="absolute left-2 top-2 max-w-[calc(100%-2rem)] truncate rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium leading-tight text-white backdrop-blur-[6px] sm:px-2.5 sm:py-1 sm:text-[11px]">
            {categoryLabel}
          </span>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="rounded-full bg-black/65 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              Out of stock
            </span>
          </div>
        )}

        {/* Low stock badge */}
        {lowStock && (
          <span className="absolute bottom-2 left-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {product.stock_quantity} left
          </span>
        )}

        {/* Floating add CTA */}
        {!outOfStock && (
          <span
            className={[
              'absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8',
              'bg-cobalt text-white',
              'shadow-[0_2px_8px_rgba(37, 125, 193,0.45)]',
              'transition-all duration-200',
              'group-hover:scale-[1.14] group-hover:bg-brand-gradient group-hover:shadow-[0_4px_14px_rgba(37, 125, 193,0.55)]',
            ].join(' ')}
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-3.5 sm:w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={flow === 'checkout' ? 'M12 4.5v15m7.5-7.5h-15' : 'M5 12h14m-6-6 6 6-6 6'} />
            </svg>
          </span>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col px-2.5 pb-3 pt-2.5 sm:px-3.5 sm:pb-3.5 sm:pt-3">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug tracking-tight text-charcoal sm:text-[15px]">
          {product.name}
        </h3>

        <div className="mt-1 flex items-baseline gap-1 sm:mt-1.5">
          {showFromPrice && (
            <span className="text-[10px] font-medium text-forest-muted">from</span>
          )}
          <span className="text-sm font-bold text-cobalt sm:text-[15px]">
            {flow === 'booking' ? 'See appointment price' : flow === 'quote' ? 'Price after assessment' : flow === 'custom_request' || flow === 'wholesale' ? 'Price after request' : formatCurrency(displayPrice, currency)}
          </span>
        </div>

        {product.description && (
          <p className="mt-1.5 hidden line-clamp-1 text-xs leading-relaxed text-forest-muted/80 sm:block">
            {product.description}
          </p>
        )}

        {hasVariants && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-cobalt/10 px-2 py-0.5 text-[10px] font-semibold text-cobalt">
              Options
            </span>
          </div>
        )}
        <span className="mt-2 text-xs font-semibold text-cobalt">{actionLabel} <span aria-hidden="true">→</span></span>
      </div>
    </>;
  return flow === 'checkout' ? (
    <AddToCartButton product={product} onAdd={onAdd} currency={currency} disabled={outOfStock} className={className}>
      {content}
    </AddToCartButton>
  ) : (
    <Link to={actionPath ?? '#shop'} className={className} aria-label={`${actionLabel}: ${product.name}`}>
      {content}
    </Link>
  );
}
