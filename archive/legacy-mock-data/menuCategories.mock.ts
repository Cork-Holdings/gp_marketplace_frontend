import { createMockCollection, type MockCollection } from './mockClient';
import type { MenuCategory } from '@/types/menuCategory';

const SEED_CATEGORY_NAMES = ['Starters', 'Mains', 'Grills', 'Drinks', 'Desserts'];

function seedMenuCategories(storeId: string): MenuCategory[] {
  return SEED_CATEGORY_NAMES.map((name, index) => ({
    id: `seed-category-${storeId}-${index}`,
    store_id: storeId,
    name,
    sort_order: index,
    is_active: true,
  }));
}

export const menuCategoryCollection: MockCollection<MenuCategory> = createMockCollection(
  'menu_categories',
  seedMenuCategories,
);

/**
 * Real `Product` records have no category field yet, so category assignment
 * is a separate mock join-table keyed by storeId. Once the backend adds
 * `menu_category_id` to Product, this file (and resolveProductCategory) is
 * the only place that needs to change.
 */
function assignmentStorageKey(storeId: string) {
  return `geepay_mock_menu_category_assignments_${storeId}`;
}

function readAssignments(storeId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(assignmentStorageKey(storeId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAssignments(storeId: string, map: Record<string, string>) {
  try {
    localStorage.setItem(assignmentStorageKey(storeId), JSON.stringify(map));
  } catch {
    /* quota exceeded */
  }
}

export async function getProductCategoryMap(storeId: string): Promise<Record<string, string>> {
  return readAssignments(storeId);
}

export async function assignProductCategory(storeId: string, productId: string, categoryId: string) {
  const map = readAssignments(storeId);
  if (categoryId) map[productId] = categoryId;
  else delete map[productId];
  writeAssignments(storeId, map);
  return { product_id: productId, category_id: categoryId };
}

/** Resolves the category a product belongs to, given a pre-fetched assignment map. */
export function resolveProductCategory(
  product: { id?: string } | undefined,
  categoryMap: Record<string, string>,
): string | null {
  if (!product?.id) return null;
  return categoryMap[product.id] ?? null;
}
