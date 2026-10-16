import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useCart } from '@/lib/context/useCart';
import { storefrontApi } from '@/lib/api/services';
import { marketplaceHomePath } from '@/lib/storeRouting';
import { getQRSession, qrSessionForStore } from '@/lib/qrSession';
import { useAsync } from '@/hooks/useAsync';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { getStoreTheme, formatCurrency } from '@/lib/utils';
import { DEFAULT_CURRENCY } from '@/lib/locale';
import { getStorefrontSettings } from '@/lib/normalizeApi';
import { ReferenceStoreHeader as StoreNavbar, ReferenceStoreHero as HeroSection } from '@/components/reference/ReferenceStoreLanding';
import { MobileMarketplaceNav } from '@/components/reference/MobileMarketplaceNav';
import { BestsellingSection } from '@/components/storefront/landing/BestsellingSection';
import { BrandBanner } from '@/components/storefront/landing/BrandBanner';
import { FeaturePills } from '@/components/storefront/landing/FeaturePills';
import { ShopGrid } from '@/components/storefront/landing/ShopGrid';
import { MenuCategoryBrowser } from '@/components/storefront/landing/MenuCategoryBrowser';
import { BestSellersPreview } from '@/components/storefront/landing/BestSellersPreview';
import { StoreFooter } from '@/components/storefront/landing/StoreFooter';
import { CartSlideOver } from '@/components/storefront/CartSlideOver';
import { Skeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { normalizeProductList } from '@/lib/normalizeApi';
import { purchaseFlowFor } from '@/lib/purchaseFlow';

export default function StorefrontPage() {
  const { store_slug: storeSlugParam } = useParams();
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get('table');
  const { initStore, addItem, store, clearCart, items, totals, toggleCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const requestedItem = searchParams.get('item') ?? '';
  const requestedCart = searchParams.get('cart') === '1';
  const openedCart = useRef('');
  useEffect(() => { setSearchQuery(requestedItem); }, [requestedItem, storeSlugParam]);

  const {
    data: storeData,
    loading: storeLoading,
    error: storeError,
    retry: retryStore,
  } = useAsync(async () => {
    if (!storeSlugParam) {
      throw new Error('Store not found');
    }
    return storefrontApi.getStoreBySlug(storeSlugParam);
  }, [storeSlugParam]);

  const storeId = storeData?.id;
  const qrSession = qrSessionForStore(storeId);
  const tableLabel = qrSession?.tableNumber ?? tableParam;
  const isDineInSession = Boolean(qrSession?.tableId || qrSession?.qrCodeId);

  useEffect(() => {
    if (!storeData) return;
    const active = getQRSession();
    if (active && active.storeId !== storeData.id && items.length > 0) {
      clearCart();
    }
  }, [storeData, items.length, clearCart]);

  const {
    data: products,
    loading: productsLoading,
    error: productsError,
    retry: retryProducts,
  } = useAsync(
    () => (storeId ? storefrontApi.listProducts(storeId) : Promise.resolve([])),
    [storeId],
  );

  useEffect(() => {
    if (storeData) initStore(storeData);
  }, [storeData, initStore]);

  useEffect(() => {
    if (requestedCart && store?.id === storeData?.id && store?.id && items.length && openedCart.current !== store.id) {
      openedCart.current = store.id;
      toggleCart(true);
    }
  }, [requestedCart, store, storeData, items.length, toggleCart]);

  useEffect(() => {
    if (!searchQuery || !isDineInSession) return;
    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [searchQuery, isDineInSession]);

  const { primary: brandColor } = getStoreTheme(store ?? storeData);
  const currency = storeData?.currency ?? DEFAULT_CURRENCY;
  const capabilities = useMarketplaceCapabilities(storeData);
  const copy = getStorefrontSettings(storeData);
  const listedProducts = normalizeProductList(products);
  const hasCheckoutItems = listedProducts.some(product => purchaseFlowFor(product, storeData) === 'checkout');
  const isServiceCatalog = capabilities.category === 'ON_PREMISE_SERVICE' || capabilities.category === 'ON_SITE_SERVICE';
  const catalogEyebrow = isServiceCatalog && (!copy.catalog_eyebrow?.trim() || copy.catalog_eyebrow.trim().toLowerCase() === 'full collection')
    ? 'What we offer' : copy.catalog_eyebrow?.trim() || (capabilities.isFood ? 'Our Menu' : 'Full Collection');
  const catalogTitle = isServiceCatalog && (!copy.catalog_title?.trim() || copy.catalog_title.trim().toLowerCase() === 'shop all products')
    ? 'Explore Services' : copy.catalog_title?.trim() || (capabilities.isFood ? 'Explore the Menu' : 'Shop All Products');

  if (!storeSlugParam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream p-4">
        <ErrorState error={new Error('Choose a store from the marketplace.')} title="No store selected" />
        <Link to={marketplaceHomePath()} className="text-sm font-semibold text-forest underline">
          Browse all stores
        </Link>
      </div>
    );
  }

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Skeleton className="h-20 w-full" />
        <div className="p-4 lg:p-8">
          <Skeleton className="mb-8 h-80 w-full rounded-3xl" />
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    );
  }

  if (storeError || !storeData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream p-4">
        <ErrorState
          error={storeError ?? new Error('Store could not be loaded')}
          onRetry={retryStore}
          title="Store not found"
        />
        <Link to={marketplaceHomePath()} className="text-sm font-semibold text-forest underline">
          Browse all stores
        </Link>
      </div>
    );
  }

  const menuSection = (
    <section id="shop" className={`mx-auto max-w-7xl scroll-mt-24 px-4 lg:px-8 ${isDineInSession ? 'py-6 pb-28' : 'py-16'}`}>
      {!isDineInSession && (
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-forest-muted">
            {catalogEyebrow}
          </p>
          <h2 className="mt-2 font-serif text-3xl text-charcoal sm:text-4xl">
            {catalogTitle}
          </h2>
        </div>
      )}
      {capabilities.isFood ? (
        productsLoading || productsError ? (
          <ShopGrid
            products={products}
            currency={currency}
            onAdd={addItem}
            loading={productsLoading}
            error={productsError}
            onRetry={retryProducts}
            searchQuery={searchQuery}
            store={storeData}
          />
        ) : (
          <MenuCategoryBrowser
            storeId={storeId}
            products={products}
            currency={currency}
            onAdd={addItem}
            searchQuery={searchQuery}
            highlightCategoryId={qrSession?.menuCategoryId}
            stickyCategories={isDineInSession}
            store={storeData}
          />
        )
      ) : (
        <ShopGrid
          products={products}
          currency={currency}
          onAdd={addItem}
          loading={productsLoading}
          error={productsError}
          onRetry={retryProducts}
          searchQuery={searchQuery}
          store={storeData}
        />
      )}
    </section>
  );

  return (
    <div id="top" className="reference-store min-h-screen bg-white">
      <StoreNavbar
        store={storeData}
        onSearch={setSearchQuery}
        dineInMode={isDineInSession}
        isFood={capabilities.isFood}
        isService={isServiceCatalog}
        showCart={hasCheckoutItems}
      />

      {(isDineInSession || (capabilities.supportsTables && tableLabel)) && (
        <div className="sticky top-[4.5rem] z-30 border-b border-forest/10 bg-forest px-4 py-2.5 text-center text-sm font-medium text-cream md:top-[4.75rem]">
          {tableLabel ? (
            <>
              Table {tableLabel}
              <span className="mx-2 opacity-50">·</span>
              Order from your seat
            </>
          ) : (
            'Dine-in ordering'
          )}
        </div>
      )}

      {isDineInSession ? (
        menuSection
      ) : (
        <>
          <HeroSection store={storeData} />
          {capabilities.category === 'ON_PREMISE_SERVICE' && <section className="mx-auto -mt-2 max-w-7xl px-4 pb-6 lg:px-8" aria-label="Book a service"><div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-forest/15 bg-white px-5 py-5 shadow-sm sm:px-7"><div><p className="text-xs font-semibold uppercase tracking-wider text-forest-muted">Appointments</p><h2 className="mt-1 font-serif text-xl text-charcoal">Find a time for your visit</h2><p className="mt-1 text-sm text-forest-muted">Choose a service, see its price, and request a time in three steps.</p></div><Link to={`/account/bookings?store=${encodeURIComponent(storeData.id)}`} className="inline-flex min-h-11 items-center rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky motion-reduce:transition-none">Book a service →</Link></div></section>}
          <FeaturePills capabilities={capabilities} />
          <BestsellingSection
            products={products}
            currency={currency}
            onAdd={addItem}
            loading={productsLoading}
            error={productsError}
            onRetry={retryProducts}
            searchQuery={searchQuery}
            store={storeData}
          />
          <BrandBanner store={storeData} />
          {menuSection}
          <BestSellersPreview products={products} currency={currency} onAdd={addItem} store={storeData} />
          <p className="pb-4 text-center text-sm text-forest-muted">
            <Link to={marketplaceHomePath()} className="font-semibold text-forest hover:underline">
              Browse all stores on Geepay →
            </Link>
          </p>
          <StoreFooter store={storeData} />
        </>
      )}

      {isDineInSession && totals.itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-dark bg-cream/95 p-3 backdrop-blur-md safe-area-pb">
          <button
            type="button"
            onClick={() => toggleCart(true)}
            className="mx-auto flex w-full max-w-lg items-center justify-between rounded-full bg-forest px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-forest-dark active:scale-[0.98]"
          >
            <span>View cart · {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}</span>
            <span>{formatCurrency(totals.total, currency)}</span>
          </button>
        </div>
      )}

      {!isDineInSession && <MobileMarketplaceNav/>}
      {hasCheckoutItems && <CartSlideOver
        storeSlugParam={storeSlugParam}
        brandColor={brandColor}
        currency={currency}
        tableParam={tableLabel}
        dineInMode={isDineInSession}
      />}
    </div>
  );
}
