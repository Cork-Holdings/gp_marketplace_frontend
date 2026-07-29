import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { rolesApi } from '@/lib/api/services';
import { useMarketplace } from './useMarketplace';

export interface PermissionsContextValue {
  permissions: Set<string>;
  loading: boolean;
  hasPermission: (name: string) => boolean;
  refresh: () => Promise<void>;
}

export const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { selectedStore } = useMarketplace();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const merchantId = selectedStore?.merchant_id as string | undefined;

  const refresh = useCallback(async () => {
    if (!merchantId) {
      setPermissions(new Set());
      return;
    }
    setLoading(true);
    try {
      const data: any = await rolesApi.myPermissions(merchantId);
      const list: string[] = Array.isArray(data?.permissions) ? data.permissions : [];
      setPermissions(new Set(list));
    } catch {
      setPermissions(new Set());
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const hasPermission = useCallback((name: string) => permissions.has(name), [permissions]);

  const value = useMemo(
    () => ({ permissions, loading, hasPermission, refresh }),
    [permissions, loading, hasPermission, refresh],
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
