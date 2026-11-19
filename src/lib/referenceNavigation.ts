import { moduleForPath, modulePath, modulesForRole } from './erpModules.ts';

export type ReferenceRole = 'owner' | 'admin' | 'customer';
export type ReferenceMenuItem = {
  label: string;
  to: string;
  icon: string;
  group: string;
  comingSoon?: boolean;
  foodOnly?: boolean;
  countKey?: 'quotes' | 'jobs' | 'bookings' | 'custom' | 'pendingKyc';
};

export function featurePath(role: ReferenceRole, feature: string) {
  return `${role === 'customer' ? '/account' : `/portal/${role}`}/coming-soon/${feature}`;
}

function future(role: ReferenceRole, label: string, feature: string, icon: string, group: string): ReferenceMenuItem {
  return { label, to: featurePath(role, feature), icon, group, comingSoon: true };
}

export const ownerReferenceMenu: ReferenceMenuItem[] = [
  { label: 'Dashboard', to: '/portal/owner', icon: 'home', group: '' },
  { label: 'Orders', to: '/portal/owner/orders', icon: 'bag', group: 'Daily work' },
  { label: 'Bookings', to: '/portal/owner/bookings', icon: 'calendar', group: 'Daily work', countKey: 'bookings' },
  { label: 'Quotes', to: '/portal/owner/quotes', icon: 'document', group: 'Daily work', countKey: 'quotes' },
  { label: 'Service jobs', to: '/portal/owner/jobs', icon: 'briefcase', group: 'Daily work', countKey: 'jobs' },
  { label: 'Custom orders', to: '/portal/owner/custom-orders', icon: 'package', group: 'Daily work', countKey: 'custom' },
  { label: 'Sales & POS', to: '/portal/owner/counter', icon: 'chart', group: 'Daily work' },
  { label: 'Kitchen', to: '/portal/owner/kitchen', icon: 'flame', group: 'Daily work', foodOnly: true },
  { label: 'Transactions', to: '/portal/owner/transactions', icon: 'wallet', group: 'Money' },
  { label: 'Payments & Settlements', to: '/portal/owner/settlements', icon: 'wallet', group: 'Money' },
  {label:'Chart of accounts',to:'/portal/owner/accounting/accounts',icon:'layers',group:'Money'},
  {label:'Accounting imports',to:'/portal/owner/accounting/imports',icon:'document',group:'Money'},
  {label:'Accounting',to:'/portal/owner/accounting',icon:'document',group:'Money'},
  {label:'Reconciliation & periods',to:'/portal/owner/reconciliation',icon:'wallet',group:'Money'},
  {label:'Financial reports',to:'/portal/owner/reports',icon:'chart',group:'Money'},
  {label:'ERP activity inbox',to:'/portal/owner/activity',icon:'bell',group:'Account'},
  future('owner', 'Financing', 'financing', 'coins', 'Money'),
  { label:'Subscription Plan', to:'/portal/owner/plans',icon:'layers',group:'Money' },
  { label: 'Products & Services', to: '/portal/owner/products', icon: 'package', group: 'Business setup' },
  { label: 'Inventory', to: '/portal/owner/inventory', icon: 'layers', group: 'Business setup' },
  {label:'Purchasing',to:'/portal/owner/purchasing',icon:'bag',group:'Business setup'},
  {label:'Stock control',to:'/portal/owner/stock-control',icon:'layers',group:'Business setup'},
  { label: 'Stores', to: '/portal/owner/stores', icon: 'store', group: 'Business setup' },
  { label: 'Branding', to: '/portal/owner/store-settings', icon: 'image', group: 'Business setup' },
  { label: 'Menu', to: '/portal/owner/menu', icon: 'list', group: 'Business setup', foodOnly: true },
  { label: 'Tables', to: '/portal/owner/tables', icon: 'grid', group: 'Business setup', foodOnly: true },
  future('owner', 'Website', 'website', 'monitor', 'Business setup'),
  { label: 'Team', to: '/portal/owner/team', icon: 'users', group: 'Team & access' },
  { label: 'Roles', to: '/portal/owner/roles', icon: 'shield', group: 'Team & access' },
  {label:'Employees (HR)',to:'/portal/owner/people',icon:'users',group:'Team & access'},
  {label:'Customers (CRM)',to:'/portal/owner/customers',icon:'users',group:'Growth & insights'},
  future('owner', 'Marketing', 'marketing', 'megaphone', 'Growth & insights'),
  future('owner', 'Analytics', 'analytics', 'chart', 'Growth & insights'),
  future('owner', 'Business Services', 'business-services', 'grid', 'Growth & insights'),
  future('owner', 'Settings', 'settings', 'settings', 'Account'),
];

