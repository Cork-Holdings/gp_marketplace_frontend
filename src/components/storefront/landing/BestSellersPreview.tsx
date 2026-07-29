import { formatCurrency } from '@/lib/utils';
import { normalizeProductList } from '@/lib/normalizeApi';

export function BestSellersPreview({ products, currency, onAdd }) {
  const list = normalizeProductList(products);
  const featured = list[0];
  if (!featured) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="grid items-center gap-8 rounded-3xl bg-sage-light p-6 sm:grid-cols-2 sm:p-10 lg:gap-12">
        <div>
          <h2 className="font-serif text-4xl text-charcoal sm:text-5xl">
            Best <em className="not-italic text-forest">sellers</em>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-forest-muted sm:text-base">
            {featured.description || featured.name}
          </p>
          <p className="mt-4 text-2xl font-semibold text-charcoal">
            {formatCurrency(featured.price, currency)}
          </p>
          <button
            type="button"
            onClick={() => onAdd(featured)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3 text-sm font-semibold text-white transition hover:bg-forest-dark active:scale-[0.98]"
          >
            Add to Cart
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-cream-dark">
          {featured.image_url ? (
            <img
              src={featured.image_url}
              alt={featured.name}
              loading="lazy"
              decoding="async"
              className="aspect-square w-full object-contain p-8"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center text-8xl opacity-20">🌿</div>
          )}
        </div>
      </div>
    </section>
  );
}
