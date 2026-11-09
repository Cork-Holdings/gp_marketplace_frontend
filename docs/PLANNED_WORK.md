# Planned work — internal project roadmap

Updated 6 November 2026. This is the agent-facing backlog. Planned features must stay out of navigation, dashboards, module overviews and plan selectors until implemented and verified. Existing compatibility URLs may redirect to a working workspace.

ERP navigation uses the shared sidebar and mobile menu, filtered by active plan, role permissions and branch access. Duplicate ERP tabs and the mobile module selector are removed. Module overviews list only eligible tools. Long record tables use shared 25-row local pagination while preserving existing server paging, source retrieval limits and complete report totals.

The current Basic ERP UAT guide describes delivered behaviour. Admin oversight is read-only. Paid plan billing, automatic tax and automatic marketplace posting are not implied by available plan flags.

## Sales & service operations — owner

### Integrated sales controls

Connect sales fulfilment to the manual invoice and credit-note records.

- [ ] Invoices generated from sales and work records
- [ ] Goods returns linked to the original sale
- [ ] Customer credit limits and return policies

Dependency — Current accounting documents are manually recorded; they do not automatically post marketplace sales.

## Calendar & scheduling — owner

### Advanced scheduling

Build on the existing booking and service-visit calendar.

- [ ] Holiday and exceptional opening hours
- [ ] Rescheduling with customer agreement
- [ ] No-show handling and disclosed cancellation rules

Dependency — Changes must preserve employee capacity and follow approved refund policies.

## Products, purchasing & inventory — owner

### Advanced purchasing

Extend supplier records, purchase orders, partial receiving and allocated bill payments.

- [ ] Approval limits and multi-stage authorisation
- [ ] Supplier editing and automated invoice-to-receipt matching
### Valuation & transfers

Build on recorded stock movements and stocktakes.

- [ ] Inter-branch transfers and reorder rules
- [ ] Automatic costing, valuation and warehouse locations

## Products, purchasing & inventory — admin

### Catalogue moderation

Extend the working product, service and menu-category directories.

- [ ] Offering review decisions and moderation history
- [ ] Global discovery-category editing and offering mapping

## Finance & accounting — owner

### Accounting automation

Delivered on 8 November: a configurable branch chart, multi-line journals, account ledgers and CSV imports for new accounts, balanced journals and draft customer invoices/supplier bills. See `docs/ACCOUNTING_ROADMAP.md` for the remaining accounting roadmap.

Extend manual journals, source documents, allocated receivables/payables and period closure.

- [ ] Automatic marketplace source postings
- [ ] Receivables and payables ageing reports

Dependency — Manual books and gateway confirmations remain separate.
### Expense approvals & attachments

Extend manual paid expense documents and accounting entries.

- [ ] Evidence file attachments and approval limits
- [ ] Unpaid expense approval and payment workflow
### Reconciliation automation

Extend CSV statement imports, signed-amount journal matching and audited unmatching.

- [ ] Automatic bank and provider feeds
- [ ] Assisted matching and separate bank-account ledgers
### Advanced financial reporting

Extend the manual-book trial balance, income/cost report and balance sheet.

- [ ] Report exports and comparative periods
- [ ] Automatic source-to-ledger reconciliation

Dependency — Reports include posted manual journals only.

## Finance & accounting — admin

### Commissions & Revenue

Extend settlement commission records into platform revenue reporting.

- [ ] Commission and fee reporting
- [ ] Reconciliation and accounting treatment
- [ ] Adjustments and refund treatment

Dependency — Merchant collections are not GeePay revenue or available payout float.

## Customers, CRM & support — owner

### Advanced CRM

Extend the customer directory, source activity and dated follow-up notes.

- [ ] Lead/opportunity pipelines and task completion
- [ ] Customer segmentation and campaigns
### Help & support

Follow customer issues through a clear support process.

- [ ] Help content and confirmed contact options
- [ ] Tickets, assignment and escalation
- [ ] Links to the originating order, visit or payment
### Verified reviews

Collect and manage feedback from eligible completed transactions.

- [ ] Review eligibility and moderation
- [ ] Ratings and recent-review summaries

Dependency — Ratings must come from genuine recorded reviews.

## Customers, CRM & support — admin

### Help & support

Manage platform support cases and their source records.

- [ ] Confirmed help and contact information
- [ ] Ticket assignment and escalation history

## People & HR — owner

### Advanced HR

Extend protected attendance and approved leave that already blocks employee calendar time.

- [ ] Employee contracts and detailed profiles
- [ ] Employee leave self-service
- [ ] Payroll and benefits

Dependency — Payroll remains outside Basic ERP.

## Marketing & promotions — owner

### Marketing

Create promotions and campaigns tied to real offerings and prices.

- [ ] Promotion dates, eligibility and discount rules
- [ ] Checkout enforcement and marketplace publication
- [ ] Campaign tools and measured performance

