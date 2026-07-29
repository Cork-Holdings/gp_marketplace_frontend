import { useReducer, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { configureSecureFetch } from '@/lib/api/crud';
import { authApi } from '@/lib/api/services';
import { getStoredToken, setStoredToken, getStoredUser, setStoredUser } from '@/lib/storage';
import type { AuthUser } from '@/types/auth';
import { AuthContext, type AuthContextValue } from './AuthContext';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: getStoredUser(),
  token: getStoredToken(),
  loading: true,
  error: null,
};

function normalizeAuthUser(payload: any): AuthUser {
  const base = payload?.user ?? payload;
  return {
    ...base,
    merchant_memberships: payload?.merchant_memberships ?? base?.merchant_memberships ?? [],
    documents: payload?.documents ?? base?.documents ?? [],
    admin_profile: payload?.admin_profile ?? base?.admin_profile ?? null,
  };
}

type AuthAction =
  | { type: 'INIT_DONE' }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: AuthUser; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: AuthUser };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'INIT_DONE':
      return { ...state, loading: false };
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, error: action.payload };
    case 'LOGOUT':
      return { user: null, token: null, loading: false, error: null };
    case 'SET_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    configureSecureFetch({
      getToken: () => state.token,
      refreshToken: async () => {
        try {
          const data: any = await authApi.refresh();
          const token = data.access_token ?? data.token;
          if (!token) return false;
          setStoredToken(token);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user: state.user as AuthUser } });
          return true;
        } catch {
          return false;
        }
      },
      handleUnauthorized: () => {
        setStoredToken(null);
        setStoredUser(null);
        dispatch({ type: 'LOGOUT' });
      },
    });
  }, [state.token, state.user]);

  useEffect(() => {
    async function bootstrap() {
      if (!state.token) {
        dispatch({ type: 'INIT_DONE' });
        return;
      }
      try {
        const profile = await authApi.me();
        const user = normalizeAuthUser(profile);
        setStoredUser(user);
        dispatch({ type: 'SET_USER', payload: user });
      } catch {
        setStoredToken(null);
        setStoredUser(null);
        dispatch({ type: 'LOGOUT' });
      } finally {
        dispatch({ type: 'INIT_DONE' });
      }
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loginFromResponse = useCallback(async (data: any) => {
    const token = data.access_token ?? data.token;
    const user = normalizeAuthUser(data);
    setStoredToken(token);
    setStoredUser(user);
    dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
    return user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      dispatch({ type: 'LOGIN_START' });
      try {
        const data = await authApi.login(email, password);
        const user = await loginFromResponse(data);
        return user;
      } catch (err: any) {
        dispatch({ type: 'LOGIN_FAILURE', payload: err.message });
        throw err;
      }
    },
    [loginFromResponse],
  );

  const employeeLogin = useCallback(
    async (payload: {
      merchant_id?: string;
      store_id?: string;
      employee_number: string;
      pin: string;
    }) => {
      dispatch({ type: 'LOGIN_START' });
      try {
        const data = await authApi.employeeLogin(payload);
        const user = await loginFromResponse(data);
        return user;
      } catch (err: any) {
        dispatch({ type: 'LOGIN_FAILURE', payload: err.message });
        throw err;
      }
    },
    [loginFromResponse],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setStoredUser(null);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const hasRole = useCallback(
    (role: string) => {
      const roles = state.user?.roles ?? (state.user?.role ? [state.user.role] : []);
      return roles.includes(role as any);
    },
    [state.user],
  );

  const isMerchant = hasRole('merchant') || hasRole('store_owner');

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      token: state.token,
      loading: state.loading,
      error: state.error,
      isAuthenticated: Boolean(state.token),
      isAdmin: hasRole('system_admin'),
      isStoreOwner: isMerchant,
      isMerchant,
      isCustomer: hasRole('customer'),
      memberships: state.user?.merchant_memberships ?? [],
      adminProfile: state.user?.admin_profile ?? null,
      documents: state.user?.documents ?? [],
      login,
      employeeLogin,
      loginFromResponse,
      logout,
      hasRole,
    }),
    [state, login, employeeLogin, loginFromResponse, logout, hasRole, isMerchant],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
