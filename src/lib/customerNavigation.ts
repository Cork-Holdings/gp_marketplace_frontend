export const customerNavigation = [
  { id: 'home', label: null, items: [{ to: '/account', label: 'Home', icon: 'home' }] },
  { id: 'purchases', label: 'Shopping & requests', items: [
    { to: '/account/ledger', label: 'Orders', icon: 'orders' },
    { to: '/account/custom-orders', label: 'Custom requests', icon: 'custom' },
  ] },
  { id: 'services', label: 'Bookings & services', items: [
    { to: '/account/bookings', label: 'Bookings', icon: 'bookings' },
    { to: '/account/quotes', label: 'Estimates', icon: 'quotes' },
    { to: '/account/jobs', label: 'Service visits', icon: 'jobs' },
  ] },
  { id: 'money', label: 'Payments & receipts', items: [{ to: '/account/transactions', label: 'Payments', icon: 'payments' }] },
] as const;

export type CustomerNavItem = (typeof customerNavigation)[number]['items'][number];

export function isCustomerSectionActive(pathname: string, to: string) {
  if (to === '/account') return pathname === to || pathname === `${to}/`;
  if (to === '/account/ledger' && pathname.startsWith('/account/orders/')) return true;
  if (to === '/account/transactions' && (pathname === '/account/settlements' || pathname.startsWith('/account/settlements/'))) return true;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function customerSectionTitle(pathname: string) {
  return customerNavigation.flatMap(group => [...group.items]).find(item => isCustomerSectionActive(pathname, item.to))?.label ?? 'Your account';
}
