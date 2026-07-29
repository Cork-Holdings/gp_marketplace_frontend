/**
 * geepay-nfs (the target architecture) models a 2-party payment gateway:
 * AccountType = 'admin' | 'merchant'. This app is a 4-party marketplace
 * (platform admin, store owner/merchant, customer, plus anonymous/public),
 * so AccountType is intentionally widened rather than collapsed to match.
 */
export type AccountType = 'system_admin' | 'store_owner' | 'merchant' | 'customer';

export interface AuthUser {
  id?: string;
  email?: string;
  full_name?: string;
  roles?: AccountType[];
  role?: AccountType;
  isSuperAdmin?: boolean;
  merchant_memberships?: unknown[];
  documents?: unknown[];
  admin_profile?: unknown;
  [key: string]: unknown;
}