## Marketing & promotions — admin

### Marketing & Promotions

Oversee merchant promotions and platform campaigns in one process.

- [ ] Promotion review and placement
- [ ] Shared validity and price rules
- [ ] Campaign attribution and reporting

## Reports & analytics — owner

### Analytics

Add reports using the records owned by sales, customers and finance.

- [ ] Top products and service/booking rankings
- [ ] Distinct customers, repeat purchases and retention
- [ ] Comparable periods and exports
- [ ] Measured campaign performance; an explainable health score only when its inputs exist

Dependency — Profit reports depend on Accounting; ratings depend on verified reviews. Existing operational dashboards remain available.

## Reports & analytics — admin

### Analytics & Reports

Add platform rankings and comparable-period reporting.

- [ ] Top performing categories
- [ ] Merchant transaction-value and growth rankings
- [ ] Defined refund, period and currency treatment
- [ ] Report exports
### Geographic Analytics

Add location-based aggregates and drill-down.

- [ ] Reliable transaction location attribution
- [ ] Location reports and map drill-down

Dependency — Only use recorded locations; do not invent proximity or distance.

## Administration & plans — owner

### Business settings

Bring advanced business preferences and configuration together.

- [ ] Consolidated preferences and integration settings

Dependency — Existing branch, branding, team and role settings remain available in their own workspaces.
### Subscription billing

Complete the paid plan lifecycle around existing plan requests.

- [ ] Payment-confirmed activation
- [ ] Recurring collections, renewal and expiry
- [ ] Agreed proration and billing history

Dependency — Current manual plan assignments and requests are not proof of payment.
### Broader notifications

Extend the working ERP activity inbox and personal read markers to more workflows.

- [ ] Marketplace events beyond purchasing, stock and accounting
- [ ] Customer and staff notification delivery for all workflow changes
### Record search

Find authorised records across business modules.

- [ ] Search beyond menu section names
- [ ] Permission-scoped results and record links

## Administration & plans — admin

### System Management

Organise platform configuration and operational controls.

- [ ] Integration configuration and audit views
- [ ] Permission-scoped system controls
### Platform settings

Consolidate platform preferences and configuration.

- [ ] Platform configuration and change history
### Subscription billing

Extend current plan management with a verified billing lifecycle.

- [ ] Collection and payment-confirmed access
- [ ] Renewal, expiry and proration
- [ ] Billing exceptions and audit history
### Broader notifications

Extend existing settlement alerts to other platform events.

- [ ] Event types beyond settlement exceptions
- [ ] Per-recipient unread state and deep links
### Record search

Search authorised platform records rather than just menu sections.

- [ ] Cross-module record search
- [ ] Permission-scoped results

## Trust & compliance — admin

### Reviews & Disputes

Bring issue handling into a central queue while keeping reviews separate.

- [ ] Central disputes queue linked to original work and payments
- [ ] Separate review moderation and dispute decisions

Dependency — Existing service issue reporting and settlement holds remain in their working screens.
### Risk & Compliance

Extend current verification and activation controls.

- [ ] Monitoring and exception queues
- [ ] Recorded investigation and resolution decisions

## Online presence — owner

### Website

Extend the existing storefront and branding with website-building tools.

- [ ] Page layouts and merchant-managed content
- [ ] Preview, publication and navigation controls

## Business services — owner

### Business Services

Explore advisory and implementation services.

- [ ] Service catalogue and enquiry process
### Financing

Request financing through an approved application process.

- [ ] Application and supporting information
- [ ] Provider review and status tracking

Dependency — No lending eligibility or approval is implied.

## Business services — admin

### Financing Pipeline

Process the same financing applications merchants submit.

- [ ] Review and decision history
- [ ] Merchant-facing application status
### Enterprise Enablement

Coordinate organisation setup and implementation requests.

- [ ] Implementation request tracking
- [ ] Approved module provisioning

Dependency — Custom ERP and E-Membership development are outside this increment.

## Additional gaps discovered during local UAT

- [ ] Manually create a customer or prospect before any order, quote, booking or request, using a proper customer/contact identity and permissions.
- [ ] Full customer invoice payment integration. Issued ERP invoices are visible to their account holder, with recorded balances; posting does not initiate a GeePay collection.
- [ ] Native-device UAT and production deployment acceptance.

## Delivery rule

After a feature is completed, update this backlog and the UAT guide, enable the relevant real route and plan feature, and verify roles, branch isolation, mobile layout and error recovery. Do not replace missing data with demo values.

## Public discovery backlog

- [ ] Saved items / favourites with real per-user persistence.
- [ ] Product and business scan-to-search.
- [ ] Discount, arrival and clearance collections backed by eligibility and price rules. Active admin-published marketplace highlights remain available.
- [ ] Additional top-level categories supported by real discovery workflows. Unimplemented category links remain hidden.
