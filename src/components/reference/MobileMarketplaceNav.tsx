import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { ReferenceIcon } from './ReferenceIcon';
import { mobileAccountPaths } from '@/lib/referenceMarketplace';
import './reference-marketplace.css';

export function MobileMarketplaceNav() {
  const {isAuthenticated,isMerchant,isAdmin,isCustomer}=useAuth();
  const {pathname}=useLocation();
  const {account,store:myStore,orders}=mobileAccountPaths(isAdmin?'admin':isMerchant?'owner':isCustomer&&isAuthenticated?'customer':'guest');
  const tabs=[
    {label:'Marketplace',icon:'home',to:'/',active:pathname==='/'||pathname.startsWith('/store/')},
    {label:'Categories',icon:'grid',to:'/categories',active:pathname==='/categories'},
    {label:'Orders',icon:'bag',to:orders,active:pathname===orders||pathname.startsWith('/account/orders/')},
    {label:'My Store',icon:'store',to:myStore,active:pathname===myStore||pathname.startsWith('/portal/owner/stores/')},
    {label:'Account',icon:'user',to:account,active:pathname==='/account'||(pathname.startsWith('/account/')&&!pathname.startsWith('/account/orders/')&&pathname!=='/account/ledger')},
  ];
  return <nav className="reference-bottom-nav" aria-label="Marketplace navigation">{tabs.map(tab=><Link key={tab.label} to={tab.to} aria-current={tab.active?'page':undefined} className={tab.active?'is-active':''}><ReferenceIcon name={tab.icon} size={24}/><span>{tab.label}</span></Link>)}</nav>;
}
