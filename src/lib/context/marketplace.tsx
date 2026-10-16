import { useState, useCallback, useMemo, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { ownerApi, merchantApi, normalizeMembershipsResponse } from '@/lib/api/services';
import { normalizeStoreList } from '@/lib/normalizeApi';
import { MarketplaceContext, type MarketplaceContextValue } from './MarketplaceContext';
import { useMarketplace } from './useMarketplace';
import { useAuth } from './useAuth';

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const actorId = user?.id;
  const loadVersion = useRef(0);
  const [stores, setStores] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<unknown>(null);

  // Clear the previous account before child bootstrap effects start requests.
  useLayoutEffect(() => {
    loadVersion.current += 1;
    setInitialized(false);
    setStores([]); setMemberships([]); setSelectedStoreId(null); setError(null);
  }, [actorId]);

  const loadStores = useCallback(async () => {
    const version = loadVersion.current;
    setLoading(true);
    setError(null);
    try {
      const [storesData, membershipsData] = await Promise.all([
        ownerApi.listStores(),
        merchantApi.listMemberships().catch(() => null),
      ]);
      const list = normalizeStoreList(storesData);
      if (version !== loadVersion.current) return [];
      setStores(list);
      if (membershipsData) {
        setMemberships(normalizeMembershipsResponse(membershipsData));
      }
      let saved: string | null = null;
      try { if (actorId) saved = sessionStorage.getItem(`geepay.branch.${actorId}`); } catch { /* Storage is optional. */ }
      setSelectedStoreId(current => list.some(store => store.id === current) ? current : list.find(store => store.id === saved)?.id ?? list[0]?.id ?? null);
      return list;
    } catch (err) {
      if (version === loadVersion.current) setError(err);
      return [];
    } finally {
      if (version === loadVersion.current) { setLoading(false); setInitialized(true); }
    }
  }, [actorId]);

  const selectStore = useCallback((id: string) => {
    if (!stores.some(store => store.id === id)) return;
    setSelectedStoreId(id);
    try { if (actorId) sessionStorage.setItem(`geepay.branch.${actorId}`, id); } catch { /* Continue without persistence. */ }
  }, [stores, actorId]);

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) ?? stores[0] ?? null,
    [stores, selectedStoreId],
  );

  const selectedMembership = useMemo(() => {
    if (!selectedStore?.merchant_id) return memberships[0] ?? null;
    return memberships.find((m) => m.merchant_id === selectedStore.merchant_id) ?? memberships[0] ?? null;
  }, [memberships, selectedStore]);

  const value = useMemo<MarketplaceContextValue>(
    () => ({
      stores,
      memberships,
      selectedStore,
      selectedStoreId: selectedStore?.id ?? selectedStoreId,
      selectedMembership,
      memberRole: selectedMembership?.role ?? selectedStore?.member_role ?? null,
      loading,
      initialized,
      error,
      selectStore,
      refreshStores: loadStores,
    }),
    [stores, memberships, selectedStore, selectedStoreId, selectedMembership, loading, initialized, error, loadStores, selectStore],
  );

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function MarketplaceBootstrap({ children }: { children: ReactNode }) {
  const { refreshStores, initialized } = useMarketplace();
  const { loading, isMerchant } = useAuth();

  useEffect(() => {
    if (!loading && isMerchant && !initialized) void refreshStores();
  }, [refreshStores, initialized, loading, isMerchant]);

  return children;
}
