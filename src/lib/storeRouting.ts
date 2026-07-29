import { storefrontApi } from '@/lib/api/services';
import { getActiveStores } from '@/lib/normalizeApi';

export function marketplaceHomePath() {
  return '/';
}

/**
 * Resolves which store slug to load when a URL param is present.
 * Priority: URL param → VITE_DEFAULT_STORE_SLUG → first active store.
 * Prefer requiring an explicit slug on store routes; this remains for
 * featured-store helpers and legacy callers that still pass a param.
 */
export async function resolveStoreSlug(slugParam?: string | null) {
  if (slugParam) return slugParam;

  const stores = await storefrontApi.listStores();
  const active = getActiveStores(stores);

  const envSlug = import.meta.env.VITE_DEFAULT_STORE_SLUG?.trim();
  if (envSlug) {
    const envMatch = active.find((s) => s.slug === envSlug);
    if (envMatch) return envMatch.slug;
  }

  const first = active[0] ?? stores[0];
  if (!first?.slug) {
    throw new Error('No stores are available yet. Please check back soon.');
  }
  return first.slug;
}

/** Merchant storefront home — always under `/store/:slug`. */
export function storeHomePath(slug?: string | null) {
  if (!slug) return marketplaceHomePath();
  return `/store/${slug}`;
}

export function storeCheckoutPath(slug?: string | null) {
  if (!slug) return marketplaceHomePath();
  return `/store/${slug}/checkout`;
}

export function storeOrderTrackingPath(slug: string | null | undefined, orderId: string) {
  if (!slug) return marketplaceHomePath();
  return `/store/${slug}/orders/${orderId}`;
}
