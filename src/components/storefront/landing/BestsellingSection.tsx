import { useRef, useState } from 'react';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from '../../common/Skeleton';
import { ErrorState } from '../../common/ErrorState';

import { normalizeProductList, getStorefrontSettings } from '@/lib/normalizeApi';

export function BestsellingSection({
  products,
  currency,
  onAdd,
  loading,
  error,
  onRetry,
  searchQuery = '',
  store,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const settings = getStorefrontSettings(store);
  const eyebrow = settings.featured_eyebrow?.trim() || 'Popular picks';
  const title = settings.featured_title?.trim() || 'Featured items';

  const list = normalizeProductList(products);
  const filtered = searchQuery
    ? list.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : list;

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
    setTimeout(updateScrollButtons, 300);
  };

  return (
    <section id="bestsellers" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-forest-muted">
        {eyebrow}
      </div>

      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-serif text-3xl text-charcoal sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        <a
          href="#shop"
          className="text-sm font-medium text-forest underline-offset-4 hover:underline"
        >
          View all →
        </a>
      </div>

      {loading && <ProductGridSkeleton />}
      {error && <ErrorState error={error} onRetry={onRetry} title="Could not load products" />}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-forest/20 py-16 text-center text-forest-muted">
          {searchQuery ? 'No products match your search.' : 'No products available yet.'}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="relative">
          {filtered.length > 4 && (
            <>
              <button
                type="button"
                onClick={() => scroll(-1)}
                disabled={!canScrollLeft}
                className="absolute -left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream-dark bg-white/90 shadow-md transition hover:bg-white disabled:opacity-30 lg:flex"
                aria-label="Scroll left"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scroll(1)}
                disabled={!canScrollRight}
                className="absolute -right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-cream-dark bg-white/90 shadow-md transition hover:bg-white disabled:opacity-30 lg:flex"
                aria-label="Scroll right"
              >
                →
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            onScroll={updateScrollButtons}
            className="scrollbar-hide grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:gap-4 lg:overflow-x-auto lg:pb-2"
          >
            {filtered.map((product, index) => (
              <div key={product.id} className="lg:min-w-[260px] lg:max-w-[280px] lg:shrink-0">
                <ProductCard
                  product={product}
                  currency={currency}
                  onAdd={onAdd}
                  store={store}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
