# GeePay accounting — delivered scope and next releases

Updated 8 November 2026. Internal agent roadmap; planned features stay hidden in the application until implemented and verified.

## Delivered foundation

- Branch-specific ZMW chart of accounts, code/name/classification/description, active/inactive controls and optimistic version checks.
- Eight seeded control accounts keep existing invoices, supplier bills, paid expenses and allocated payments compatible. Control accounts cannot be disabled; account codes and classifications are immutable.
- Searchable, paginated chart with real all-time debit/credit/net balances and date-filtered account ledgers.
- Manual 2–100-line balanced journals, immutable posting history and reversals. Reversals retain access to historical inactive accounts.
- CSV imports for new accounts, balanced journals including evidenced opening balances, and draft customer invoices/supplier bills.
- Templates, upload or paste, up to 1 MB / 500 data rows, validated preview, row-level messages, confirmation, complete rollback on error and duplicate-file recognition.
- Imported bills keep received-purchase-order ownership and unbilled received-value controls. Imported invoices use eligible existing customer IDs; neither guesses by name.
- Import audit metadata, existing role/branch/plan gates and read-only admin account/import views.
- Trial balance, income/expense result and balance sheet include custom account classifications.
- Existing supplier/customer allocations, CSV statement matching, accounting-period closure and individual ERP read markers.

Imports do not transfer money. Account imports create new codes only. Document imports create drafts; ordinary posting remains a separate review step. Opening journals do not establish individual customer/supplier allocations. The chart is branch-specific and currently has no parent/child hierarchy. Reconciliation still uses the established 1000 cash control account; a custom asset account does not automatically become a separately reconcilable bank account.

## Release 1 — complete daily sales and purchase accounting

1. Itemised invoices, supplier bills and credit notes: quantity, unit price, line description, disclosed discounts, payment terms, numbering and printable invoices.
2. Customer/supplier statements and as-of ageing: current, overdue intervals, reconciled opening allocations and links to original documents/payments/credits.
3. Separate bank/cash accounts, explicit control-account mapping, bank transfers and account-specific statement matching. Preserve signed cash direction, reversal restrictions and audited unmatching.
4. Supplier service/expense bills with an appropriate approval route, alongside existing stock-receipt-linked bills.

Acceptance: sale/request -> invoice -> customer statement -> collection/allocation -> bank match; purchase -> receipt -> supplier bill -> payable -> allocation -> bank match. Statements, the general ledger and trial balance must agree. Add supplier/customer onboarding without duplicating authoritative identities.

## Release 2 — connect operations to the ledger

- Explicit accounting mappings for marketplace sales, custom orders, bookings and completed service visits.
- Verified source posting, idempotent retries and corrections/reversals; preserve settlement, bank movement and accounting posting as distinct states.
- Inventory costing, cost of goods sold, purchase/sales returns, valuation and inter-branch stock movements.
- Reconcile gateway collections, charges, fees, held principal, commissions and disbursements to source records without treating collected money as profit or available float.

Acceptance: stock quantity and value reconcile; every automatic journal has an authoritative source and cannot post twice. Holds, releases and failed disbursements retain their own finance states.

## Release 3 — tax, reporting and financial controls

- Configurable tax codes/rates/effective dates and inclusive/exclusive treatment, tax accounts and reports. Applicable tax/fiscal requirements need their own verified implementation.
- Comparative profit and loss, cash-flow statement, report exports and complete general-ledger search.
- Financial-year close/opening carry-forward and retained earnings, with reviewed closing journals and an audit trail.
- Separate preparation, approval, posting and review permissions; approval thresholds and complete before/after audit history for mutable settings.
- Evidence attachments linked to expenses, bills and journals.

Acceptance: reconcile every report to posted journals; verify closed-period and approval concurrency, export scope, reversals and source evidence.

## Release 4 — management accounting

- Fixed-asset register, depreciation, disposals and supporting schedules.
- Budgets, actual-versus-budget reporting, cost centres/departments/projects and allocations.
- Recurring invoices/journals, reviewed reminders and optional foreign-currency accounting with explicit exchange-rate treatment.
- Cash forecasting and management alerts derived from real obligations and balances.

Payroll remains a separate People/HR project that can later post approved payroll summaries into accounting. No future capability should appear as a working tool before it is implemented.
