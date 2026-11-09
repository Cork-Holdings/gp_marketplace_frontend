# Enterprise ERP module navigation

Navigation grouping was implemented on 30 October 2026. The basic ERP increment subsequently added manual Accounting, basic HR and basic CRM, with local acceptance tests completed on 4 November. Use the [ERP UAT guide](../../geepay-ecom/docs/BASIC_ERP_UAT_GUIDE.md) to test the implemented features. Advanced modules and paid recurring subscription collection remain planned. Custom ERP and E-Membership are excluded. Existing custom orders remain under Sales.

## Entry points

- Owner dashboard and module directory: `/portal/owner`
- Admin dashboard and module directory: `/portal/admin`
- Former `/portal/{role}/modules` entry points redirect to the corresponding dashboard.
- A module: `/portal/{owner|admin}/modules/{moduleId}`
- Existing owner/admin ERP links hand administrators to their read-only admin equivalents. Compatibility links for planned work redirect to a working module or the module directory.

The dashboard combines operational summaries and a Business modules directory. Detailed module overviews show saved counts, status bars and recent activity. The sidebar shows implemented, authorised links only. Planned modules, roadmap descriptions and unavailable plan controls are hidden. The internal backlog is [PLANNED_WORK.md](PLANNED_WORK.md), referenced by the paired project's `AGENTS.md`. The current module opens automatically, with native keyboard controls and the same groups in the mobile drawer. Main-content scrollbars are hidden without disabling scrolling.

## Module ownership — current baseline

| Module | Existing workspaces | Planned work |
|---|---|---|
| Sales & service operations | Orders, POS, quotes, jobs, custom orders and kitchen; admin source-record inspection | Automatic sales-to-accounting integration and controlled goods returns |
| Calendar & scheduling | Bookings and shared employee calendar, with service-visit commitments | Holidays, rescheduling and approved no-show/cancellation rules |
| Products, purchasing & inventory | Catalogue, variants, suppliers, purchase orders, receiving, stock movements, stocktake and adjustments; admin catalogue/menu-category inspection | Transfers, automated valuation and reorder rules |
| Finance & accounting | Manual ledger, AR/AP allocations, invoices, credit notes, expenses, reversals, reconciliation, period closure and manual-book statements; customer invoice delivery; read-only admin oversight | Automatic source posting, tax, separate bank ledgers and platform commission reporting |
| Customers, CRM & support | Existing source identities, customer directory, activity, notes and follow-up dates; admin customer directory | Manual prospect/contact entry, pipelines, support cases and verified reviews |
| People & HR | Team, roles, employee directory, attendance and approved leave integrated with employee availability | Contracts, employee self-service, payroll and benefits |
| Marketing & promotions | Existing storefront is the channel | Promotions, campaigns, eligibility and checkout discount enforcement |
| Reports & analytics | Dashboard operational summaries remain available | Product/service/customer/category/merchant reports, comparisons, exports and geographic attribution |
| Administration & plans | Branches, plans, platform admins and settlement alerts | Advanced configuration, subscription billing, broader notifications and record search |

Admin-only Trust & compliance groups KYC, central disputes/reviews and future risk controls. Online presence retains merchant Branding and admin Marketplace manager/Website pages; website builder is planned. Business services retains financing and implementation enquiries as adjacent services. They do not expand the Enterprise ERP delivery scope.

The registry is `src/lib/erpModules.ts`. Role-specific paths link existing menu definitions; tests require every existing non-dashboard route/placeholder to have exactly one owner. Adding a working module does not bypass its existing protected route, server permissions or plan gate.

## Availability and presentation

Each overview separates Available now from Coming soon. Available tools distinguish permission-required, checking, plan-required and plan-check-failed states, with plan review/retry where applicable. Planned feature cards have expandable remaining-work lists and a dedicated explanation page. Purchasing a plan is never presented as unlocking unimplemented features.

Owner/admin dashboards retain recorded metrics and operational panels. Repeated empty future-report panels and unavailable owner metric cards are replaced by a single Explore modules link; their planned reports remain documented in the relevant modules. No invented metrics or revenue values are added.

## Verification updated 6 November 2026

- 197 frontend tests passed, including admin redirects, registry ownership, preserved routes and access states.
- TypeScript, focused ESLint and production build passed. The existing large main-bundle warning remains (about 1.24 MB minified / 360 KB gzip); no performance certification is claimed.
- `tests/browser/erp-modules.js`: combined dashboard/directory, real owner/admin sign-ins, working links, hidden roadmap, keyboard navigation and mobile drawer; widths 320, 390, 768 and 1440; no page errors.
- `tests/browser/workspace-visibility.js`: all admin record views, owner-to-admin ERP handoff, aligned filters, five Mobile Grooming employees, reports and responsive layouts.
- `tests/browser/workspace-invoice-plans.js`: real isolated-database invoice posting/customer delivery/read state and dedicated plan create/edit pages with exact saved feature choices. No live collections or disbursements.
- `tests/browser/erp-module-access.js`: browser-only GET fixtures verify plan exclusion, permission denial, failed plan checks and retry. Actual permissions/plans are unchanged.
- Screenshots in `output/playwright/erp-finance-390.png`, `erp-finance-1440.png`, `erp-admin-trust-1440.png`.

## Remaining development and release gates

1. Follow the internal backlog in [PLANNED_WORK.md](PLANNED_WORK.md). Module pages show available tools and live snapshots, rather than a public roadmap.
2. Complete durable general notifications, permission-scoped record search, help/support contacts and issue queues. Existing admin settlement alerts remain working.
3. Extend the delivered manual posting, reversal and accounting controls into automatic source integration while keeping merchant and platform books separate.
4. Complete recurring subscription collection/activation, renewal, expiry and approved proration before describing plan requests as paid subscriptions.
5. Close outstanding private identity-document access, formal onboarding acceptance, payment/settlement exception recovery, device/role regression, performance, backup/restore and rollback gates using fresh evidence. These were not certified by this navigation change.

For concrete scheduling configuration and journey evidence, see backend `docs/VISIT_SCHEDULING.md`.