export const adminReferenceMenu: ReferenceMenuItem[] = [
  { label: 'Dashboard', to: '/portal/admin', icon: 'home', group: '' },
  { label: 'Orders', to: '/portal/admin/orders', icon: 'document', group: 'Operations' },
  { label: 'Merchants', to: '/portal/admin/merchants', icon: 'users', group: 'Operations' },
  { label: 'Onboard Merchant', to: '/portal/admin/merchants/new', icon: 'plus', group: 'Operations' },
  { label: 'All Stores', to: '/portal/admin/stores', icon: 'store', group: 'Operations' },
  {label:'Service & booking records',to:'/portal/admin/operations',icon:'calendar',group:'Operations'},
  {label:'Customers',to:'/portal/admin/customers',icon:'users',group:'Operations'},
  {label:'Products & Services',to:'/portal/admin/products',icon:'package',group:'Catalog'},
  {label:'Categories',to:'/portal/admin/categories',icon:'grid',group:'Catalog'},
  future('admin', 'Marketing & Promotions', 'marketing', 'megaphone', 'Growth'),
  { label:'Payments & Settlements',to:'/portal/admin/settlements',icon:'wallet',group:'Money' },
  {label:'Business ERP oversight',to:'/portal/admin/erp',icon:'layers',group:'Money'},
  future('admin', 'Commissions & Revenue', 'revenue', 'coins', 'Money'),
  future('admin', 'Reviews & Disputes', 'disputes', 'message', 'Trust & support'),
  { label: 'KYC Review', to: '/portal/admin/kyc', icon: 'shield', group: 'Trust & support', countKey: 'pendingKyc' },
  future('admin', 'Risk & Compliance', 'risk', 'shield', 'Trust & support'),
  future('admin', 'Analytics & Reports', 'analytics', 'chart', 'Intelligence'),
  future('admin', 'Geographic Analytics', 'geographic', 'globe', 'Intelligence'),
  future('admin', 'Financing Pipeline', 'financing', 'coins', 'Ecosystem'),
  future('admin', 'Enterprise Enablement', 'enterprise', 'briefcase', 'Ecosystem'),
  future('admin', 'System Management', 'system', 'settings', 'Administration'),
  { label: 'Platform Admins', to: '/portal/admin/admins/new', icon: 'users', group: 'Administration' },
  { label:'Subscription plans',to:'/portal/admin/plans',icon:'layers',group:'Administration' },
  { label:'Settlement alerts',to:'/portal/admin/notifications',icon:'bell',group:'Administration' },
  { label:'Marketplace manager',to:'/portal/admin/marketplace',icon:'store',group:'Administration' },
  { label:'Website pages',to:'/portal/admin/pages',icon:'document',group:'Administration' },
  future('admin', 'Settings', 'settings', 'settings', 'Administration'),
];

export const marketplaceReferenceCategories = [
  { id: 'products', label: 'Products', icon: 'cart', tone: 'mint' },
  { id: 'food', label: 'Food', icon: 'cutlery', tone: 'peach' },
  { id: 'services', label: 'Services', icon: 'scissors', tone: 'pink' },
  { id: 'automotive', label: 'Automotive', icon: 'car', tone: 'blue' },
  { id: 'education', label: 'Education', icon: 'education', tone: 'violet' },
  { id: 'health', label: 'Health', icon: 'heart', tone: 'rose' },
  { id: 'home', label: 'Home', icon: 'home', tone: 'gold' },
  { id: 'events', label: 'Events', icon: 'ticket', tone: 'sky' },
  { id: 'professional', label: 'Professional', icon: 'briefcase', tone: 'peach' },
] as const;

export function groupReferenceMenu(items: ReferenceMenuItem[]) {
  const role = items.some(item => item.to.startsWith('/portal/admin')) ? 'admin' :
    items.some(item => item.to.startsWith('/portal/owner')) ? 'owner' : undefined;
  const groups: { label: string; to?: string; items: ReferenceMenuItem[] }[] = [];
  if (role) {
    const overview = items.filter(item => !moduleForPath(item.to));
    if (overview.length) groups.push({ label: '', items: overview });
    for (const module of modulesForRole(role)) {
      const members = items.filter(item => moduleForPath(item.to)?.id === module.id);
      if (members.length) groups.push({
        label: module[role]!.title ?? module.title, to: modulePath(role, module.id), items: members,
      });
    }
    return groups;
  }
  for (const item of items) {
    let group = groups.find(value => value.label === item.group);
    if (!group) { group = { label: item.group, items: [] }; groups.push(group); }
    group.items.push(item);
  }
  return groups;
}

export function referenceActive(path: string, to: string) {
  const base = to.split('?')[0];
  if (['/portal/owner', '/portal/admin', '/account'].includes(base)) return path === base || path === `${base}/`;
  // A dedicated onboarding entry must not activate the merchant-directory link too.
  if (base === '/portal/admin/merchants') return path === base;
  return path === base || path.startsWith(`${base}/`);
}
