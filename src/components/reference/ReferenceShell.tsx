import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useAuth } from '@/lib/context/useAuth';
import { groupReferenceMenu, referenceActive, featurePath, type ReferenceMenuItem, type ReferenceRole } from '@/lib/referenceNavigation';
import type { ActivityCounts } from '@/hooks/useActivityCounts';
import type { Store } from '@/types/store';
import { MarketplaceBrand, Photo, Soon } from './ReferenceUI';
import { ReferenceIcon } from './ReferenceIcon';
import { MobileMarketplaceNav } from './MobileMarketplaceNav';
type Props = {
    role: ReferenceRole;
    items: ReferenceMenuItem[];
    counts: ActivityCounts;
    stores?: Store[];
    store?: Store;
    onStoreChange?: (id: string) => void;
};
export function ReferenceShell({ role, items, counts, stores = [], store, onStoreChange }: Props) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const name = user?.full_name ?? user?.email ?? 'Your account';
    const initials = name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
    const mainId = role === 'customer' ? 'account-main' : 'portal-main';
    const root = role === 'customer' ? '/account' : `/portal/${role}`;
    useEffect(() => { setOpen(false); setSearch(''); document.getElementById(mainId)?.scrollTo({ top: 0 }); }, [location.pathname, mainId]);
    useEffect(() => { const media = matchMedia('(min-width:1024px)'); const close = () => { if (media.matches)
        setOpen(false); }; media.addEventListener('change', close); return () => media.removeEventListener('change', close); }, []);
    const matches = search.trim() ? items.filter(item => item.label.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8) : [];
    const nav = <nav className="reference-menu" aria-label={`${role} sections`}>{groupReferenceMenu(items).map(group => <section className="reference-menu-group" key={group.label || 'overview'} aria-label={group.label || 'Overview'}>{group.label && <h2>{group.label}</h2>}{group.items.map(item => {
                const count = item.countKey ? counts[item.countKey] : undefined;
                return <Link key={item.to} to={item.to} className={`reference-menu-link${referenceActive(location.pathname, item.to) ? ' is-active' : ''}`} aria-current={referenceActive(location.pathname, item.to) ? 'page' : undefined} onClick={() => setOpen(false)}><ReferenceIcon name={item.icon}/><span>{item.label}</span>{item.comingSoon ? <Soon /> : count !== undefined && count > 0 ? <span className="reference-count" aria-label={`${count} total, not unread notifications`}>{count > 99 ? '99+' : count}</span> : null}</Link>;
            })}</section>)}</nav>;
    const sidebar = <aside className="reference-sidebar">
    <div className="reference-sidebar-brand"><Link to={root} aria-label="GeePay Marketplace dashboard"><MarketplaceBrand compact/></Link></div>
    {role === 'owner' && <div className="reference-store-identity"><Photo src={store?.logo_url || store?.image_url} className="reference-store-avatar"/><div><strong>{store?.name ?? 'Choose a business'}</strong><p>{store?.branch_name ?? 'Merchant workspace'}</p>{store?.slug && <Link to={`/store/${encodeURIComponent(store.slug)}`}>View Store <ReferenceIcon name="arrow" size={11}/></Link>}</div></div>}
    {role === 'customer' && <div className="reference-store-identity"><span className="reference-initials">{initials}</span><div><strong>{name}</strong><p>Your GeePay account</p><Link to="/">Browse Marketplace <ReferenceIcon name="arrow" size={11}/></Link></div></div>}
    {nav}
    <Link to={featurePath(role, 'support')} className="reference-help"><ReferenceIcon name="headset" size={25}/><span><strong>Need Help?</strong><small>Support options · Coming soon</small></span></Link>
  </aside>;
    return <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
    <div className={`reference-shell is-${role}`}>
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-white focus:p-3" href={`#${mainId}`}>Skip to content</a>
      {sidebar}
      <DialogPrimitive.Portal><DialogPrimitive.Overlay className="reference-overlay"/><DialogPrimitive.Content className={`reference-drawer reference-shell is-${role}`} aria-describedby={undefined}><DialogPrimitive.Title className="sr-only">{role} menu</DialogPrimitive.Title>{sidebar}<DialogPrimitive.Close className="reference-icon-button reference-drawer-close" aria-label="Close menu"><ReferenceIcon name="close"/></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>
      <div className="reference-workspace">
        <header className="reference-topbar">
          <DialogPrimitive.Trigger asChild><button type="button" className="reference-icon-button reference-mobile-trigger" aria-label="Open navigation menu"><ReferenceIcon name="menu"/></button></DialogPrimitive.Trigger>
          <div className="reference-global-search"><ReferenceIcon name="search" size={18}/><label className="sr-only" htmlFor={`reference-search-${role}`}>Search available menu sections</label><input id={`reference-search-${role}`} type="search" autoComplete="off" maxLength={100} placeholder={role === 'admin' ? 'Search merchants, customers, orders, products, reports...' : role === 'customer' ? 'Search orders, bookings, estimates, payments...' : 'Search orders, customers, products, reports...'} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Escape')
        setSearch(''); }} aria-describedby={search ? 'reference-search-help' : undefined}/>{search && <div className="reference-search-results" id="reference-search-help"><p>Matching menu sections. Search individual records inside their section.</p>{matches.length ? matches.map(item => <Link key={item.to} to={item.to} onClick={() => setSearch('')}><span>{item.label}</span>{item.comingSoon && <Soon />}</Link>) : <p>No matching section. Global record search is coming soon.</p>}</div>}</div>
          {role === 'owner' && stores.length > 0 && <div className="reference-branch-strip"><label htmlFor="reference-branch">Branch</label><select id="reference-branch" value={store?.id ?? ''} onChange={e => onStoreChange?.(e.target.value)}>{!store && <option value="">Choose a branch</option>}{stores.map(item => <option key={item.id} value={item.id}>{item.branch_name || item.name}</option>)}</select></div>}
          {role === 'admin' && <span className="reference-admin-period"><ReferenceIcon name="calendar" size={16}/>All-time totals · 30-day trends</span>}
          <div className="reference-topbar-actions">
            <Link className="reference-icon-button" aria-label="Notifications, coming soon" title="Notifications · Coming soon" to={featurePath(role, 'notifications')}><ReferenceIcon name="bell"/></Link>
            <Link className="reference-icon-button" aria-label="Help, coming soon" to={featurePath(role, 'support')}><ReferenceIcon name="help"/></Link>
            <details className="reference-profile"><summary aria-label={`${name}, account options`}><span className="reference-initials">{initials}</span><span><strong>{name}</strong><small>{role === 'admin' ? 'Administrator' : role === 'owner' ? 'Owner / staff' : 'Customer'}</small></span><ReferenceIcon name="chevron" size={15}/></summary><div className="reference-profile-menu"><Link to="/">Browse Marketplace</Link><Link to={featurePath(role, 'settings')}>Settings · Coming soon</Link><button type="button" onClick={() => { logout(); navigate('/login'); }}>Sign out</button></div></details>
          </div>
        </header>

        <div id={mainId} className="reference-main" role={role === 'customer' ? undefined : 'main'} tabIndex={-1}><Outlet /></div>
        {role === 'customer' && <MobileMarketplaceNav />}
      </div>
    </div>
  </DialogPrimitive.Root>;
}
