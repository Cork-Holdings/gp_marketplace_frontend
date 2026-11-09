import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { rolesApi } from '@/lib/api/services';
import { useMarketplace } from './useMarketplace';
import { useAuth } from './useAuth';

export interface PermissionsContextValue {
  permissions: Set<string>;
  loading: boolean;
  hasPermission: (name: string) => boolean;
  refresh: () => Promise<void>;
}

export const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { selectedStore, initialized, loading: storesLoading } = useMarketplace();
  const { user, isMerchant, isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);
  const [resolvedKey, setResolvedKey] = useState('');
  const version = useRef(0);

  const merchantId = isMerchant ? selectedStore?.merchant_id as string | undefined : undefined;
  const key = `${user?.id ?? ''}:${merchantId ?? ''}`;
  const loading = fetching || (isAdmin && resolvedKey !== key) || (isMerchant && (!initialized || storesLoading || resolvedKey !== key));
  const currentPermissions = useMemo(() => resolvedKey === key ? permissions : new Set<string>(), [key, resolvedKey, permissions]);

  const refresh = useCallback(async () => {
    const request = ++version.current;
    if (!user?.id || (!isAdmin && !merchantId)) {
      setPermissions(new Set());
      setResolvedKey(key);
      setFetching(false);
      return;
    }
    setFetching(true);
    try {
      const data: any = await rolesApi.myPermissions(merchantId);
      const list: string[] = Array.isArray(data?.permissions) ? data.permissions : [];
      if (request === version.current) setPermissions(new Set(list));
    } catch {
      if (request === version.current) setPermissions(new Set());
    } finally {
      if (request === version.current) { setFetching(false); setResolvedKey(key); }
    }
  }, [merchantId, key, isAdmin, user?.id]);

  useEffect(() => {
    void refresh();
    return () => { version.current++; };
  }, [refresh]);

  const hasPermission = useCallback((name: string) => currentPermissions.has(name), [currentPermissions]);

  const value = useMemo(
    () => ({ permissions: currentPermissions, loading, hasPermission, refresh }),
    [currentPermissions, loading, hasPermission, refresh],
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    return {
      permissions: new Set<string>(),
      loading: false,
      hasPermission: () => false,
      refresh: async () => {},
    };
  }
  return ctx;
}
