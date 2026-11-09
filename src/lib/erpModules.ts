export type WorkspaceRole = 'owner' | 'admin';
export type PlannedFeature = {
  id: string;
  title: string;
  description: string;
  remaining: string[];
  dependency?: string;
};
type ModuleScope = { paths: string[]; planned: PlannedFeature[]; description?: string; title?: string };
export type BusinessModule = {
  id: string;
  title: string;
  icon: string;
  description: string;
  additional?: boolean;
  owner?: ModuleScope;
  admin?: ModuleScope;
};
const planned = (id: string, title: string, description: string, remaining: string[], dependency?: string): PlannedFeature =>
  ({ id, title, description, remaining, dependency });
const paths = (role: WorkspaceRole, names: string[]) => names.map(name => `/portal/${role}/${name}`);

/** Describes delivered entry points and planned work, never grants access or plan entitlements. */
export const businessModules: BusinessModule[] = [
  {
    id: 'sales', title: 'Sales & service operations', icon: 'bag',
    description: 'Manage sales and customer work from an agreed price to fulfilment.',
    owner: { paths: paths('owner', ['orders', 'counter', 'quotes', 'jobs', 'custom-orders', 'kitchen']), planned: [
      planned('sales-management', 'Integrated sales controls', 'Connect sales fulfilment to the manual invoice and credit-note records.', ['Invoices generated from sales and work records', 'Goods returns linked to the original sale', 'Customer credit limits and return policies'], 'Current accounting documents are manually recorded; they do not automatically post marketplace sales.'),
    ] },
    admin: { title: 'Operations', description: 'Review platform orders, service jobs, bookings, quotes, custom orders, merchants and stores.', paths: paths('admin', ['orders', 'operations', 'merchants', 'merchants/new', 'stores']), planned: [] },
  },
  {
    id: 'calendar', title: 'Calendar & scheduling', icon: 'calendar',
    description: 'Coordinate appointments and service visits using shared employee availability.',
    owner: { paths: paths('owner', ['bookings']), planned: [
      planned('scheduling', 'Advanced scheduling', 'Build on the existing booking and service-visit calendar.', ['Holiday and exceptional opening hours', 'Rescheduling with customer agreement', 'No-show handling and disclosed cancellation rules'], 'Changes must preserve employee capacity and follow approved refund policies.'),
    ] },
  },
  {
    id: 'inventory', title: 'Products, purchasing & inventory', icon: 'package',
    description: 'Manage the catalogue, purchasing, receipts and available stock.',
    owner: { paths: paths('owner', ['products', 'inventory', 'purchasing', 'stock-control', 'menu', 'tables']), planned: [
      planned('purchasing', 'Advanced purchasing', 'Extend supplier records, purchase orders, partial receiving and allocated bill payments.', ['Approval limits and multi-stage authorisation', 'Supplier editing and automated invoice-to-receipt matching']),
      planned('stock-control', 'Valuation & transfers', 'Build on recorded stock movements and stocktakes.', ['Inter-branch transfers and reorder rules', 'Automatic costing, valuation and warehouse locations']),
    ] },
    admin: { title: 'Catalogue management', description: 'Inspect merchant products, services and saved menu categories.', paths: paths('admin',['products','categories']), planned: [
      planned('catalogue-moderation', 'Catalogue moderation', 'Extend the working product, service and menu-category directories.', ['Offering review decisions and moderation history', 'Global discovery-category editing and offering mapping']),
    ] },
  },
  {
    id: 'finance', title: 'Finance & accounting', icon: 'wallet',
    description: 'Track recorded payments and settlements, with accounting clearly separated from collections.',
    owner: { paths: paths('owner', ['transactions', 'settlements', 'accounting', 'accounting/accounts', 'accounting/imports', 'reports', 'reconciliation']), planned: [
      planned('accounting', 'Accounting automation', 'Extend manual journals, source documents, allocated receivables/payables and period closure.', ['Automatic marketplace source postings', 'Receivables and payables ageing reports'], 'Manual books and gateway confirmations remain separate.'),
      planned('expenses', 'Expense approvals & attachments', 'Extend manual paid expense documents and accounting entries.', ['Evidence file attachments and approval limits', 'Unpaid expense approval and payment workflow']),
      planned('reconciliation', 'Reconciliation automation', 'Extend CSV statement imports, signed-amount journal matching and audited unmatching.', ['Automatic bank and provider feeds', 'Assisted matching and separate bank-account ledgers']),
      planned('financial-statements', 'Advanced financial reporting', 'Extend the manual-book trial balance, income/cost report and balance sheet.', ['Report exports and comparative periods', 'Automatic source-to-ledger reconciliation'], 'Reports include posted manual journals only.'),
    ] },
    admin: { paths: paths('admin', ['settlements','erp']), planned: [
      planned('revenue', 'Commissions & Revenue', 'Extend settlement commission records into platform revenue reporting.', ['Commission and fee reporting', 'Reconciliation and accounting treatment', 'Adjustments and refund treatment'], 'Merchant collections are not GeePay revenue or available payout float.'),
    ] },
  },
  {
    id: 'customers', title: 'Customers, CRM & support', icon: 'users',
    description: 'Review customers, source activity and follow-up notes using the original sales and service identities.',
    owner: { paths: paths('owner',['customers']), planned: [
      planned('crm', 'Advanced CRM', 'Extend the customer directory, source activity and dated follow-up notes.', ['Lead/opportunity pipelines and task completion', 'Customer segmentation and campaigns']),
      planned('support', 'Help & support', 'Follow customer issues through a clear support process.', ['Help content and confirmed contact options', 'Tickets, assignment and escalation', 'Links to the originating order, visit or payment']),
      planned('reviews', 'Verified reviews', 'Collect and manage feedback from eligible completed transactions.', ['Review eligibility and moderation', 'Ratings and recent-review summaries'], 'Ratings must come from genuine recorded reviews.'),
    ] },
    admin: { paths: paths('admin',['customers']), planned: [
      planned('support', 'Help & support', 'Manage platform support cases and their source records.', ['Confirmed help and contact information', 'Ticket assignment and escalation history']),
    ] },
  },
  {
    id: 'people', title: 'People & HR', icon: 'users',
    description: 'Manage team access, employee records, attendance and approved leave.',
    owner: { paths: paths('owner', ['team', 'roles', 'people']), planned: [
      planned('hr', 'Advanced HR', 'Extend protected attendance and approved leave that already blocks employee calendar time.', ['Employee contracts and detailed profiles', 'Employee leave self-service', 'Payroll and benefits'], 'Payroll remains outside Basic ERP.'),
    ] },
  },
  {
    id: 'growth', title: 'Marketing & promotions', icon: 'megaphone',
    description: 'Manage promotions that can also appear in marketplace shopping collections.',
    owner: { paths: [], planned: [
      planned('marketing', 'Marketing', 'Create promotions and campaigns tied to real offerings and prices.', ['Promotion dates, eligibility and discount rules', 'Checkout enforcement and marketplace publication', 'Campaign tools and measured performance']),
    ] },
    admin: { paths: [], planned: [
      planned('marketing', 'Marketing & Promotions', 'Oversee merchant promotions and platform campaigns in one process.', ['Promotion review and placement', 'Shared validity and price rules', 'Campaign attribution and reporting']),
    ] },
  },
  {
    id: 'reports', title: 'Reports & analytics', icon: 'chart',
    description: 'Extend recorded dashboard summaries with clearly defined business reports.',
    owner: { paths: [], planned: [
      planned('analytics', 'Analytics', 'Add reports using the records owned by sales, customers and finance.', ['Top products and service/booking rankings', 'Distinct customers, repeat purchases and retention', 'Comparable periods and exports', 'Measured campaign performance; an explainable health score only when its inputs exist'], 'Profit reports depend on Accounting; ratings depend on verified reviews. Existing operational dashboards remain available.'),
    ] },
    admin: { paths: [], planned: [
      planned('analytics', 'Analytics & Reports', 'Add platform rankings and comparable-period reporting.', ['Top performing categories', 'Merchant transaction-value and growth rankings', 'Defined refund, period and currency treatment', 'Report exports']),
      planned('geographic', 'Geographic Analytics', 'Add location-based aggregates and drill-down.', ['Reliable transaction location attribution', 'Location reports and map drill-down'], 'Only use recorded locations; do not invent proximity or distance.'),
    ] },
  },
  {
    id: 'administration', title: 'Administration & plans', icon: 'settings',
    description: 'Manage business configuration, access plans and shared workspace tools.',
    owner: { paths: paths('owner', ['stores', 'plans', 'activity']), planned: [
      planned('settings', 'Business settings', 'Bring advanced business preferences and configuration together.', ['Consolidated preferences and integration settings'], 'Existing branch, branding, team and role settings remain available in their own workspaces.'),
      planned('subscription-billing', 'Subscription billing', 'Complete the paid plan lifecycle around existing plan requests.', ['Payment-confirmed activation', 'Recurring collections, renewal and expiry', 'Agreed proration and billing history'], 'Current manual plan assignments and requests are not proof of payment.'),
      planned('notifications', 'Broader notifications', 'Extend the working ERP activity inbox and personal read markers to more workflows.', ['Marketplace events beyond purchasing, stock and accounting', 'Customer and staff notification delivery for all workflow changes']),
      planned('search', 'Record search', 'Find authorised records across business modules.', ['Search beyond menu section names', 'Permission-scoped results and record links']),
    ] },
    admin: { paths: paths('admin', ['admins/new', 'plans', 'notifications']), planned: [
      planned('system', 'System Management', 'Organise platform configuration and operational controls.', ['Integration configuration and audit views', 'Permission-scoped system controls']),
      planned('settings', 'Platform settings', 'Consolidate platform preferences and configuration.', ['Platform configuration and change history']),
      planned('subscription-billing', 'Subscription billing', 'Extend current plan management with a verified billing lifecycle.', ['Collection and payment-confirmed access', 'Renewal, expiry and proration', 'Billing exceptions and audit history']),
      planned('notifications', 'Broader notifications', 'Extend existing settlement alerts to other platform events.', ['Event types beyond settlement exceptions', 'Per-recipient unread state and deep links']),
      planned('search', 'Record search', 'Search authorised platform records rather than just menu sections.', ['Cross-module record search', 'Permission-scoped results']),
    ] },
  },
  {
    id: 'trust', title: 'Trust & compliance', icon: 'shield',
    description: 'Review verification, issues and compliance without losing their source history.',
    admin: { paths: paths('admin', ['kyc']), planned: [
      planned('disputes', 'Reviews & Disputes', 'Bring issue handling into a central queue while keeping reviews separate.', ['Central disputes queue linked to original work and payments', 'Separate review moderation and dispute decisions'], 'Existing service issue reporting and settlement holds remain in their working screens.'),
      planned('risk', 'Risk & Compliance', 'Extend current verification and activation controls.', ['Monitoring and exception queues', 'Recorded investigation and resolution decisions']),
    ] },
  },
  {
    id: 'online-presence', title: 'Online presence', icon: 'monitor', additional: true,
    description: 'Maintain the existing storefront and content; explore future website tools separately from ERP.',
    owner: { paths: paths('owner', ['store-settings']), planned: [
      planned('website', 'Website', 'Extend the existing storefront and branding with website-building tools.', ['Page layouts and merchant-managed content', 'Preview, publication and navigation controls']),
    ] },
    admin: { paths: paths('admin', ['marketplace', 'pages']), planned: [] },
  },
  {
    id: 'business-services', title: 'Business services', icon: 'briefcase', additional: true,
    description: 'Adjacent business services, separate from Enterprise ERP module delivery.',
    owner: { paths: [], planned: [
      planned('business-services', 'Business Services', 'Explore advisory and implementation services.', ['Service catalogue and enquiry process']),
      planned('financing', 'Financing', 'Request financing through an approved application process.', ['Application and supporting information', 'Provider review and status tracking'], 'No lending eligibility or approval is implied.'),
    ] },
    admin: { paths: [], planned: [
      planned('financing', 'Financing Pipeline', 'Process the same financing applications merchants submit.', ['Review and decision history', 'Merchant-facing application status']),
      planned('enterprise', 'Enterprise Enablement', 'Coordinate organisation setup and implementation requests.', ['Implementation request tracking', 'Approved module provisioning'], 'Custom ERP and E-Membership development are outside this increment.'),
    ] },
  },
];

