/**
 * Permission helpers for merchant portal RBAC.
 */
import type { AccountType } from '@/types/auth';

export const PERM = {
  storesView: 'stores.view',
  storesManage: 'stores.manage',
  storesUpdate: 'stores.update',
  productsView: 'products.view',
  productsManage: 'products.manage',
  ordersView: 'orders.view',
  ordersManage: 'orders.manage',
  ordersStatusUpdate: 'orders.status.update',
  serviceJobsManage: 'service_jobs.manage',
  transactionsView: 'transactions.view',
  membersView: 'members.view',
  membersManage: 'members.manage',
  rolesView: 'roles.view',
  rolesManage: 'roles.manage',
  rolesAssign: 'roles.assign',
} as const;

export type PermissionName = (typeof PERM)[keyof typeof PERM];

export function hasRole(currentHasRole: (role: string) => boolean, role: AccountType) {
  return currentHasRole(role);
}

export function hasAnyRole(currentHasRole: (role: string) => boolean, roles: AccountType[]) {
  if (!roles.length) return true;
  return roles.some((role) => currentHasRole(role));
}

export function hasPermission(permissions: Set<string> | string[] | null | undefined, permission: string) {
  if (!permissions) return false;
  if (permissions instanceof Set) return permissions.has(permission);
  return permissions.includes(permission);
}

export function hasAnyPermission(
  permissions: Set<string> | string[] | null | undefined,
  required: string[],
) {
  if (!required.length) return true;
  return required.some((p) => hasPermission(permissions, p));
}

/** Nav item → required permission(s); first match grants access. */
export const NAV_PERMISSIONS: Record<string, string[]> = {
  '/portal/admin/customers': ['merchants.view'],
  '/portal/admin/products': ['products.view'],
  '/portal/admin/categories': ['products.view'],
  '/portal/admin/operations': ['orders.view'],
  '/portal/admin/erp': ['products.view','transactions.view','admin.manage'],
  '/portal/admin/orders': ['orders.view'],
  '/portal/admin/merchants': ['merchants.view'],
  '/portal/admin/merchants/new': ['merchants.manage'],
  '/portal/admin/stores': ['stores.view'],
  '/portal/admin/kyc': ['kyc.view'],
  '/portal/admin/admins/new': ['admin.manage'],
  '/portal/admin/plans': ['admin.manage'],
  '/portal/admin/marketplace': ['admin.manage'],
  '/portal/admin/pages': ['admin.manage'],
  '/portal/admin/settlements': ['transactions.view'],
  '/portal/admin/notifications': ['transactions.view'],
  '/portal/owner/purchasing': ['products.view'],
  '/portal/owner/stock-control': ['products.view'],
  '/portal/owner/accounting/accounts': ['erp.finance'],
  '/portal/owner/accounting/imports': ['erp.finance'],
  '/portal/owner/accounting': ['erp.finance'],
  '/portal/owner/reconciliation': ['erp.finance'],
  '/portal/owner/reports': ['erp.finance'],
  '/portal/owner/activity': ['erp.finance'],
  '/portal/owner/people': ['erp.people'],
  '/portal/owner/customers': ['erp.customers'],
  '/portal/owner': [PERM.storesView, PERM.ordersView, PERM.productsView],
  '/portal/owner/stores': [PERM.storesView],
  '/portal/owner/store-settings': [PERM.storesUpdate],
  '/portal/owner/products': [PERM.productsView],
  '/portal/owner/counter': [PERM.ordersManage, PERM.ordersView],
  '/portal/owner/orders': [PERM.ordersView],
  '/portal/owner/quotes': [PERM.ordersView],
  '/portal/owner/jobs': [PERM.ordersView],
  '/portal/owner/bookings': [PERM.ordersView],
  '/portal/owner/transactions': [PERM.transactionsView],
  '/portal/owner/settlements': [PERM.transactionsView],
  '/portal/owner/inventory': [PERM.productsView],
  '/portal/owner/menu': [PERM.productsView],
  '/portal/owner/tables': [PERM.storesUpdate, PERM.productsManage],
  '/portal/owner/kitchen': [PERM.ordersStatusUpdate, PERM.ordersView],
  '/portal/owner/team': [PERM.membersView],
  '/portal/owner/roles': [PERM.rolesView],
};

export function canAccessNav(
  permissions: Set<string> | string[] | null | undefined,
  path: string,
) {
  const required = NAV_PERMISSIONS[path];
  if (!required) return true;
  return hasAnyPermission(permissions, required);
}
