# Payment receipts

Product orders keep their existing order receipt. Bookings, quoted services and custom/bulk orders now offer receipts using the same receipt surface and thermal-print treatment.

- Open a paid request's **View receipt** link, or **Payments** in the customer account. Completed service visits also link the quoted-service receipt. Historic booking receipts remain available after the booking changes status.
- Only saved successful workflow-payment attempts are returned by the customer-authenticated `GET /api/v1/customers/me/payment-receipts` route. It is customer-filtered and subject to row-level security. No collection or settlement request is made by this endpoint.
- Optional `kind` and `source_id` filters select one request. `limit` is 1–50 and `offset` is non-negative; lists return `items` and `has_more`.
- The payment's recorded amount, reference and confirmation timestamp are used, not today's price or an inferred balance. Source title, business and customer are descriptive current labels, not a historical itemised invoice snapshot.
- Custom-order `deposit` may represent the entire price when no deposit was required, so receipts label that legacy stage **Initial payment**. Balance payments have a separate receipt.
- Simulations are labelled **Test payment receipt** and **No real money moved**. A refunded simulation keeps its original receipt with a clear refunded marker. Pending/failed collections do not become receipts.
- Provider charges or levies are not invented or folded into principal. Where the gateway charges an additional amount not recorded here, the receipt explicitly says the separate fee/levy is not included. These are payment receipts, not tax invoices or proof of merchant disbursement.
- **Print / save PDF** opens the browser print dialog for the selected receipt only. It does not print automatically or email the receipt.

Verification: focused Go tests plus the opt-in `GEEPAY_RECEIPT_READONLY_DATABASE_URL` local read-only integration test; frontend `node --test tests/paymentReceipts.test.mjs`; browser coverage for existing paid receipts, unauthenticated denial, request links, retry and 320/390/1440px layouts. No live collection or disbursement is required to test receipts.
