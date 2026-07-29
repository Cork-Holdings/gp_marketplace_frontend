import { getStoreBannerUrl, getStoreImageUrl, getStorefrontSettings } from '@/lib/normalizeApi';

/** Local hero slide URLs, served from public/images/hero/. */
export const HERO_IMAGES = [
  '/images/hero/02383b52329935.590c9ed0a562a.png',
  '/images/hero/57a0c9248396485.69f0aabc6f009.png',
  '/images/hero/9916a1248576699.69f8445da25a0.png',
  '/images/hero/f0426473184755.5c00de8de0ccb.png',
];

export const DEFAULT_HERO_FALLBACK =
  'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1600&q=80';

export function buildHeroSlides(store: any) {
  const settings = getStorefrontSettings(store);
  const custom = Array.isArray(settings.hero_images)
    ? settings.hero_images.filter((src: unknown) => typeof src === 'string' && (src as string).trim())
    : [];

  if (custom.length > 0) {
    return custom as string[];
  }

  const banner = getStoreBannerUrl(store);
  const card = getStoreImageUrl(store);
  const storeImage = banner ?? card;
  const local = [...HERO_IMAGES];

  if (storeImage) {
    return [storeImage, ...local.filter((src) => src !== storeImage)];
  }

  return local.length > 0 ? local : [DEFAULT_HERO_FALLBACK];
}
