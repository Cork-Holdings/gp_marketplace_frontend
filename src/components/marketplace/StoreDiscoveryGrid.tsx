import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { getActiveStores } from '@/lib/normalizeApi';
import { FALLBACK_STORE_TYPES, normalizeStoreTypes } from '@/lib/storeConfig';
import { StoreCard } from './StoreCard';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import type { Store } from '@/types/store';

const PAGE_SIZE = 9;
const NEED_TERMS: Record<string, string> = {
  BARBERSHOP: 'hair haircut beard shave grooming barber', SALON: 'hair beauty nails spa salon',
  MOBILE_BARBER: 'hair haircut beard shave mobile barber home grooming',
  PLUMBER: 'plumbing plumber pipe leak drain water repairs', ELECTRICIAN: 'electrician electrical wiring power repairs',
  HOME_SERVICES: 'home services mobile home visit',
  CAKE_MAKER: 'cake birthday wedding bakery custom baking', CAFE: 'coffee cafe food bakery pastries',
  RESTAURANT: 'food restaurant meals takeaway catering', WHOLESALER: 'wholesale bulk distributor supplies groceries',
  HARDWARE: 'building materials tools hardware construction', BOUTIQUE: 'clothing clothes fashion dresses tailoring',
  FASHION: 'clothing clothes fashion dresses tailoring', CAR_WASH: 'car wash cleaning detailing',
};

export function StoreDiscoveryGrid({ stores, storeTypes, loading, error, onRetry }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const types = useMemo(() => {
    const normalized = normalizeStoreTypes(storeTypes);
    return normalized.length ? normalized : FALLBACK_STORE_TYPES;
  }, [storeTypes]);
  const active = useMemo(() => getActiveStores(stores ?? []), [stores]);
  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return active.filter((store: Store) => {
      const type = String(store.store_type ?? store.type ?? '').toUpperCase();
      const text = `${store.name} ${store.description ?? ''} ${type.replaceAll('_', ' ')} ${NEED_TERMS[type] ?? ''} ${store.branch_name ?? ''}`.toLowerCase();
      return (typeFilter === 'all' || type === typeFilter) && terms.every(term => text.includes(term));
    });
  }, [active, query, typeFilter]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const reset = () => { setQuery(''); setTypeFilter('all'); setPage(0); };

  return <section id="stores" className="mx-auto max-w-7xl px-4 py-12 lg:px-8" aria-labelledby="discovery-heading">
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-widest text-forest-muted">Marketplace</p><h2 id="discovery-heading" className="mt-2 font-serif text-3xl text-charcoal sm:text-4xl">Find what you need</h2><p className="mt-2 text-sm text-forest-muted">Explore products and services, even if you don't know the business name.</p></div>
    <div className="discovery-toolbar">
      <label className="discovery-search" htmlFor="marketplace-need"><WorkflowIcon name="search" /><span className="sr-only">Search products, services or businesses</span><input id="marketplace-need" type="search" autoComplete="off" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Try plumbing, birthday cake or haircut" /></label>
      <label className="discovery-category" htmlFor="marketplace-category"><span>Category</span><select id="marketplace-category" value={typeFilter} onChange={event => { setTypeFilter(event.target.value); setPage(0); }}><option value="all">All categories</option>{types.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
    </div>
    <div className="discovery-results-heading"><p role="status">{loading ? 'Finding businesses…' : `${filtered.length} ${filtered.length === 1 ? 'business' : 'businesses'}${query ? ` matching “${query}”` : ' to explore'}`}</p>{(query || typeFilter !== 'all') && <button type="button" className="workflow-text-action" onClick={reset}>Clear filters</button>}</div>
    {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading businesses">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl" />)}</div>
      : error ? <ErrorState error={error} onRetry={onRetry} title="Could not load businesses" />
      : visible.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(store => <StoreCard key={store.id} store={store} />)}</div>
      : <div className="discovery-empty"><WorkflowIcon name="search" size={28} /><h3>{active.length ? 'No matching businesses' : 'Businesses will appear here'}</h3><p>{active.length ? 'Try another service, a broader term or a different category.' : 'Register your business to start setting up your storefront.'}</p>{active.length ? <button type="button" className="workflow-primary" onClick={reset}>Show all businesses</button> : <Link to="/register/merchant" className="workflow-primary">Register your business</Link>}</div>}
    {!loading && !error && pages > 1 && <nav className="booking-pagination !px-0" aria-label="Business pages"><span>{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} businesses</span><div><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span aria-live="polite">{currentPage + 1} / {pages}</span><button type="button" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div></nav>}
  </section>;
}
