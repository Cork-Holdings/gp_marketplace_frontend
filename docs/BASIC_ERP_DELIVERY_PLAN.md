# GeePay Basic ERP — delivery and visual plan

30 October 2026 · Proposed scope and acceptance plan

**Delivery update, 6 November 2026.** The basic manual-accounting ERP increment was implemented and locally tested on 4 November. Use the [ERP UAT guide](../../geepay-ecom/docs/BASIC_ERP_UAT_GUIDE.md) for the features available now, sample entries, expected results and verification evidence. The original plan below also contains future work, including advanced sales/calendar workflows and automation. It is not a statement that every planned addition has shipped.

## 1. The product we are building

An SME owner should be able to run a trading or service business from GeePay: see today's work, sell, buy stock, manage customers and suppliers, assign staff, record costs, understand money owed and produce basic financial reports. The marketplace remains a source of business for the same records. Customers keep their shopping/service account; the ERP is the business workspace.

Build on the current React/Go/PostgreSQL application and its merchant/branch identity, catalogue, orders, POS, quotes, bookings, jobs, payments, receipts, permissions and module registry. Improve existing screens and workflows rather than starting another app or duplicating masters. Administrative oversight is a separate role view of the appropriate records. Merchant accounting and GeePay's own platform books remain separate.

Custom ERP, E-Membership, school/church industry systems and financing are outside this release. Existing custom orders are retained as sales/fulfilment workflows. This plan introduces no live financial transaction and promises no dates until scope and delivery capacity are agreed.

## 2. Basic ERP scope

| Area | Reuse now | Basic ERP addition | Defer from the first release |
|---|---|---|---|
| Sales & services | Orders, POS, quotes, jobs, custom orders, kitchen, customer acceptance | Consistent invoice/receipt/credit-note links, controlled returns, clearly surfaced next action | Complex pricing agreements, sales commissions and unrestricted credit sales |
| Calendar | Employee-linked resources, hours, bookings, proposed/accepted visit windows and shared conflict checks | Exception days, agreed rescheduling, cancellation/no-show policy and relevant customer notifications | Route optimisation, automatic travel estimation and complex shift rostering |
| Customers & suppliers | Existing customer identities and business transaction history | Business-scoped customer directory, supplier records, contact/activity history and follow-up tasks | Advanced lead scoring, campaigns, omnichannel contact centre and full CRM pipelines |
| Inventory & purchasing | Catalogue, variants, quantities and checkout stock safeguards | Purchase orders, receiving, append-only stock movements, stocktake, reasoned adjustments and reorder thresholds | Multi-stage manufacturing/MRP, batch/expiry/serial tracking and advanced warehouses |
| Finance | Confirmed payment records, receipts and the scoped quoted-service settlement workflow | Chart of accounts, balanced postings/reversals, sales invoices, supplier bills, expenses, AR/AP, bank/cash records, reconciliation and financial statements | Consolidation, complex tax automation, multi-currency accounting, budgets and fixed-asset depreciation |
| People | Team IDs, membership, roles, branch access and job assignments | Employee profile, leave requests and simple attendance records, protected separately from ordinary team access | Payroll calculation, statutory submissions, recruitment, appraisals and benefits administration |
| Reports | Real operational dashboards and collection trends | Sales, stock/reorder, customer balances, supplier balances, expenses, service workload and posted financial reports | Predictive analytics, health scores and unsupported marketing attribution |
| Platform | Existing plan configuration, active/default plans, permissions and module overviews | Durable notifications/read state, practical search, support entry points and audited configuration | New paid subscription promises before billing/renewal/expiry is implemented |

The first finance release may be restricted to ZMW and a single legal entity per business, with branches reporting inside it. Confirm that boundary rather than presenting cross-company or multi-currency accounting as delivered. Branch stock location and whether more than one stock location is required must be agreed before the inventory schema is finalised.

## 3. Visual experience: what the user should see

### A consistent workspace

- Keep the GeePay wordmark with Marketplace beneath it, existing DM Sans/Inter typography, navy, steel blue and aqua palette. Use gradients sparingly for a primary brand-entry action. Routine business and financial actions remain clear, solid controls.
- Keep the module groups already introduced. Place Dashboard first; expose Sales/work, Calendar and Products/stock as frequent destinations, with Finance, Customers, People, Reports and Settings available through the same navigation. Keep the module catalogue for planned capabilities.
- Start each module with its actual working summary and next actions. Keep planned work in the module's roadmap section, rather than filling the main dashboard with Coming Soon panels.
- Use semantic state labels and icons together: needs action, waiting for customer, paid/received, in progress, completed, blocked, disputed. Colour must not carry the meaning by itself. Operational completion, payment confirmation, payout success and accounting posting are distinct facts.

### Screen blueprint