export function modulesForRole(role: WorkspaceRole) { return businessModules.filter(module => module[role]); }
export function modulePath(role: WorkspaceRole, id?: string) { return `/portal/${role}/modules${id ? `/${id}` : ''}`; }
export function plannedFeaturePath(role: WorkspaceRole, id: string) { return `/portal/${role}/coming-soon/${id}`; }
export function moduleForPath(path: string): BusinessModule | undefined {
  const match = path.split('?')[0].replace(/\/plans\/(?:new|[^/]+\/edit)$/, '/plans').match(/^\/portal\/(owner|admin)\/(.+)$/);
  if (!match) return undefined;
  const role = match[1] as WorkspaceRole;
  if (match[2].startsWith('modules/')) return modulesForRole(role).find(module => module.id === match[2].slice(8));
  return modulesForRole(role).find(module => module[role]!.paths.includes(path.split('?')[0].replace(/\/plans\/(?:new|[^/]+\/edit)$/, '/plans')) ||
    module[role]!.planned.some(feature => `coming-soon/${feature.id}` === match[2]));
}
export function plannedFeature(role: WorkspaceRole, id: string) {
  const module = modulesForRole(role).find(item => item[role]!.planned.some(feature => feature.id === id));
  if (!module) return undefined;
  return { module, feature: module[role]!.planned.find(feature => feature.id === id)! };
}

export type ModuleAccess = 'available' | 'restricted' | 'checking' | 'plan-required' | 'plan-error';
export function moduleAccess(options: { permitted: boolean; permissionsLoading: boolean; planFeature?: string; planFeatures?: string[]; planError?: boolean }): ModuleAccess {
  if (options.permissionsLoading) return 'checking';
  if (!options.permitted) return 'restricted';
  if (!options.planFeature) return 'available';
  if (options.planError) return 'plan-error';
  if (!options.planFeatures) return 'checking';
  return options.planFeatures.includes(options.planFeature) ? 'available' : 'plan-required';
}
