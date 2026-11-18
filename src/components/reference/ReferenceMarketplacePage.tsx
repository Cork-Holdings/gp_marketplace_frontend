import { useState, useEffect } from 'react';
import { usePlatformDocuments } from '@/hooks/usePlatformDocuments';
import type { MarketplaceContent } from '@/lib/platform';
import { Link, useSearchParams } from 'react-router-dom';
import { useDiscoveryFeed } from '@/hooks/useDiscoveryFeed';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { StorefrontService } from '@/lib/api/services/storefront';
import { MarketplaceNavbar } from '@/components/marketplace/MarketplaceNavbar';
import { MarketplaceFooter } from '@/components/marketplace/MarketplaceFooter';
import { CatalogueImage } from '@/components/marketplace/CatalogueImage';
import { ErrorState } from '@/components/common/ErrorState';
import { DISCOVERY_CATEGORIES, offeringPath, offeringPrice, offeringAction, type DiscoveryKind, type DiscoveryOffering } from '@/lib/discovery';
import { marketplaceReferenceCategories } from '@/lib/referenceNavigation';
import { categoryPaths, searchMarketplaceStores } from '@/lib/referenceMarketplace';
import type { Store } from '@/types/store';
import { ReferenceIcon } from './ReferenceIcon';
import { ReferencePhoto, Photo } from './ReferenceUI';
import { MobileMarketplaceNav } from './MobileMarketplaceNav';
import './reference-marketplace.css';
import './reference-marketplace-home.css';
export function MarketplaceCategories() { return <nav className="reference-market-categories" aria-label="Marketplace categories">{marketplaceReferenceCategories.filter(category=>!categoryPaths[category.id].startsWith("/coming-soon/")).map(category => <Link key={category.id} to={categoryPaths[category.id]}><span className={`tone-${category.tone}`}><ReferenceIcon name={category.icon} size={32}/></span><strong>{category.label}</strong></Link>)}</nav>; }
export function ReferenceMarketplaceHero({content}: {content?:MarketplaceContent} = {}) {
    const [slide, setSlide] = useState(0);
    const slides = [{ first: 'More of what', second: 'you love.', subtitle: 'Shop. Book. Enjoy. All on GeePay.', action: 'Shop Now', to: '/?kind=products#marketplace-results' }, { first: 'Find the right people.', second: 'For the work you need.', subtitle: 'Explore services. Book a visit or request an estimate.', action: 'Explore Services', to: '/?kind=services#marketplace-results' }, { first: 'Made for you.', second: 'Ordered your way.', subtitle: 'Custom creations and bulk supply, all in one place.', action: 'Make a Request', to: '/account/custom-orders?view=new' }];
    const current = content ? {first:content.title,second:'',subtitle:content.subtitle,action:content.action,to:content.link} : slides[slide];
    return <section className="reference-market-hero-wrap" aria-label="Marketplace highlights"><div className="reference-market-hero"><div className="reference-market-hero-copy"><h1>{current.first}{current.second && <><br /><span>{current.second}</span></>}</h1><p>{current.subtitle}</p><Link className="gp-brand-cta" to={current.to}>{current.action}<ReferenceIcon name="arrow" size={19}/></Link></div><ReferencePhoto crop={[499, 265, 245, 205]} className="reference-market-hero-person"/><ul className="reference-market-benefits"><li><ReferenceIcon name="truck"/><span>Discover businesses<small>Across your city</small></span></li><li><ReferenceIcon name="shield"/><span>Shop with clarity<small>Know your next step</small></span></li><li><ReferenceIcon name="grid"/><span>Browse your way<small>Products and services</small></span></li></ul></div>{!content && <div className="reference-hero-dots" role="group" aria-label="Choose marketplace highlight">{slides.map((item, index) => <button key={item.first} onClick={() => setSlide(index)} aria-pressed={slide === index} aria-label={`Highlight ${index + 1}: ${item.first}`}/>)}</div>}</section>;
}
function LiveOffering({ offering: o }: {
    offering: DiscoveryOffering;
}) { return <article className="reference-market-card"><div className="reference-market-card-image"><Link to={offeringPath(o)} aria-label={`Explore ${o.name}`}><CatalogueImage imageUrl={o.image_url} alt={o.name} category={o.category}/></Link></div><div className="reference-market-card-copy"><h3><Link to={offeringPath(o)}>{o.name}</Link></h3><Link className="reference-market-card-category" to={`/store/${encodeURIComponent(o.slug)}`}>{o.store_name}</Link><div className="reference-market-card-bottom"><strong>{offeringPrice(o)}</strong><Link className="reference-card-add" to={offeringPath(o)} aria-label={`${offeringAction(o)}: ${o.name}`}><span>{offeringAction(o)}</span><ReferenceIcon name="arrow" size={20}/></Link></div></div></article>; }
export default function ReferenceMarketplacePage() {
    const [params, setParams] = useSearchParams();
    const content = usePlatformDocuments<MarketplaceContent>('marketplace');
    const home = content.items?.find(doc=>doc.slug==='home')?.data;
    const query = (params.get('q') ?? '').slice(0, 120);
    const searching = query.trim().length > 0;
    const kind: DiscoveryKind = params.get('kind') === 'products' ? 'products' : params.get('kind') === 'services' ? 'services' : 'all';
    const category = DISCOVERY_CATEGORIES.some(item => item.id === params.get('category')) ? params.get('category')! : 'all';
    const branch = (params.get('branch') ?? '').slice(0, 160);
    const sort = ['name', 'price'].includes(params.get('sort') ?? '') ? params.get('sort')! : 'recommended';
    const [search, setSearch] = useState(query.trim());
    const [filters, setFilters] = useState(false);
    const [city, setCity] = useState('');
    useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
    const feed = useDiscoveryFeed({ search, kind, category, branch, sort });
    const result = useFetchWrapper(() => StorefrontService.listStores(), []);
    const stores: Store[] = Array.isArray(result.data) ? result.data.filter(store => store.is_active !== false) : [];
    const branches = [...new Set(stores.map(store => store.branch_name).filter(Boolean))];
    const cities = [...new Set(stores.map(store => String(store.city ?? store.town ?? '').trim()).filter(Boolean))].sort();
    const visibleStores = city ? stores.filter(store => String(store.city ?? store.town ?? '').trim() === city) : stores;
    function update(values: Record<string, string>) { const next = new URLSearchParams(params); for (const [key, value] of Object.entries(values))
        if (value && value !== 'all' && value !== 'recommended')
            next.set(key, value);
        else
            next.delete(key); setParams(next, { preventScrollReset: true }); }
    const listedBusinesses = searching ? searchMarketplaceStores(visibleStores, query) : visibleStores.slice(0, 8);
    const businesses = (
      <section aria-labelledby="marketplace-businesses-title" aria-busy={result.loading}>
        <header className="reference-market-section-head">
          {searching
            ? <h3 id="marketplace-businesses-title" className="text-lg font-semibold">Businesses</h3>
            : <><h2 id="marketplace-businesses-title">Marketplace Businesses</h2><Link to="/categories">See All</Link></>}
        </header>
        {!searching && <p className="reference-market-meta">{city ? `Businesses in ${city}` : 'Browse marketplace businesses · select a listed city above.'}</p>}
        {result.loading ? <p className="reference-note" role="status">Loading businesses…</p>
          : result.error ? <ErrorState error={result.error} onRetry={() => { void result.retry().catch(() => {}); }} title="Businesses could not be loaded" />
          : listedBusinesses.length ? (
            <div className="reference-market-business-grid">
              {listedBusinesses.map(store => {
                const path = `/store/${encodeURIComponent(store.slug)}`;
                return (
                  <article className="reference-market-business" key={store.id}>
                    <Link to={path}>
                      <Photo src={store.image_url || store.banner_url || store.logo_url} alt={store.name} />
                      {searching ? <h4 className="px-3 pt-3 text-sm font-semibold">{store.name}</h4> : <h3>{store.name}</h3>}
                    </Link>
                    <p><ReferenceIcon name="pin" size={13} />{store.city || store.branch_name || 'Marketplace business'}</p>
                    <div className="reference-business-tags">
                      <span>{String(store.store_type ?? 'Store').replaceAll('_', ' ')}</span>
                      <Link to={path}>View store →</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <p className="reference-notice">{searching ? 'No published businesses match your search.' : 'No listed businesses in this city yet.'}</p>}
      </section>
    );
    return <div className="reference-marketplace reference-marketplace-home" id="top"><a className="discovery-skip" href="#marketplace-results">Skip to marketplace results</a><MarketplaceNavbar kind={kind} onKindChange={value => update({ kind: value, category: 'all' })} stores={stores} city={city} cities={cities} onCityChange={setCity}/><main className="reference-market-container">
    <form className="reference-market-search" role="search" onSubmit={event => { event.preventDefault(); setSearch(query.trim()); document.getElementById('marketplace-results')?.scrollIntoView({ block: 'start' }); }}><ReferenceIcon name="search" size={24}/><label className="sr-only" htmlFor="reference-market-query">Search products, services or businesses</label><input id="reference-market-query" type="search" value={query} onChange={event => update({ q: event.target.value })} maxLength={120} placeholder="Search the marketplace"/><button className="sr-only" type="submit">Search</button></form>
    <ReferenceMarketplaceHero content={home}/><MarketplaceCategories />
    <section id="marketplace-results" aria-labelledby="marketplace-results-title" aria-busy={feed.loading}><header className="reference-market-section-head"><h2 id="marketplace-results-title">{searching ? `Results for “${query.trim()}”` : kind === 'all' && category === 'all' ? 'Explore the marketplace' : 'Explore products & services'}</h2><button className="reference-link-button" aria-expanded={filters} aria-controls="reference-discovery-filters" onClick={() => setFilters(!filters)}>{filters ? 'Hide filters' : searching ? 'Filter offerings' : 'See All / Filters'}</button></header>
      {searching && businesses}
      {searching && <h3 className="mb-3 mt-6 text-lg font-semibold">Products &amp; services</h3>}
      {<p className="reference-market-meta">{feed.loading ? 'Loading offerings…' : feed.error ? 'Offerings unavailable' : `${feed.total} offerings`}</p>}
      {filters && <div className="reference-market-filters" id="reference-discovery-filters"><label>Show<select value={kind} onChange={event => update({ kind: event.target.value })}><option value="all">Products & services</option><option value="products">Products</option><option value="services">Services</option></select></label><label>Category<select value={category} onChange={event => update({ category: event.target.value })}><option value="all">All categories</option>{DISCOVERY_CATEGORIES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Branch<select value={branch} onChange={event => update({ branch: event.target.value })}><option value="">All branches</option>{branch && !branches.includes(branch) && <option value={branch}>{branch}</option>}{branches.map(name => <option key={name} value={name}>{name}</option>)}</select></label><label>Sort<select value={sort} onChange={event => update({ sort: event.target.value })}><option value="recommended">Explore a mix</option><option value="name">Name: A–Z</option><option value="price">Listed price: low to high</option></select></label><button onClick={() => update({ q: '', category: 'all', kind: 'all', branch: '', sort: 'recommended' })}>Clear filters</button></div>}
      {feed.error ? <ErrorState error={feed.error} onRetry={feed.retry} title="Marketplace could not be loaded"/> : feed.loading ? <div className="reference-market-card-grid" role="status">{[1, 2, 3, 4].map(index => <div className="reference-market-skeleton" key={index}/>)}<span className="sr-only">Loading marketplace…</span></div> : feed.items.length ? <><div className="reference-market-card-grid">{feed.items.map(item => <LiveOffering key={`${item.source}:${item.store_id}:${item.id}`} offering={item}/>)}</div><div className="reference-market-loadmore">{feed.moreError ? <p role="alert">More results could not be loaded. Your existing results are still here.</p> : <span>Showing {feed.items.length} of {feed.total}</span>}{(feed.hasMore || feed.moreError) && <button onClick={feed.loadMore} disabled={feed.loadingMore}>{feed.loadingMore ? 'Loading…' : feed.moreError ? 'Retry loading more' : 'Load more'}</button>}</div></> : <p className="reference-notice">No matching offerings yet. Try another search or category.</p>}
    </section>
    {!searching && businesses}
    {content.error && <p className="reference-note" role="status">Marketplace highlights could not be loaded. <button onClick={content.refresh}>Retry</button></p>}
    {(!home || home.deals.some(deal=>deal.active)) && <section aria-labelledby="reference-deals-title"><header className="reference-market-section-head"><h2 id="reference-deals-title">{home?'Deals & Offers':'Explore more'}</h2></header><div className="reference-deals-grid">{(home?home.deals.filter(deal=>deal.active):[{title:'Products & everyday essentials',text:'Browse products from marketplace businesses.',link:'/?kind=products#marketplace-results',image:'',active:true},{title:'Your favourite food, closer',text:'Explore food and restaurants.',link:'/?category=FOOD_BEVERAGE#marketplace-results',image:'',active:true},{title:'Help for your home',text:'Find a service or request an estimate.',link:'/?kind=services#marketplace-results',image:'',active:true}]).map((deal,index)=><Link key={index} className="reference-deal" to={deal.link}><div><h3>{deal.title}</h3><p>{deal.text}</p><span>Explore →</span></div>{deal.image?<Photo src={deal.image} alt="" className="reference-deal-photo"/>:<ReferenceIcon name={['package','cutlery','briefcase'][index%3]} size={48}/>}</Link>)}</div></section>}

  </main><MarketplaceFooter /><MobileMarketplaceNav /></div>;
}
export function CategoriesPage() { return <div className="reference-marketplace"><main className="reference-market-container reference-category-page"><Link to="/">← Marketplace</Link><h1>Explore categories</h1><p>Choose a starting point, then search or filter the results.</p><MarketplaceCategories /><p className="reference-note">Automotive currently opens car washes; Home opens repairs.</p><div className="reference-category-subcategories">{DISCOVERY_CATEGORIES.map(item => <Link key={item.id} to={`/?category=${item.id}`}>{item.label}<ReferenceIcon name="arrow"/></Link>)}</div></main><MobileMarketplaceNav /></div>; }
