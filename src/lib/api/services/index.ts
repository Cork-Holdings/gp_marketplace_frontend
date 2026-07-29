import { normalizeMembershipList, normalizeOrderList } from '../../normalizeApi';

export { AuthService } from './auth';
export { MerchantService } from './merchant';
export { AdminService } from './admin';
export { OwnerService } from './owner';
export { CustomerService } from './customer';
export { StorefrontService } from './storefront';
export { RolesService, RolesService as rolesApi } from './roles';

// Legacy lowercase aliases, kept so call sites only needed an import-path
// update rather than a call-site rewrite (same method shapes).
export { AuthService as authApi } from './auth';
export { MerchantService as merchantApi } from './merchant';
export { AdminService as adminApi } from './admin';
export { OwnerService as ownerApi } from './owner';
export { CustomerService as customerApi } from './customer';
export { StorefrontService as storefrontApi } from './storefront';

export function normalizeOrdersResponse(data: unknown) {
  return normalizeOrderList(data);
}

export function normalizeMembershipsResponse(data: unknown) {
  return normalizeMembershipList(data);
}
