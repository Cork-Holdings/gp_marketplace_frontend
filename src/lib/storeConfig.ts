/** Fallback when GET /stores/types is unavailable. */
export const FALLBACK_STORE_TYPES = [
  { value: 'BARBERSHOP', label: 'Barbershop / Salon', default_category: 'ON_PREMISE_SERVICE' },
  { value: 'RESTAURANT', label: 'Restaurant', default_category: 'FOOD_BEVERAGE' },
  { value: 'BOUTIQUE', label: 'Boutique / Retail', default_category: 'PHYSICAL_GOODS' },
  { value: 'GROCERY', label: 'Grocery / Market', default_category: 'PHYSICAL_GOODS' },
  { value: 'PLUMBER', label: 'Plumbing Services', default_category: 'ON_SITE_SERVICE' },
  { value: 'ELECTRICIAN', label: 'Electrical Services', default_category: 'ON_SITE_SERVICE' },
  { value: 'MOBILE_BARBER', label: 'Mobile Barber', default_category: 'ON_SITE_SERVICE' },
  { value: 'CAKE_MAKER', label: 'Custom Cake Maker', default_category: 'PHYSICAL_GOODS' },
  { value: 'WHOLESALER', label: 'Wholesaler', default_category: 'PHYSICAL_GOODS' },
];

export const MANAGER_PLUS_ROLES = ['owner', 'admin', 'manager'];

/**
 * Food-store staff roles — branch-scoped, kept separate from
 * MANAGER_PLUS_ROLES since they must not grant store-creation/admin access.
 */
export const FOOD_STAFF_ROLES = ['waiter', 'kitchen'];

export function normalizeStoreTypes(response) {
  const raw = Array.isArray(response)
    ? response
    : response?.types ?? response?.store_types ?? response?.data ?? [];
  return raw
    .map((t) => ({
      value: t.value ?? t.code ?? t.store_type,
      label: t.label ?? t.name ?? t.value,
      default_category: t.default_category ?? t.store_category ?? null,
    }))
    .filter((t) => t.value);
}

export function canCreateStore(role) {
  if (!role) return true;
  return MANAGER_PLUS_ROLES.includes(String(role).toLowerCase());
}

export function canManageKitchenOrders(role) {
  if (!role) return false;
  const normalized = String(role).toLowerCase();
  return MANAGER_PLUS_ROLES.includes(normalized) || FOOD_STAFF_ROLES.includes(normalized);
}
