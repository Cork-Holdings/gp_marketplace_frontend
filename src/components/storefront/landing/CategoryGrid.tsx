import { useRef, type ElementType } from 'react';
import { Link } from 'react-router-dom';
import { getStoreImageUrl } from '@/lib/normalizeApi';
import { normalizeProductList } from '@/lib/normalizeApi';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&q=80';

function deriveCategories(stores, currentStoreId, products) {
  const storeList = Array.isArray(stores) ? stores : [];
  const siblingStores = storeList
    .filter((s) => s.is_active !== false && s.id !== currentStoreId)
    .slice(0, 4)
    .map((s) => ({
      name: s.name,
      slug: s.slug,
      image: getStoreImageUrl(s) ?? FALLBACK_IMAGE,
      href: s.slug ? `/store/${s.slug}` : '#shop',
    }));

  if (siblingStores.length > 0) return siblingStores;

  const productList = normalizeProductList(products);
  if (productList.length >= 4) {
    return productList.slice(0, 4).map((p) => ({
      name: p.name,
      slug: null,
      image: p.image_url ?? FALLBACK_IMAGE,
      href: '#shop',
    }));
  }

  return storeList.slice(0, 4).map((s) => ({
    name: s.name,
    slug: s.slug,
    image: getStoreImageUrl(s) ?? FALLBACK_IMAGE,
    href: s.slug ? `/store/${s.slug}` : '#shop',
  }));
}

export function CategoryGrid({ stores, currentStoreId, products }) {
  const scrollRef = useRef(null);
  const categories = deriveCategories(stores, currentStoreId, products);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  if (categories.length === 0) return null;

  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <h2 className="mb-10 text-center font-serif text-3xl text-charcoal sm:text-4xl">
        Explore our thoughtful and planet-first{' '}
        <span className="text-forest-muted">✧</span>{' '}
        <em className="not-italic text-forest">Stores</em>
      </h2>

      <div className="relative">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute -left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg shadow-lg backdrop-blur-sm transition hover:bg-white lg:flex"
          aria-label="Previous categories"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute -right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg shadow-lg backdrop-blur-sm transition hover:bg-white lg:flex"
          aria-label="Next categories"
        >
          →
        </button>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 lg:gap-5"
        >
          {categories.map((cat) => {
            const CardWrapper: ElementType = cat.slug ? Link : 'a';
            const linkProps: Record<string, string> = cat.slug
              ? { to: cat.href }
              : { href: cat.href };

            return (
              <CardWrapper
                key={cat.name + (cat.slug ?? '')}
                {...linkProps}
                className="group relative min-w-[220px] shrink-0 overflow-hidden rounded-3xl sm:min-w-0"
              >
                <div className="aspect-[3/4]">
                  <img
                    src={cat.image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 via-forest-dark/20 to-transparent" />
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-serif text-lg text-white sm:text-xl">
                    Explore <em className="not-italic">{cat.name}</em>
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-cream px-4 py-1.5 text-xs font-semibold text-forest transition group-hover:bg-white">
                    Shop →
                  </span>
                </div>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
