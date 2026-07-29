import type { Store } from '@/types/store';
import type { Product } from '@/types/product';
import type { Order } from '@/types/order';
import type { Membership } from '@/types/membership';
import type { MenuCategory } from '@/types/menuCategory';
import type { ModifierGroup } from '@/types/modifier';
import type { Table } from '@/types/table';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Store shape from GET /stores:
 * { stores: [{ id, owner_id, name, slug, description, ussd_code, currency, image_url?, is_active }] }
 */

export function isUuid(value: unknown) {
  return typeof value === 'string' && UUID_RE.test(value);
}

function pickArray<T = unknown>(response: any, keys: string[]): T[] {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key];
  }
  return [];
}

/** GET /stores → { stores: [...] } */
export function normalizeStoreList(response: any): Store[] {
  return pickArray<Store>(response, ['stores', 'items', 'data']);
}

/** GET /stores/:id → store object or { store: {...} } */
export function normalizeStore(response: any): Store | null {
  if (!response || typeof response !== 'object') return null;
  if (response.id && response.slug) return response;
  return response.store ?? response.data ?? null;
}

export function normalizeProductList(response: any): Product[] {
  return pickArray<Product>(response, ['products', 'items', 'data']);
}

export function normalizeOrderList(response: any): Order[] {
  return pickArray<Order>(response, ['orders', 'items', 'data']);
}

export function normalizeMembershipList(response: any): Membership[] {
  return pickArray<Membership>(response, ['memberships', 'merchant_memberships', 'items', 'data']).map(
    (m) => ({
      ...m,
      role: m.role ?? m.member_role,
    }),
  );
}

export function normalizeMenuCategoryList(response: any): MenuCategory[] {
  return pickArray<MenuCategory>(response, ['categories', 'menu_categories', 'items', 'data']);
}

export function normalizeModifierGroupList(response: any): ModifierGroup[] {
  return pickArray<ModifierGroup>(response, ['modifier_groups', 'items', 'data']).map((group) => ({
    ...group,
    modifiers: Array.isArray(group?.modifiers) ? group.modifiers : [],
  }));
}

export function normalizeTableList(response: any): Table[] {
  return pickArray<Table>(response, ['tables', 'items', 'data']);
}

export function normalizeQRCodeList(response: any): any[] {
  return pickArray(response, ['qr_codes', 'items', 'data']);
}

/** Owner GET /product-category-map → { product_category_map: {productId: categoryId} } (or bare map). */
export function normalizeProductCategoryMap(response: any): Record<string, string> {
  if (!response || typeof response !== 'object') return {};
  if (response.product_category_map && typeof response.product_category_map === 'object') {
    return response.product_category_map;
  }
  if (response.map && typeof response.map === 'object') return response.map;
  return response;
}

export function normalizeOwnerList(response: any) {
  return pickArray(response, ['owners', 'store_owners', 'items', 'data']);
}

export function findStoreBySlug(stores: any, slug: string): Store | null {
  const list = normalizeStoreList(stores);
  return list.find((s) => s.slug === slug) ?? null;
}

export function findStoreById(stores: any, id: string): Store | null {
  const list = normalizeStoreList(stores);
  return list.find((s) => s.id === id) ?? null;
}

export function getActiveStores(stores: any): Store[] {
  return normalizeStoreList(stores).filter((s) => s.is_active !== false);
}

/** Marketplace card / default store image. */
export function getStoreImageUrl(store: any) {
  return store?.image_url ?? store?.logo_url ?? store?.banner_url ?? null;
}

/** Nav / circular logo — prefers dedicated logo. */
export function getStoreLogoUrl(store: any) {
  return store?.logo_url ?? store?.image_url ?? null;
}

/** About / wide banner — prefers dedicated banner. */
export function getStoreBannerUrl(store: any) {
  return store?.banner_url ?? store?.image_url ?? store?.logo_url ?? null;
}

export function getStorefrontSettings(store: any) {
  return store?.storefront_settings && typeof store.storefront_settings === 'object'
    ? store.storefront_settings
    : {};
}