| Surface | Visual layout | Interaction and content |
|---|---|---|
| Owner dashboard | Compact real indicators above a prioritised work queue and today's schedule; alerts in one consistent area | Period/branch filters have explicit scope; each alert opens the originating record; no invented revenue or profit |
| Lists | Clean table by default on desktop, with existing Action queue, Table/detail pane, Business ledger and Expandable table options retained | Search, filters, counts, pagination, clear status, next action; remember the user's chosen list view |
| Record detail | Summary/status at top, clear next step, organised tabs for details, activity, documents and financial records | Persistent context and clear prerequisites; no button invites an action already known to be invalid |
| Stock | Item/variant list with on-hand, reserved and available quantities only where their definitions are implemented; movement history below/detail pane | Receive, adjust or count through explicit actions with reasons; do not silently overwrite an audited balance |
| Purchasing | Progress tracker: draft PO → approved → received/part-received → billed → settled | Show quantity/price differences and who must act; receiving and supplier payment remain different events |
| Finance | Account balances and AR/AP ageing backed by posted records; transaction/journal/reconciliation views | Currency, period, source document, posting status and reversals are visible; drill down from a report to its entries |
| Customers | Searchable directory and selected customer's profile with orders, bookings/jobs, invoices, payments and notes | Tenant/merchant boundaries apply to every panel; use the existing customer identity |
| People | Employee directory with availability and assigned work; leave/attendance in appropriate tabs | Team access remains distinct from confidential HR data |
| Calendar | Existing employee lanes on desktop, agenda on mobile, date/team filters and clear unscheduled work | Proposals remain preferences until accepted/reserved; indicate actual resource and employee ownership |
| Reports | Few useful charts with exact-value tables and source links | Separate sales, collections and recognised revenue; provide empty/error/restricted states, not fabricated graphs |

### Mobile rules

- Design and inspect at 320, 390, 768 and 1440 pixels. Main tasks must be reachable without hover, clipped actions or horizontal page overflow.
- A table/detail pane becomes a readable list then a full record page on a phone. Keep actions near the selected record; avoid crowding every row with buttons.
- Keep touch targets at least 44 pixels, readable body text, visible keyboard focus and accessible labels. Preserve scrolling while hiding unwanted scrollbar chrome; do not conceal overflow by cutting off content.
- Show useful loading, empty, permission, plan, validation and network-retry states. Preserve draft inputs after a failure. Announce saved/failed/updated states appropriately.
- Retain calendar progress visualisers and service-work trackers. Use familiar icons with consistent strokes; use item/business photos where they help recognition.

## 4. Shared business records and event ownership

One identity or authoritative record per concept, scoped by merchant and branch as appropriate:

- Customer relationship → sales documents → fulfilment records → payment attempts/receipts.
- Supplier → purchase order → goods receipt → supplier bill → supplier payment.
- Product/variant → stock movements → on-hand/reservation/available calculations → inventory valuation.
- Employee identity → branch access → scheduling resource → booking/job; HR profile and leave reuse that employee reference.
- Financial source document/event → idempotent accounting entry → posting/reversal → reports/reconciliation.

Use foreign keys and immutable identifiers, not names, to link these records. A purchase, refund or status retry must not produce duplicate stock or accounting movements. Corrections use reversal/adjustment records with an actor and reason; posted records cannot simply be edited away. Source events feed notifications and reports without making those views the source of truth.

## 5. Delivery increments and exit gates

### Increment 0 — visual baseline and business decisions

Deliver: screen/state inventory of existing modules; reusable list/detail/form/confirmation/alert/calendar patterns; desktop and phone prototypes for Dashboard, Sales, Stock/Purchasing, Finance and Customers; first backlog arranged as complete workflows.

Decide: legal entity/currency boundaries, branches/stock locations, stock reservation semantics, valuation method, tax/invoice requirements, return/cancellation rules, accounting basis and approvers. Do not invent statutory treatment, financial dates or automatic release policies.

Exit: prototype review resolves navigation and task clarity; all core states are represented; the first release boundary and accounting/inventory rules are documented. Visual review does not replace runtime acceptance.

### Increment 1 — shared identities and daily work

Deliver: customer directory based on current identities, supplier directory, reusable activity history/documents, durable event notifications with per-user read state, permission-scoped search and confirmed support contacts. Refine the owner dashboard around work needing attention and today's schedule.

Exit: owner/staff can find a customer and related sale/job without copying IDs; another merchant cannot access those records; a real workflow change produces one appropriate notification, opens the correct record, and can be marked read by its recipient.

### Increment 2 — purchasing and stock control

Deliver: purchase order, optional approval within the agreed roles, partial goods receiving, auditable stock ledger, stocktake, reasoned adjustment, reorder thresholds and supplier bill reference. Agree posting contracts with Finance in this increment, even before full financial reports are exposed.

