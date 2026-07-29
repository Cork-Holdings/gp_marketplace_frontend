import { storefrontApi } from '@/lib/api/services';
import { useAsync } from '@/hooks/useAsync';
import { MarketplaceNavbar } from '@/components/marketplace/MarketplaceNavbar';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { StoreDiscoveryGrid } from '@/components/marketplace/StoreDiscoveryGrid';
import { MarketplaceFooter } from '@/components/marketplace/MarketplaceFooter';

export default function MarketplaceHomePage() {
  const {
    data: stores,
    loading: storesLoading,
    error: storesError,
    retry: retryStores,
  } = useAsync(() => storefrontApi.listStores(), []);

  const { data: storeTypes } = useAsync(() => storefrontApi.listStoreTypes().catch(() => []), []);

  return (
    <div id="top" className="min-h-screen bg-cream">
      <MarketplaceNavbar />
      <MarketplaceHero />
      <StoreDiscoveryGrid
        stores={stores}
        storeTypes={storeTypes}
        loading={storesLoading}
        error={storesError}
        onRetry={retryStores}
      />
      <MarketplaceFooter />
    </div>
  );
}
