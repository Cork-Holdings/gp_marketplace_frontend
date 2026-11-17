/**
 * Named endpoint-key -> path-template map, mirroring the geepay-nfs
 * `end_points.tsx` pattern. Templates use `:param` placeholders resolved
 * by getRoute()/pipe().
 */
export const API = {
  // Auth
  LOGIN: '/auth/login',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
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
  ADMIN_CUSTOMER_ACCESS: '/admin/customers/:customerId/access',
  ADMIN_CUSTOMER_PASSWORD_RESET: '/admin/customers/:customerId/password-reset',
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
  LIST_OWNER_SERVICE_QUOTES: '/owner/stores/:storeId/service-quotes',
  OWNER_SERVICE_QUOTE: '/owner/stores/:storeId/service-quotes/:quoteId',
  OWNER_SERVICE_QUOTE_STATUS: '/owner/stores/:storeId/service-quotes/:quoteId/status',
  LIST_OWNER_SERVICE_JOBS: '/owner/stores/:storeId/service-jobs',
  OWNER_SERVICE_JOB_STATUS: '/owner/stores/:storeId/service-jobs/:jobId/status',
  LIST_OWNER_RESERVATIONS: '/owner/stores/:storeId/reservations',
  OWNER_RESERVATION_STATUS: '/owner/stores/:storeId/reservations/:reservationId/status',
  OWNER_RESOURCES: '/owner/stores/:storeId/resources',
  OWNER_RESOURCE: '/owner/stores/:storeId/resources/:resourceId',
  OWNER_BOOKABLE_SERVICES: '/owner/stores/:storeId/bookable-services',
  OWNER_BOOKABLE_SERVICE: '/owner/stores/:storeId/bookable-services/:serviceId',
  OWNER_BOOKABLE_SERVICE_IMAGE: '/owner/stores/:storeId/bookable-services/:serviceId/image',
  OWNER_JOB_EVIDENCE: '/owner/stores/:storeId/service-jobs/:jobId/evidence',
  OWNER_JOB_ASSIGNMENT: '/owner/stores/:storeId/service-jobs/:jobId/assignment',
  LIST_OWNER_CUSTOM_ORDERS: '/owner/stores/:storeId/custom-orders',
  OWNER_CUSTOM_ORDER_STATUS: '/owner/stores/:storeId/custom-orders/:orderId/status',
  OWNER_CUSTOM_ORDER_OFFER: '/owner/stores/:storeId/custom-orders/:orderId/offer',
  OWNER_CUSTOM_ORDER_LINES: '/owner/stores/:storeId/custom-orders/:orderId/lines',
  OWNER_CUSTOM_ORDER_PHOTOS: '/owner/stores/:storeId/custom-orders/:orderId/reference-photos',
  OWNER_CUSTOM_ORDER_LINE: '/owner/stores/:storeId/custom-orders/:orderId/lines/:lineId',

  // Customer
  GET_PURCHASE_HISTORY: '/customers/me/history',
  GET_CUSTOMER_ORDER: '/customers/me/orders/:orderId',
  LIST_ORDER_TRANSACTIONS: '/customers/me/orders/:orderId/transactions',
  RECORD_PAYMENT: '/customers/me/orders/:orderId/payments',
  GET_TRANSACTION: '/customers/me/transactions/:transactionId',
  LIST_CUSTOMER_SERVICE_QUOTES: '/customers/me/service-quotes',
  CUSTOMER_SERVICE_QUOTE: '/customers/me/service-quotes/:quoteId',
  CUSTOMER_SERVICE_QUOTE_STATUS: '/customers/me/service-quotes/:quoteId/status',
  LIST_CUSTOMER_SERVICE_JOBS: '/customers/me/service-jobs',
  CUSTOMER_SERVICE_JOB_STATUS: '/customers/me/service-jobs/:jobId/status',
  LIST_CUSTOMER_RESERVATIONS: '/customers/me/reservations',
  CUSTOMER_RESERVATION_STATUS: '/customers/me/reservations/:reservationId/status',
  CUSTOMER_CREATE_RESERVATION: '/customers/me/stores/:storeId/reservations',
  CUSTOMER_JOB_EVIDENCE: '/customers/me/service-jobs/:jobId/evidence',
  LIST_CUSTOMER_CUSTOM_ORDERS: '/customers/me/custom-orders',
  CREATE_CUSTOMER_CUSTOM_ORDER: '/customers/me/stores/:storeId/custom-orders',
  CUSTOMER_CUSTOM_ORDER_OFFER: '/customers/me/custom-orders/:orderId/offer',
  CUSTOMER_CUSTOM_ORDER_PHOTOS: '/customers/me/custom-orders/:orderId/reference-photos',
  WORKFLOW_PAYMENT: '/customers/me/workflow-payments/:kind/:sourceId/:stage',
  WORKFLOW_PAYMENT_COLLECT: '/customers/me/workflow-payments/:kind/:sourceId/:stage/collect',
  WORKFLOW_PAYMENT_SYNC: '/customers/me/workflow-payments/:kind/:sourceId/:stage/sync',

  // Public storefront
  LIST_STORE_TYPES: '/stores/types',
  LIST_STORES: '/stores',
  MARKETPLACE_OFFERINGS: '/marketplace/offerings',
  LIST_SERVICE_PROVIDERS: '/stores/service-providers',
  GET_STORE: '/stores/:storeId',
  STORE_RESOURCES: '/stores/:storeId/resources',
  STORE_BOOKABLE_SERVICES: '/stores/:storeId/bookable-services',
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