Exit: receive a partial PO, sell an item, return/correct a transaction and reconcile movement totals to the current stock balance. Test concurrency, retries, insufficient stock and cross-branch permissions. Reconcile legacy opening quantities before enabling the new ledger; do not count them as new purchases.

### Increment 3 — accounting and sales financial closure

Deliver: ledger/posting foundation, opening balances, invoices/credit notes, supplier bills, expenses, receivables/payables, reconciliation, periods and financial statements. Reuse the existing payment status model and receipts; connect Sales and Purchasing using controlled source postings.

Exit: one sale/collection, purchase/receipt/bill/payment, expense and return each produce the correct balanced accounting outcome, without double posting on retries. A reconciled report drills down to its source. Test failed/pending/reversed payments separately. Live financial acceptance is explicitly scheduled and authorised; simulation and collection do not prove settlement or payout.

### Increment 4 — service and people completion

Deliver: customer-agreed rescheduling, exceptional opening hours, cancellation/no-show handling, employee profiles, leave and simple attendance. Connect leave/unavailability to the calendar using approved rules while protecting existing commitments.

Exit: a new booking/visit respects capacity and employee unavailability; an accepted proposal survives job creation and reassignment; affected customers receive accurate change notices. Confidential HR data is inaccessible to ordinary staff and unauthorised roles. Payroll is still deferred.

### Increment 5 — reports, mobile polish and pilot acceptance

Deliver: reports based on the module owners' records, useful charts and export tables, accessible mobile/desktop states, migration/restore/rollback evidence and role-based testing guides.

Exit: a trading-business pilot and a service-business pilot complete the supported journeys using their actual configuration; opening stock/balances reconcile; financial outcomes are separately evidenced; support/exception journeys work; no known critical release blocker remains. Large-bundle performance, private identity-document access, onboarding and financial-recovery concerns from the current checklist remain explicit gates until verified closed.

Dependencies: Increment 0 establishes financial/stock rules; 1 supplies shared identities; 2 and 3 must agree their posting contract before either claims financial stock valuation; 4 builds on current scheduling; 5 verifies the integrated release. No durations are promised. Estimate after the scope decisions and the first vertical slice are reviewed.

## 6. Design and implementation cadence

For each increment:

1. Map a complete task and its roles, source records and failure cases.
2. Produce phone/desktop previews using GeePay's existing shell, components and real supported states. Use clearly labelled illustrative content only in design previews; operational screens use actual data.
3. Review visual hierarchy, actions, prerequisites, clarity, density and accessibility; make the prototype concrete before seeking a material design decision.
4. Implement the workflow across UI, API, database, configuration and notifications; preserve authentication, tenant isolation and existing work.
5. Run focused logic/concurrency tests, build/lint/type checks and role-based browser acceptance at narrow/wide widths.
6. Inspect screenshots and record evidence against the exit criteria, including limitations. Mark features Available only when their supported journey works.

Visuals are a deliverable in every increment: workflow map, phone/desktop screen previews, state inventory and tested screenshots. Visual acceptance and behavioural acceptance are tracked separately.

## 7. First practical slice

Use the existing boutique/retail workflow for the integrated stock/finance slice and Mulenga Mobile Grooming for the service/calendar slice. These are proposed pilot choices, not permission to alter their financial records.

First design packet: owner dashboard; customer directory/profile; supplier/PO/receiving screen; stock movement list/detail; invoice/payment/entry history; mobile versions and exception states. After the shared identity/notification foundation, the first integrated implementation slice should deliver a supplier → PO → goods receipt → stock movement journey with approved posting contracts. Finance ledger foundations should be designed alongside it.

Scope checkpoints still required: single or multiple legal entities; stock locations; accounting/valuation/tax rules; approval limits; document formats; HR/attendance rules; proposed pilot businesses and realistic test data; delivery capacity. Resolve these before implementation of dependent features, while visual design can proceed using explicitly labelled assumptions.

## 8. Evidence baseline and boundaries

The module grouping and scheduling work described in `ENTERPRISE_MODULES.md` and backend `docs/VISIT_SCHEDULING.md` was verified locally on 30 October 2026. It is the starting point, not proof that the planned ERP modules are implemented. Existing generic HR, Accounting and CRM placeholders have been organised into contextual module pages. Current plan configuration/manual access is not recurring subscription billing.

This turn produces a plan and design previews only. No application behaviour, payment settings, business records or hosting configuration is changed.

The accompanying delivery-roadmap and screen previews were inspected at 320, 390, 736 and 1024 pixels. Roadmap selection, module switching, record selection, list/detail versus full-record display and keyboard controls passed local browser checks without page errors; light and dark renderings were inspected. This validates the design previews, not the planned ERP features.
