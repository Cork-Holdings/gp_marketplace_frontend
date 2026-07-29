import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildHeroSlides } from '@/lib/heroImages';
import { getStorefrontSettings } from '@/lib/normalizeApi';
import { resolveStoreCategory, STORE_CATEGORIES, CATEGORY_LABELS } from '@/lib/workflows';

const AUTOPLAY_MS = 5500;

function defaultTagline(store) {
  const settings = getStorefrontSettings(store);
  if (settings.hero_tagline?.trim()) return settings.hero_tagline.trim();
  if (store?.description) return store.description;
  const category = resolveStoreCategory(store);
  switch (category) {
    case STORE_CATEGORIES.FOOD_BEVERAGE:
      return 'Order from the menu and pay with Mobile Money.';
    case STORE_CATEGORIES.ON_PREMISE_SERVICE:
      return 'Book a visit and pay securely with Mobile Money.';
    case STORE_CATEGORIES.ON_SITE_SERVICE:
      return 'Request service and settle with Mobile Money.';
    default:
      return 'Shop products and pay securely with Mobile Money.';
  }
}

function ctaLabel(store) {
  const settings = getStorefrontSettings(store);
  if (settings.cta_label?.trim()) return settings.cta_label.trim();
  const category = resolveStoreCategory(store);
  if (category === STORE_CATEGORIES.FOOD_BEVERAGE) return 'Explore menu';
  if (
    category === STORE_CATEGORIES.ON_PREMISE_SERVICE ||
    category === STORE_CATEGORIES.ON_SITE_SERVICE
  ) {
    return 'View services';
  }
  return 'Shop now';
}

function heroHeadline(store) {
  const settings = getStorefrontSettings(store);
  return settings.hero_headline?.trim() || store?.name || 'Store';
}

export function HeroSection({ store }) {
  const slides = useMemo(() => buildHeroSlides(store), [store]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const tagline = defaultTagline(store);
  const category = resolveStoreCategory(store);
  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  const goTo = useCallback(
    (index) => {
      setActiveIndex((index + slides.length) % slides.length);
    },
    [slides.length],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    setActiveIndex(0);
  }, [slides]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return undefined;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return undefined;

    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length, paused, goNext]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 48) {
      if (delta < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  return (
    <section
      className="relative mx-4 overflow-hidden rounded-3xl lg:mx-8"
      aria-label="Hero"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="flex h-full transition-transform duration-700 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((src, i) => (
              <div key={`${src}-${i}`} className="relative h-full min-w-full shrink-0">
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-forest-dark/80 via-forest-dark/50 to-transparent" />

        <div className="relative flex h-full min-h-[420px] flex-col justify-center px-6 py-12 sm:min-h-[480px] sm:px-10 lg:min-h-[520px] lg:px-14">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sage">
              {categoryLabel}
            </p>
            <h1 className="font-serif text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-5xl">
              {heroHeadline(store)}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
              {tagline}
            </p>
            <a
              href="#shop"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 text-sm font-semibold text-forest transition hover:bg-white active:scale-[0.98]"
            >
              {ctaLabel(store)}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </a>
          </div>
        </div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/35"
              aria-label="Previous slide"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/35"
              aria-label="Next slide"
            >
              →
            </button>

            <div
              className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2"
              role="tablist"
              aria-label="Hero slides"
            >
              {slides.map((src, i) => (
                <button
                  key={`${src}-dot-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === activeIndex}
                  aria-label={`Slide ${i + 1} of ${slides.length}`}
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === activeIndex
                      ? 'w-7 bg-white'
                      : 'w-2 bg-white/45 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
