import { getStoreBannerUrl, getStorefrontSettings } from '@/lib/normalizeApi';

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80';

/** About section — only renders when the store has a description. */
export function BrandBanner({ store }) {
  const description = store?.description?.trim();
  if (!description) return null;

  const settings = getStorefrontSettings(store);
  const aboutTitle = settings.about_title?.trim() || 'About';
  const bannerImage = getStoreBannerUrl(store) ?? FALLBACK_BANNER;

  return (
    <section id="about" className="relative mx-4 my-8 overflow-hidden rounded-3xl lg:mx-8">
      <img
        src={bannerImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-forest-dark/55" />
      <div className="relative px-6 py-20 text-center sm:px-12 sm:py-28 lg:px-20">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sage">{aboutTitle}</p>
        <p className="mx-auto max-w-3xl font-serif text-xl leading-relaxed text-white sm:text-2xl lg:text-3xl">
          {description}
        </p>
      </div>
    </section>
  );
}
