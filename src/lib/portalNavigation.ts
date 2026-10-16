const groups = [
  { id: 'overview', label: null, routes: ['/portal/owner'] },
  {
    id: 'daily-work', label: 'Daily work',
    routes: ['/portal/owner/counter', '/portal/owner/orders', '/portal/owner/quotes', '/portal/owner/jobs', '/portal/owner/bookings', '/portal/owner/custom-orders', '/portal/owner/kitchen'],
  },
  { id: 'money', label: 'Money', routes: ['/portal/owner/transactions'] },
  {
    id: 'business-setup', label: 'Business setup',
    routes: ['/portal/owner/stores', '/portal/owner/store-settings', '/portal/owner/products', '/portal/owner/menu', '/portal/owner/tables'],
  },
  { id: 'team-access', label: 'Team & access', routes: ['/portal/owner/team', '/portal/owner/roles'] },
] as const;

/** Group already-authorised links. Never add routes or hide unfamiliar/admin links. */
export function groupPortalNavigation<T extends { to: string }>(items: readonly T[]) {
  const knownRoutes = new Set<string>(groups.flatMap(group => [...group.routes]));
  const ungrouped = items.filter(item => !knownRoutes.has(item.to));
  const result: { id: string; label: string | null; items: T[] }[] = [];
  if (ungrouped.length) result.push({ id: 'ungrouped', label: null, items: ungrouped });
  for (const group of groups) {
    const routes = new Set<string>(group.routes);
    const members = items.filter(item => routes.has(item.to));
    if (members.length) result.push({ id: group.id, label: group.label, items: members });
  }
  return result;
}
