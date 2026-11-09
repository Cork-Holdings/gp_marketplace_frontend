# GeePay branding and platform management

The supplied guide is the authority: Prussian Blue `#10182B`, Steel Blue `#257DC1`, Sky Aqua `#30C5F4`, Amber Gold `#FBBF24`, and white. The supplied GeePay wordmark is used without cropping, recoloring or distortion. DM Sans and Inter remain the interface fonts.

DM Sans owns headlines and product/business names; Inter supports detailed interface copy. Selected brand-entry actions may opt into `gp-brand-cta`: marketplace/storefront hero links, Sign in, and the dashboard's primary quick action. The steel-to-aqua gradient has a navy contrast scrim for white labels, with darker hover/focus and a flat disabled fallback. Payment, settlement, destructive, secondary and routine table actions do not opt in. See `BRAND_UI_REVIEW_2026_10_21.md` for measured gaps and proposed follow-up work.

## Where to manage

- Admin → Subscription plans: `/portal/admin/plans`
- Admin → Marketplace manager: `/portal/admin/marketplace`
- Admin → Website pages: `/portal/admin/pages`
- Owner → Subscription Plan: `/portal/owner/plans`
- Published information pages: `/pages/:slug`; published links also appear in the marketplace footer.

Migration `052_platform_plans_pages.sql` seeds Free (K0), Business (K199 monthly / K1,990 yearly), and Business Pro (K499 monthly / K4,990 yearly). These are administrator-editable starting prices, not payment records. The free default includes existing operational modules so deployment does not remove current access. Initial paid plans deliberately do not claim additional working modules that do not exist.

## Plan rules

- Exactly one free, active default. Set a replacement default before deactivating the old one.
- Only active plans appear to owners. An inactive assigned plan falls back to the default.
- Core catalogue and fulfilment remain enabled. Inventory and Sales/POS are configurable optional modules, with server-side write checks as well as workspace/menu checks.
- HR, CRM and advanced analytics are unavailable; the plan editor cannot grant them as working features. Existing dashboard summaries remain available.
- Owners/managers can submit or replace a monthly/yearly plan-change request. No charge occurs and no paid access is granted automatically.
- Admin manual access assignments require a reason. They are complimentary/manual grants, not proof of payment.

**Recurring subscription collection, renewal, expiry, proration and payment-confirmed activation are not implemented.** Existing marketplace live payment configuration is unchanged. Do not describe these plan requests as paid subscriptions.

## Content rules

Content is plain text, not executable HTML. Explicit publication controls public visibility. Destinations are internal links; images accept local paths or HTTPS URLs. Inactive banners are hidden. Saving a published record as a draft unpublishes it; there is no separate scheduled publication or historical revision browser. Revision numbers reject stale edits.

## Verification

Frontend: `node --test tests/*.test.mjs`, `npx tsc -p tsconfig.app.json --noEmit`, `npm run lint`, `npm run build`.

Backend: `go test ./internal/service/platform ./internal/handler/platform ./internal/service/order`; set `GEEPAY_PLATFORM_TEST_DATABASE_URL` to a migrated local PostgreSQL database to run the temporary-table plan/order integration checks. `go vet ./internal/service/platform ./internal/handler/platform ./cmd/api`.

Kitchen fixes cover permission bootstrap on direct reload, valid PostgreSQL enum filters for active/history/pickup, and mobile history-table containment. Shared record tables preserve keyed fragment identities.
