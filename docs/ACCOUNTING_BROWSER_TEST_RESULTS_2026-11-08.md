# Accounting browser test results

Date: 8 November 2026. Result: **6 of 6 browser journeys passed**.

The normal local app at `http://127.0.0.1:5173/` was checked read-only for business data. Workflows that save records used the isolated acceptance app at `http://127.0.0.1:5174/`, API 8086 and database `geepay_release_hardening_test`. Gateway collections and disbursements were disabled and payment requests were blocked by the relevant browser checks. Labelled accounting fixtures remain in the isolated database.

| Journey | Result | What was checked |
| --- | --- | --- |
| Chart, imports and journals | PASS | Account create/edit, permanent identity, CSV upload, preview without persistence, duplicate-file recognition, closed-period rejection, detailed account/party review, confirmation, three-line import/composer, custom ledger and financial-report totals, draft invoices/bills |
| Staff, customer, branch and plan access | PASS | Employee PIN login, restricted finance/HR, branch isolation, customer denial, excluded Accounting routes/API/nav, recovery; original isolated plan restored |
| ERP lifecycle | PASS | Suppliers, orders, partial/full receiving, stock ledger, bill posting and allocations, invoice/credit/payment allocations, journal reversal, customer note, leave approval and per-user activity read marker |
| Reconciliation and periods | PASS | CSV statement import, matching, audited undo/rematch, reconciled reversal blocked with explanation, closed-period controls and mobile menu |
| Normal owner layouts | PASS | Responsive account rows, one highlighted navigation entry, invalid ledger-date guidance and disabled empty-import preview |
| Normal admin/customer UI | PASS | Admin chart and import history, read-only oversight, customer direct-route denial; current records or a correct empty history state |

Owner workflows were exercised at widths **320, 390, 768 and 1440 pixels**; admin UI at 390 and 1440. No browser exceptions were detected by these journeys. No live collection or disbursement was performed. No application fixes were needed during this retest; a reusable read-only admin/customer browser check was added.

## Evidence

- [Chart/import log](../../local-runtime/browser-retest-chart-imports-20261108.log)
- [Access log](../../local-runtime/browser-retest-access-20261108.log)
- [ERP lifecycle log](../../local-runtime/browser-retest-lifecycle-20261108.log)
- [Reconciliation/period log](../../local-runtime/browser-retest-controls-20261108.log)
- [Normal owner layout log](../../local-runtime/browser-retest-layout-20261108.log)
- [Admin/customer UI log](../../local-runtime/browser-retest-admin-20261108.log)
- [Mobile chart screenshot](../output/playwright/accounting-chart-rows-390.png)
- [Desktop imports screenshot](../output/playwright/accounting-imports-1440.png)

Replay sources are in `tests/browser/`: `accounting-chart-imports.js`, `basic-erp-access.js`, `basic-erp-lifecycle.js`, `basic-erp-controls.js`, `accounting-layout.js` and `accounting-admin-readonly.js`. These results establish the tested local journeys; they do not represent a production deployment test.
