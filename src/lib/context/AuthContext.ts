import { createContext } from 'react';
import type { AuthUser } from '@/types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStoreOwner: boolean;
  isMerchant: boolean;
  isCustomer: boolean;
  memberships: unknown[];
  adminProfile: unknown;
  documents: unknown[];
  login: (email: string, password: string) => Promise<AuthUser>;
  employeeLogin: (payload: {
    merchant_id?: string;
    store_id?: string;
    employee_number: string;
    pin: string;
  }) => Promise<AuthUser>;
  loginFromResponse: (data: any) => Promise<AuthUser>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export default AuthContext;
