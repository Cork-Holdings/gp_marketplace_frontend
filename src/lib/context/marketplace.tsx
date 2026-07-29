import { useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { ownerApi, merchantApi, normalizeMembershipsResponse } from '@/lib/api/services';
import { normalizeStoreList } from '@/lib/normalizeApi';
import { MarketplaceContext, type MarketplaceContextValue } from './MarketplaceContext';
import { useMarketplace } from './useMarketplace';

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [stores, setStores] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const loadStores = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [storesData, membershipsData] = await Promise.all([
        ownerApi.listStores(),
        merchantApi.listMemberships().catch(() => null),
      ]);
      const list = normalizeStoreList(storesData);
      setStores(list);
      if (membershipsData) {
        setMemberships(normalizeMembershipsResponse(membershipsData));
      }
      if (list.length && !selectedStoreId) {
        setSelectedStoreId(list[0].id);
      }
      return list;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedStoreId]);

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
      error,
      selectStore: setSelectedStoreId,
      refreshStores: loadStores,
    }),
    [stores, memberships, selectedStore, selectedStoreId, selectedMembership, loading, error, loadStores],
  );

  return <MarketplaceContext.Provider value={value}>{children}</MarketplaceContext.Provider>;
}

export function MarketplaceBootstrap({ children }: { children: ReactNode }) {
  const { refreshStores, stores } = useMarketplace();

  useEffect(() => {
    if (!stores.length) refreshStores();
  }, [refreshStores, stores.length]);

  return children;
}
