import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { loadCartFromStorage } from '@/lib/storage';
import type { Store } from '@/types/store';
import type { DiscoveryKind } from '@/lib/discovery';
import { DiscoveryIcon } from './DiscoveryIcon';
import { MarketplaceBrand } from '@/components/reference/ReferenceUI';
import { ReferenceIcon } from '@/components/reference/ReferenceIcon';
import { cartQuantity } from '@/lib/referenceMarketplace';

export function GeePayWordmark() {
  return <span className="discovery-wordmark">GEE<span>PAY</span></span>;
}
export function MarketplaceNavbar({ kind, onKindChange, stores, city = '', cities = [], onCityChange }: { kind: DiscoveryKind; onKindChange: (kind: DiscoveryKind) => void; stores: Store[]; city?:string; cities?:string[]; onCityChange?:(city:string)=>void }) {
  const { isAuthenticated, hasRole } = useAuth();
  const isCustomer = isAuthenticated && hasRole('customer');
  const accountPath = isCustomer ? '/account' : isAuthenticated ? '/portal' : '/login';
  const [bagOpen, setBagOpen] = useState(false);
  const bagRef = useRef<HTMLDivElement>(null);
  const bagButton = useRef<HTMLButtonElement>(null);
  const carts = stores.flatMap(store => {
    const items = loadCartFromStorage(store.id);
    const quantity = cartQuantity(items);
    return quantity > 0 ? [{ store, quantity }] : [];
  });
  useEffect(() => {
    if (!bagOpen) return;
    function outside(e: PointerEvent) { if (!bagRef.current?.contains(e.target as Node)) setBagOpen(false); }
    function escape(e: KeyboardEvent) { if (e.key === 'Escape') { setBagOpen(false); bagButton.current?.focus(); } }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [bagOpen]);
  return <header className="discovery-header reference-market-header"><div className="discovery-container discovery-masthead">
    <Link to="/" aria-label="GeePay marketplace home"><MarketplaceBrand /></Link>
    <label className="reference-market-location"><ReferenceIcon name="pin"/><span className="sr-only">Choose a listed business city</span><select aria-label="Marketplace city" value={city} onChange={event=>onCityChange?.(event.target.value)}><option value="">All cities</option>{cities.map(name=><option key={name}>{name}</option>)}</select></label>
    <Link className="reference-market-heart" to="/coming-soon/favourites" aria-label="Favourites, coming soon"><ReferenceIcon name="heart" size={27}/></Link>
    <nav className="discovery-tabs" aria-label="Browse marketplace">{([{ value: 'all', label: 'Explore all', icon: 'grid' }, { value: 'products', label: 'Products', icon: 'bag' }, { value: 'services', label: 'Services', icon: 'service' }] as const).map(tab => <button key={tab.value} type="button" aria-pressed={kind === tab.value} onClick={() => onKindChange(tab.value)}><DiscoveryIcon name={tab.icon} /><span>{tab.label}</span></button>)}</nav>
    <div className="discovery-header-actions"><Link to={accountPath} className="discovery-account" aria-label={isAuthenticated ? 'My account' : 'Sign in'}><DiscoveryIcon name="user" /><span>{isAuthenticated ? 'My account' : 'Sign in'}</span></Link>
      <div ref={bagRef} className="discovery-bag-wrap"><button ref={bagButton} type="button" className="discovery-icon-button" aria-label={`Shopping bags${carts.length ? `, ${carts.length} stores` : ''}`} aria-expanded={bagOpen} aria-controls="discovery-bags" onClick={() => setBagOpen(!bagOpen)}><DiscoveryIcon name="bag" />{carts.length > 0 && <span className="discovery-bag-count">{carts.reduce((sum,cart)=>sum+cart.quantity,0)}</span>}</button>
        {bagOpen && <section id="discovery-bags" className="discovery-bag-panel" aria-label="Your shopping bags"><div><h2>Your shopping bags</h2><button type="button" className="discovery-icon-button" aria-label="Close shopping bags" onClick={() => { setBagOpen(false); bagButton.current?.focus(); }}><DiscoveryIcon name="close" size={18} /></button></div>{carts.length ? carts.map(({ store, quantity }) => <Link key={store.id} to={`/store/${encodeURIComponent(store.slug)}?cart=1#shop`}><strong>{store.name}</strong><span>{quantity} {quantity === 1 ? 'item' : 'items'} · Review bag <DiscoveryIcon name="arrow" size={16} /></span></Link>) : <><p>No products in your bags yet. Choose a product to explore its options at the business’s store.</p><button type="button" className="discovery-link-button" onClick={() => { onKindChange('products'); setBagOpen(false); }}>Explore products <DiscoveryIcon name="arrow" size={16} /></button></>}</section>}
      </div>
    </div>
  </div></header>;
}
