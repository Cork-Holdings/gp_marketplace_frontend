# Geepay E-Commerce Frontend

Mobile-first React storefront and merchant portal for African SME e-commerce with USSD/M-Pesa QR checkout.

This app follows the same architecture, tooling, and conventions as the `geepay-nfs` ("Frontend") payment-gateway app — a Vite + React + TypeScript SPA with Radix/shadcn UI primitives, a typed `lib/api` service layer, and route-group folder organization — adapted for this app's 4-party marketplace domain (system admin, store owner/merchant, customer, and anonymous/public) rather than `geepay-nfs`'s 2-party admin/merchant model.

## Stack

- **React 19** + **TypeScript** + **Vite 7**
- **React Router 7** (declarative, all routes in `src/App.tsx`) for multi-tenant routing
- **Tailwind CSS 3.4** (`tailwind.config.js` + `postcss.config.js`, `darkMode: 'class'`)
- **Radix UI + shadcn-style primitives** in `src/components/ui/`, composed with `class-variance-authority`/`clsx`/`tailwind-merge` (`cn()` in `src/lib/utils.ts`)
- **Native `fetch`** via `src/lib/api/crud.ts` — no Axios
- **React Context** (split provider/context/hook files under `src/lib/context/`) for auth, marketplace, realtime orders, and cart state

## Quick Start

```bash
npm install
npm run dev
```

Ensure the backend API is running at `http://localhost:8080` (see `Geepay-Ecom.postman_collection.json`).

Copy `.env.example` to `.env` and adjust `VITE_API_BASE_URL` if needed.

## Project structure

```
src/
├── (admin)/       # system_admin feature folders: dashboard, kyc, merchants-onboarding, platform-admins, stores
├── (owner)/       # store_owner/merchant feature folders: dashboard, stores, businesses, products, orders
├── (customer)/    # authenticated customer area: ledger
├── (public)/      # unauthenticated marketing/storefront: storefront, checkout, login, register
├── components/    # ui/ (Radix+shadcn primitives), shared/, storefront/, variants/, onboarding/, portal/, scheduling/, common/
├── hooks/         # cross-feature hooks
├── layouts/       # PortalDashboardLayout, PublicStorefrontLayout
├── lib/
│   ├── api/       # crud.ts (fetch client), end_points.ts (route map), services/ (domain service objects)
│   ├── context/   # split provider/context/hook files per concern (auth, cart, marketplace, realtime-order)
│   ├── validations/
│   └── ProtectedRoute.tsx, permissions.ts, storage.ts, utils.ts, ...
├── types/         # domain TypeScript types
├── App.tsx, main.tsx, index.css, vite-env.d.ts
public/
└── images/hero/   # static landing-page assets, referenced as root-absolute paths
```

Route-group folders (`(admin)/(owner)/(customer)/(public)`) are organizational only, matching the `geepay-nfs` convention — all routes are still declared explicitly in `App.tsx`, not derived from the file system.

## Routes

| Route | Description |
|-------|-------------|
| `/` | **Default store landing page** (customer entry point) |
| `/checkout` | Checkout for the default store |
| `/store/:store_slug` | Multi-tenant storefront by slug |
| `/store/:store_slug/checkout` | Checkout for a specific store |
| `/portal/login` | Merchant/admin login |
| `/account/ledger` | Customer purchase ledger (RBAC: `customer`) |
| `/portal/admin/*` | System admin (RBAC: `system_admin`) |
| `/portal/owner/*` | Store owner dashboard (RBAC: `merchant`, `store_owner`) |

## Features

- **Multi-tenant storefront** — resolves store by URL slug, applies branding
- **Persistent cart** — localStorage per store; subtotal, delivery, 16% VAT
- **USSD QR checkout** — pure SVG QR encoder (no third-party QR lib); polls payment status
- **Portal RBAC** — admin onboarding, inventory CRUD, order Kanban, revenue analytics
- **Network resilience** — offline detection, skeleton loaders, retry buttons

## API

All endpoints mirror the Postman collection and are organized under `src/lib/api/`:

- `src/lib/api/crud.ts` — fetch client with JWT injection, 401 refresh-and-retry, offline detection
- `src/lib/api/end_points.ts` — named route-key → path map (`getRoute()`/`pipe()`/`withQuery()`)
- `src/lib/api/services/` — domain service objects (`AuthService`, `AdminService`, `OwnerService`, `CustomerService`, `StorefrontService`, `MerchantService`), barrel-exported from `services/index.ts`

Implemented checkout flow:

- `POST /stores/:storeId/checkout` → returns `ussd_payload`, `qr_data`, `order`
- `GET /stores/:storeId/orders/:orderId/payment-status` → poll payment status (legacy `payment-qr` still works)

## Security Notes

- No `dangerouslySetInnerHTML` — QR rendered as React SVG elements
- Bearer tokens stored in localStorage; attached via `src/lib/api/crud.ts`
- Input displayed as React text nodes (XSS-safe)

## Deviations from the `geepay-nfs` target architecture

This app intentionally diverges from `geepay-nfs`'s conventions in a few places, documented here rather than silently drifted into:

- **`AccountType` is widened, not collapsed.** `geepay-nfs` models a 2-party system (`'admin' | 'merchant'`). This app is a 4-party marketplace, so `src/types/auth.ts` defines `AccountType = 'system_admin' | 'store_owner' | 'merchant' | 'customer'`.
- **localStorage keys are unchanged.** Tokens/user/cart remain under `geepay_access_token`, `geepay_user`, `geepay_cart_*` rather than being renamed to `gp_auth_token`/`gp_auth_user` — renaming would silently log out every existing user on deploy.
- **`VITE_API_BASE_URL` is kept** instead of renaming to `VITE_BACKEND_URL`, since it's already the documented, wired-through env var for this app.
- **Route-group names are `(admin)/(owner)/(customer)/(public)`**, not `(admin)/(merchant)/(public)`, to reflect this app's four parties (`store_owner` and `merchant` roles both map to `(owner)/`).
# gp_marketplace_frontend
