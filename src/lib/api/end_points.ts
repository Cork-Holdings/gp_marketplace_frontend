/**
 * Named endpoint-key -> path-template map, mirroring the geepay-nfs
 * `end_points.tsx` pattern. Templates use `:param` placeholders resolved
 * by getRoute()/pipe().
 */
export const API = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REGISTER_CUSTOMER: '/auth/register/customer',
  REGISTER_MERCHANT: '/auth/register/merchant',
  REFRESH_TOKEN: '/auth/refresh',
  AUTH_ME: '/auth/me',
  AUTH_ME_PERMISSIONS: '/auth/me/permissions',
  EMPLOYEE_LOGIN: '/auth/employee/login',

  // Merchant (self-service)
  LIST_MEMBERSHIPS: '/merchants/memberships',
  ONBOARD_BUSINESS: '/merchants/onboard',
  MERCHANT_ROLES: '/merchants/:merchantId/roles',
  MERCHANT_ROLE: '/merchants/:merchantId/roles/:roleId',
  MERCHANT_PERMISSIONS: '/merchants/:merchantId/permissions',
  MERCHANT_MEMBERS: '/merchants/:merchantId/members',
  MERCHANT_MEMBER: '/merchants/:merchantId/members/:memberId',
  MERCHANT_MEMBER_PIN: '/merchants/:merchantId/members/:memberId/pin',

  // Admin
  CREATE_PLATFORM_ADMIN: '/admin/admins',
  ADMIN_CREATE_STORE: '/admin/stores',
  ADMIN_LIST_STORES: '/admin/stores',
  ADMIN_REGISTER_MERCHANT: '/admin/merchants',
  LIST_MERCHANTS: '/admin/merchants',
  LIST_KYC: '/admin/kyc',
  GET_KYC: '/admin/kyc/:verificationId',
  APPROVE_KYC: '/admin/kyc/:verificationId/approve',
  REJECT_KYC: '/admin/kyc/:verificationId/reject',
  LIST_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_LIST_ORDERS: '/admin/orders',
  ADMIN_GET_ORDER: '/admin/orders/:orderId',
  /** @deprecated legacy store-owner endpoints */
  ONBOARD_OWNER: '/admin/store-owners',
  /** @deprecated legacy store-owner endpoints */
  LIST_OWNERS: '/admin/store-owners',
  /** @deprecated legacy store-owner endpoints */
  UPDATE_OWNER: '/admin/store-owners/:ownerId',

  // Owner / merchant portal
  LIST_OWNER_STORES: '/owner/stores',
  CREATE_OWNER_STORE: '/owner/stores',
  GET_OWNER_STORE: '/owner/stores/:storeId',
  UPDATE_OWNER_STORE: '/owner/stores/:storeId',
  UPLOAD_OWNER_STORE_IMAGE: '/owner/stores/:storeId/image',
  LIST_OWNER_PRODUCTS: '/owner/stores/:storeId/products',
  GET_OWNER_PRODUCT: '/owner/stores/:storeId/products/:productId',
  CREATE_OWNER_PRODUCT: '/owner/stores/:storeId/products',
  UPDATE_OWNER_PRODUCT: '/owner/stores/:storeId/products/:productId',
  UPLOAD_OWNER_PRODUCT_IMAGE: '/owner/stores/:storeId/products/:productId/image',
  DELETE_OWNER_PRODUCT: '/owner/stores/:storeId/products/:productId',
  LIST_OWNER_ORDERS: '/owner/stores/:storeId/orders',
  CREATE_OWNER_ORDER: '/owner/stores/:storeId/orders',
  GET_OWNER_ORDER: '/owner/stores/:storeId/orders/:orderId',
  UPDATE_OWNER_ORDER_STATUS: '/owner/stores/:storeId/orders/:orderId/status',
  LIST_OWNER_ACTIVITY_LOGS: '/owner/stores/:storeId/activity',
  LIST_OWNER_TRANSACTIONS: '/owner/stores/:storeId/transactions',
  GET_OWNER_TRANSACTION: '/owner/stores/:storeId/transactions/:transactionId',

  // Customer
  GET_PURCHASE_HISTORY: '/customers/me/history',
  GET_CUSTOMER_ORDER: '/customers/me/orders/:orderId',
  LIST_ORDER_TRANSACTIONS: '/customers/me/orders/:orderId/transactions',
  RECORD_PAYMENT: '/customers/me/orders/:orderId/payments',
  GET_TRANSACTION: '/customers/me/transactions/:transactionId',

  // Public storefront
  LIST_STORE_TYPES: '/stores/types',
  LIST_STORES: '/stores',
  GET_STORE: '/stores/:storeId',
  LIST_STORE_PRODUCTS: '/stores/:storeId/products',
  GET_STORE_PRODUCT: '/stores/:storeId/products/:productId',
  CREATE_STORE_ORDER: '/stores/:storeId/orders',
  CHECKOUT: '/stores/:storeId/checkout',
  GET_PAYMENT_STATUS: '/stores/:storeId/orders/:orderId/payment-status',
  COLLECT_PAYMENT: '/stores/:storeId/orders/:orderId/collect',
  GET_STORE_ORDER: '/stores/:storeId/orders/:orderId',
  UPDATE_STORE_ORDER_STATUS: '/stores/:storeId/orders/:orderId/status',

  // QR ordering — menu, modifiers, tables, and QR code management.
  LIST_OWNER_MENU_CATEGORIES: '/owner/stores/:storeId/menu-categories',
  CREATE_OWNER_MENU_CATEGORY: '/owner/stores/:storeId/menu-categories',
  UPDATE_OWNER_MENU_CATEGORY: '/owner/stores/:storeId/menu-categories/:categoryId',
  DELETE_OWNER_MENU_CATEGORY: '/owner/stores/:storeId/menu-categories/:categoryId',
  GET_OWNER_PRODUCT_CATEGORY_MAP: '/owner/stores/:storeId/product-category-map',
  ASSIGN_OWNER_PRODUCT_CATEGORY: '/owner/stores/:storeId/products/:productId/menu-category',
  LIST_STORE_MENU_CATEGORIES: '/stores/:storeId/menu-categories',

  LIST_OWNER_MODIFIER_GROUPS: '/owner/stores/:storeId/modifier-groups',
  CREATE_OWNER_MODIFIER_GROUP: '/owner/stores/:storeId/modifier-groups',
  UPDATE_OWNER_MODIFIER_GROUP: '/owner/stores/:storeId/modifier-groups/:groupId',
  DELETE_OWNER_MODIFIER_GROUP: '/owner/stores/:storeId/modifier-groups/:groupId',
  LIST_STORE_MODIFIER_GROUPS: '/stores/:storeId/modifier-groups',

  LIST_OWNER_TABLES: '/owner/stores/:storeId/tables',
  CREATE_OWNER_TABLE: '/owner/stores/:storeId/tables',
  UPDATE_OWNER_TABLE: '/owner/stores/:storeId/tables/:tableId',
  DELETE_OWNER_TABLE: '/owner/stores/:storeId/tables/:tableId',
  LIST_STORE_TABLES: '/stores/:storeId/tables',

  LIST_OWNER_QR_CODES: '/owner/stores/:storeId/qr-codes',
  CREATE_OWNER_QR_CODE: '/owner/stores/:storeId/qr-codes',
  REGENERATE_OWNER_QR_CODE: '/owner/stores/:storeId/qr-codes/:qrId/regenerate',
  DISABLE_OWNER_QR_CODE: '/owner/stores/:storeId/qr-codes/:qrId/disable',
  RESOLVE_QR: '/q/:token',
} as const;

export type ApiRouteKey = keyof typeof API;

/** Substitutes `:param` placeholders in a path template. */
export function pipe(template: string, params: Record<string, string | number> = {}) {
  return template.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

/** Resolves a named route key (with optional :param substitution) to a path. */
export function getRoute(key: ApiRouteKey, params: Record<string, string | number> = {}) {
  return pipe(API[key], params);
}

/** Appends a query string built from a params object, when non-empty. */
export function withQuery(path: string, params: Record<string, string | number | undefined> = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return path;
  const qs = new URLSearchParams(entries as [string, string][]).toString();
  return `${path}?${qs}`;
}
