import secureApi from '../crud';
import { getRoute, withQuery } from '../end_points';
import {
  normalizeMenuCategoryList,
  normalizeModifierGroupList,
  normalizeTableList,
  normalizeQRCodeList,
  normalizeProductCategoryMap,
  normalizeProductList,
} from '@/lib/normalizeApi';
import type { MenuCategory } from '@/types/menuCategory';
import type { ModifierGroup } from '@/types/modifier';
import type { Table } from '@/types/table';
import type { Product } from '@/types/product';
import type { DashboardPeriod, OwnerDashboard } from '@/types/ownerDashboard';

export const OwnerService = {
  dashboard: (storeId: string, period: DashboardPeriod, offset = 0, signal?: AbortSignal): Promise<OwnerDashboard> =>
    secureApi.get(withQuery(`/owner/stores/${storeId}/dashboard`, { period, offset, limit: 6 }), { signal }),
  listStores: () => secureApi.get(getRoute('LIST_OWNER_STORES')),
  createStore: (payload: unknown) => secureApi.post(getRoute('CREATE_OWNER_STORE'), payload),
  getStore: (storeId: string) => secureApi.get(getRoute('GET_OWNER_STORE', { storeId })),
  updateStore: (storeId: string, payload: unknown) =>
    secureApi.patch(getRoute('UPDATE_OWNER_STORE', { storeId }), payload),
  uploadStoreImage: (storeId: string, file: File, kind: 'logo' | 'banner' | 'hero' | 'card' = 'card') => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('kind', kind);
    return secureApi.upload(getRoute('UPLOAD_OWNER_STORE_IMAGE', { storeId }), fd);
  },
  listProducts: async (storeId: string): Promise<Product[]> => {
    const data = await secureApi.get(getRoute('LIST_OWNER_PRODUCTS', { storeId }));
    return normalizeProductList(data);
  },
  getProduct: (storeId: string, productId: string) =>
    secureApi.get(getRoute('GET_OWNER_PRODUCT', { storeId, productId })),
  createProduct: (storeId: string, payload: unknown) =>
    secureApi.post(getRoute('CREATE_OWNER_PRODUCT', { storeId }), payload),
  updateProduct: (storeId: string, productId: string, payload: unknown) =>
    secureApi.patch(getRoute('UPDATE_OWNER_PRODUCT', { storeId, productId }), payload),
  uploadProductImage: (storeId: string, productId: string, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return secureApi.upload(getRoute('UPLOAD_OWNER_PRODUCT_IMAGE', { storeId, productId }), fd);
  },
  deleteProduct: (storeId: string, productId: string) =>
    secureApi.delete(getRoute('DELETE_OWNER_PRODUCT', { storeId, productId })),
  listOrders: (storeId: string, params?: string | Record<string, string | number>, signal?: AbortSignal) =>
    secureApi.get(
      withQuery(getRoute('LIST_OWNER_ORDERS', { storeId }), typeof params === 'string' ? { status: params } : params ?? {}),
      { signal },
    ),
  createCounterOrder: (storeId: string, payload: unknown) =>
    secureApi.post(getRoute('CREATE_OWNER_ORDER', { storeId }), payload),
  getOrder: (storeId: string, orderId: string) =>
    secureApi.get(getRoute('GET_OWNER_ORDER', { storeId, orderId })),
  updateOrderStatus: (storeId: string, orderId: string, payload: unknown) =>
    secureApi.patch(getRoute('UPDATE_OWNER_ORDER_STATUS', { storeId, orderId }), payload),
  listActivityLogs: (storeId: string, params: Record<string, string> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_OWNER_ACTIVITY_LOGS', { storeId }), params)),
  listTransactions: (storeId: string, params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_OWNER_TRANSACTIONS', { storeId }), params)),
  getTransaction: (storeId: string, transactionId: string) =>
    secureApi.get(getRoute('GET_OWNER_TRANSACTION', { storeId, transactionId })),
  listServiceQuotes: (storeId: string, params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_OWNER_SERVICE_QUOTES', { storeId }), params)),
  createServiceQuote: (storeId: string, payload: unknown) =>
    secureApi.post(getRoute('LIST_OWNER_SERVICE_QUOTES', { storeId }), payload),
  replaceServiceQuoteDraft: (storeId: string, quoteId: string, payload: unknown) =>
    secureApi.put(`/owner/stores/${storeId}/service-quotes/${quoteId}`, payload),
  updateServiceQuoteStatus: (storeId: string, quoteId: string, status: string) =>
    secureApi.patch(getRoute('OWNER_SERVICE_QUOTE_STATUS', { storeId, quoteId }), { status }),
  listServiceJobs: (storeId: string, params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_OWNER_SERVICE_JOBS', { storeId }), params)),
  createServiceJob: (storeId: string, payload: unknown) =>
    secureApi.post(getRoute('LIST_OWNER_SERVICE_JOBS', { storeId }), payload),
  updateServiceJobStatus: (storeId: string, jobId: string, status: string) =>
    secureApi.patch(getRoute('OWNER_SERVICE_JOB_STATUS', { storeId, jobId }), { status }),
  listJobEvidence: (storeId: string, jobId: string) =>
    secureApi.get(getRoute('OWNER_JOB_EVIDENCE', { storeId, jobId })),
  addJobEvidence: (storeId: string, jobId: string, payload: unknown) =>
    secureApi.post(getRoute('OWNER_JOB_EVIDENCE', { storeId, jobId }), payload),
  assignServiceJob: (storeId: string, jobId: string, assigneeId: string) =>
    secureApi.patch(getRoute('OWNER_JOB_ASSIGNMENT', { storeId, jobId }), { assignee_id: assigneeId }),
  listReservations: (storeId: string, params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_OWNER_RESERVATIONS', { storeId }), params)),
  createReservation: (storeId: string, payload: unknown) =>
    secureApi.post(getRoute('LIST_OWNER_RESERVATIONS', { storeId }), payload),
  updateReservationStatus: (storeId: string, reservationId: string, status: string) =>
    secureApi.patch(getRoute('OWNER_RESERVATION_STATUS', { storeId, reservationId }), { status }),
  listResources: (storeId: string) => secureApi.get(getRoute('OWNER_RESOURCES', { storeId })),
  listBookableServices: (storeId: string) => secureApi.get(getRoute('OWNER_BOOKABLE_SERVICES', { storeId })),
  createBookableService: (storeId: string, payload: unknown) => secureApi.post(getRoute('OWNER_BOOKABLE_SERVICES', { storeId }), payload),
  setBookableServiceActive: (storeId: string, serviceId: string, isActive: boolean) =>
    secureApi.patch(getRoute('OWNER_BOOKABLE_SERVICE', { storeId, serviceId }), { is_active: isActive }),
  createResource: (storeId: string, payload: unknown) => secureApi.post(getRoute('OWNER_RESOURCES', { storeId }), payload),
  setResourceActive: (storeId: string, resourceId: string, isActive: boolean) =>
    secureApi.patch(getRoute('OWNER_RESOURCE', { storeId, resourceId }), { is_active: isActive }),
  listCustomOrders: (storeId: string, params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_OWNER_CUSTOM_ORDERS', { storeId }), params)),
  createCustomOrder: (storeId: string, payload: unknown) =>
    secureApi.post(getRoute('LIST_OWNER_CUSTOM_ORDERS', { storeId }), payload),
  updateCustomOrderStatus: (storeId: string, orderId: string, status: string) =>
    secureApi.patch(getRoute('OWNER_CUSTOM_ORDER_STATUS', { storeId, orderId }), { status }),
  offerCustomOrder: (storeId: string, orderId: string, payload: unknown) =>
    secureApi.put(getRoute('OWNER_CUSTOM_ORDER_OFFER', { storeId, orderId }), payload),
  listCustomOrderLines: (storeId: string, orderId: string) =>
    secureApi.get(getRoute('OWNER_CUSTOM_ORDER_LINES', { storeId, orderId })),
  addCustomOrderLine: (storeId: string, orderId: string, payload: unknown) =>
    secureApi.post(getRoute('OWNER_CUSTOM_ORDER_LINES', { storeId, orderId }), payload),
  allocateCustomOrderLine: (storeId: string, orderId: string, lineId: string, payload: unknown) =>
    secureApi.patch(getRoute('OWNER_CUSTOM_ORDER_LINE', { storeId, orderId, lineId }), payload),

  listMenuCategories: async (storeId: string): Promise<MenuCategory[]> => {
    const data = await secureApi.get(getRoute('LIST_OWNER_MENU_CATEGORIES', { storeId }));
    return normalizeMenuCategoryList(data);
  },
  createMenuCategory: (storeId: string, payload: Partial<MenuCategory>) =>
    secureApi.post(getRoute('CREATE_OWNER_MENU_CATEGORY', { storeId }), payload),
  updateMenuCategory: (storeId: string, categoryId: string, payload: Partial<MenuCategory>) =>
    secureApi.patch(getRoute('UPDATE_OWNER_MENU_CATEGORY', { storeId, categoryId }), payload),
  deleteMenuCategory: (storeId: string, categoryId: string) =>
    secureApi.delete(getRoute('DELETE_OWNER_MENU_CATEGORY', { storeId, categoryId })),
  assignProductCategory: (storeId: string, productId: string, categoryId: string | null) =>
    secureApi.patch(getRoute('ASSIGN_OWNER_PRODUCT_CATEGORY', { storeId, productId }), {
      menu_category_id: categoryId || null,
    }),
  getProductCategoryMap: async (storeId: string): Promise<Record<string, string>> => {
    const data = await secureApi.get(getRoute('GET_OWNER_PRODUCT_CATEGORY_MAP', { storeId }));
    return normalizeProductCategoryMap(data);
  },

  listModifierGroups: async (storeId: string, productId?: string): Promise<ModifierGroup[]> => {
    const data = await secureApi.get(
      withQuery(getRoute('LIST_OWNER_MODIFIER_GROUPS', { storeId }), productId ? { product_id: productId } : {}),
    );
    return normalizeModifierGroupList(data);
  },
  createModifierGroup: (storeId: string, payload: Partial<ModifierGroup>) =>
    secureApi.post(getRoute('CREATE_OWNER_MODIFIER_GROUP', { storeId }), payload),
  updateModifierGroup: (storeId: string, groupId: string, payload: Partial<ModifierGroup>) =>
    secureApi.patch(getRoute('UPDATE_OWNER_MODIFIER_GROUP', { storeId, groupId }), payload),
  deleteModifierGroup: (storeId: string, groupId: string) =>
    secureApi.delete(getRoute('DELETE_OWNER_MODIFIER_GROUP', { storeId, groupId })),

  listTables: async (storeId: string): Promise<Table[]> => {
    const data = await secureApi.get(getRoute('LIST_OWNER_TABLES', { storeId }));
    return normalizeTableList(data);
  },
  createTable: (storeId: string, payload: Partial<Table>) =>
    secureApi.post(getRoute('CREATE_OWNER_TABLE', { storeId }), payload),
  updateTable: (storeId: string, tableId: string, payload: Partial<Table>) =>
    secureApi.patch(getRoute('UPDATE_OWNER_TABLE', { storeId, tableId }), payload),
  deleteTable: (storeId: string, tableId: string) =>
    secureApi.delete(getRoute('DELETE_OWNER_TABLE', { storeId, tableId })),

  listQRCodes: async (storeId: string) => {
    const data = await secureApi.get(getRoute('LIST_OWNER_QR_CODES', { storeId }));
    return normalizeQRCodeList(data);
  },
  createQRCode: (storeId: string, payload: { kind: 'table' | 'store' | 'menu'; table_id?: string; menu_category_id?: string }) =>
    secureApi.post(getRoute('CREATE_OWNER_QR_CODE', { storeId }), payload),
  regenerateQRCode: (storeId: string, qrId: string) =>
    secureApi.post(getRoute('REGENERATE_OWNER_QR_CODE', { storeId, qrId })),
  disableQRCode: (storeId: string, qrId: string) =>
    secureApi.post(getRoute('DISABLE_OWNER_QR_CODE', { storeId, qrId })),
};

export default OwnerService;
