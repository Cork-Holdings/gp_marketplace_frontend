import { formatCurrency } from '@/lib/utils';
import { AddToCartButton } from '../../variants/AddToCartButton';
import type { Product } from '@/types/product';

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
}: {
  product: Product;
  currency: string;
  onAdd: (...args: unknown[]) => void;
  index?: number;
}) {
  const outOfStock = product.stock_quantity !== undefined && product.stock_quantity <= 0;
  const lowStock = !outOfStock && product.stock_quantity !== undefined && product.stock_quantity <= 5;
  const hasVariants = (product.variants?.length ?? 0) > 0 || !!product.variant_mode;
  const priceRange = hasVariants ? getVariantPriceRange(product) : null;
  const showFromPrice = !!priceRange && priceRange.min < priceRange.max;
  const displayPrice = showFromPrice ? priceRange!.min : product.price;

  const categoryLabel: string | null =
    product.category_name ?? product.menu_category_name ?? product.category ?? null;

  return (
    <AddToCartButton
      product={product}
      onAdd={onAdd}
      currency={currency}
      disabled={outOfStock}
      className={[
        'group flex w-full flex-col overflow-hidden rounded-2xl bg-white text-left',
        'shadow-[0_1px_4px_rgba(0,0,0,0.06),0_6px_18px_-2px_rgba(0,0,0,0.08)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-[0_4px_22px_rgba(56,61,146,0.2),0_1px_4px_rgba(0,0,0,0.06)]',
        'active:scale-[0.98] active:duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'disabled:hover:translate-y-0 disabled:hover:shadow-[0_1px_4px_rgba(0,0,0,0.06),0_6px_18px_-2px_rgba(0,0,0,0.08)]',
        'disabled:active:scale-100',
      ].join(' ')}
    >
      {/* ── Image ──────────────────────────────────────────────────────── */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-cobalt-50/60 to-sky-50/60">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className={[
              'h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]',
              outOfStock ? 'saturate-50 brightness-90' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ) : (
          <div className="flex h-full items-center justify-center" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-cobalt/15 sm:h-12 sm:w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
        )}

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
              'shadow-[0_2px_8px_rgba(56,61,146,0.45)]',
              'transition-all duration-200',
              'group-hover:scale-[1.14] group-hover:bg-brand-gradient group-hover:shadow-[0_4px_14px_rgba(56,61,146,0.55)]',
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
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
            {formatCurrency(displayPrice, currency)}
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
      </div>
    </AddToCartButton>
  );
}
