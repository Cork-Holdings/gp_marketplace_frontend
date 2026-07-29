import secureApi from '../crud';
import { getRoute, withQuery } from '../end_points';
import {
  isUuid,
  normalizeProductList,
  normalizeStore,
  normalizeStoreList,
  normalizeMenuCategoryList,
  normalizeModifierGroupList,
  normalizeTableList,
  findStoreBySlug,
} from '../../normalizeApi';
import type { MenuCategory } from '@/types/menuCategory';
import type { ModifierGroup } from '@/types/modifier';
import type { Table } from '@/types/table';

export const StorefrontService = {
  listStoreTypes: () => secureApi.get(getRoute('LIST_STORE_TYPES'), { auth: false }),

  listStores: async () => {
    const data = await secureApi.get(getRoute('LIST_STORES'), { auth: false });
    return normalizeStoreList(data);
  },

  getStore: async (storeId: string) => {
    const data = await secureApi.get(getRoute('GET_STORE', { storeId }), { auth: false });
    return normalizeStore(data) ?? data;
  },

  getStoreBySlug: async (slug: string) => {
    const list = await StorefrontService.listStores();
    const match = findStoreBySlug(list, slug) ?? list.find((s: any) => s.id === slug);
    if (match) return match;
    if (isUuid(slug)) return StorefrontService.getStore(slug);
    throw new Error(`Store "${slug}" not found`);
  },

  listProducts: async (storeId: string) => {
    const data = await secureApi.get(getRoute('LIST_STORE_PRODUCTS', { storeId }), { auth: false });
    return normalizeProductList(data);
  },

  getProduct: (storeId: string, productId: string) =>
    secureApi.get(getRoute('GET_STORE_PRODUCT', { storeId, productId }), { auth: false }),

  createOrder: (storeId: string, payload: unknown, auth = false) =>
    secureApi.post(getRoute('CREATE_STORE_ORDER', { storeId }), payload, { auth }),

  checkout: (storeId: string, payload: unknown, auth = false) =>
    secureApi.post(getRoute('CHECKOUT', { storeId }), payload, { auth }),

  getPaymentStatus: (storeId: string, orderId: string) =>
    secureApi.get(getRoute('GET_PAYMENT_STATUS', { storeId, orderId }), { auth: false }),

  collectPayment: (storeId: string, orderId: string, payload: { phone_number?: string; retry?: boolean }) =>
    secureApi.post(getRoute('COLLECT_PAYMENT', { storeId, orderId }), payload, { auth: false }),

  getOrder: (storeId: string, orderId: string) =>
    secureApi.get(getRoute('GET_STORE_ORDER', { storeId, orderId }), { auth: false }),

  updateOrderStatus: (storeId: string, orderId: string, payload: unknown) =>
    secureApi.patch(getRoute('UPDATE_STORE_ORDER_STATUS', { storeId, orderId }), payload),

  listMenuCategories: async (storeId: string): Promise<MenuCategory[]> => {
    const data = await secureApi.get(getRoute('LIST_STORE_MENU_CATEGORIES', { storeId }), { auth: false });
    return normalizeMenuCategoryList(data);
  },

  listModifierGroups: async (storeId: string, productId?: string): Promise<ModifierGroup[]> => {
    const data = await secureApi.get(
      withQuery(getRoute('LIST_STORE_MODIFIER_GROUPS', { storeId }), productId ? { product_id: productId } : {}),
      { auth: false },
    );
    return normalizeModifierGroupList(data);
  },

  listTables: async (storeId: string): Promise<Table[]> => {
    const data = await secureApi.get(getRoute('LIST_STORE_TABLES', { storeId }), { auth: false });
    return normalizeTableList(data);
  },

  /** GET /q/:token → { qr_code, store, table?, menu_category? }. */
  resolveQR: (token: string) => secureApi.get(getRoute('RESOLVE_QR', { token }), { auth: false }),
};

export default StorefrontService;
