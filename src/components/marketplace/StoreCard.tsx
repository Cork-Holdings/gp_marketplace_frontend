import { Link } from 'react-router-dom';
import { CATEGORY_LABELS, resolveStoreCategory } from '@/lib/workflows';
import { storeHomePath } from '@/lib/storeRouting';
import { formatCurrency } from '@/lib/utils';
import type { Store } from '@/types/store';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80';

function storeTypeLabel(store: Store): string {
  const type = store.store_type ?? store.type;
  if (type && typeof type === 'string') return String(type).replace(/_/g, ' ');
  const category = resolveStoreCategory(store);
  return CATEGORY_LABELS[category] ?? category;
}

function deliveryHint(store: Store): string | null {
  const flat = parseFloat(store.delivery_fee_flat as string);
  if (isNaN(flat)) return null;
  if (flat === 0) return 'Free delivery';
  const currency = store.currency ?? 'GHS';
  return `${formatCurrency(flat, currency)} delivery`;
}

function resolveImages(store: Store) {
  const cover = store.banner_url ?? store.image_url ?? null;
  const logo = store.logo_url ?? null;
  const effectiveCover = cover ?? logo ?? FALLBACK_IMAGE;
  const effectiveLogo = logo && logo !== effectiveCover ? logo : null;
  return { cover: effectiveCover, logo: effectiveLogo };
}

export function StoreCard({ store }: { store: Store }) {
  const { cover, logo } = resolveImages(store);
  const label = storeTypeLabel(store);
  const isInactive = store.is_active === false;
  const delivery = deliveryHint(store);

  return (
    <Link
      to={storeHomePath(store.slug)}
      className={[
        'group relative flex flex-col overflow-hidden rounded-2xl bg-white',
        'shadow-[0_1px_4px_rgba(0,0,0,0.06),0_6px_18px_-2px_rgba(0,0,0,0.08)]',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-[0_4px_22px_rgba(56,61,146,0.2),0_1px_4px_rgba(0,0,0,0.06)]',
        'active:scale-[0.98] active:duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40 focus-visible:ring-offset-2',
        isInactive ? 'opacity-75' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* ── Hero image ──────────────────────────────────────────────── */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-cobalt-50/60 to-sky-50/60">
        <img
          src={cover}
          alt=""
          loading="lazy"
          decoding="async"
          className={[
            'h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]',
            isInactive ? 'saturate-50 brightness-90' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />

        {/* Gradient scrim */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent"
          aria-hidden="true"
        />

        {/* Category chip — glass pill */}
        <span className="absolute left-2.5 top-2.5 max-w-[calc(100%-3.5rem)] truncate rounded-full bg-cobalt/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm sm:text-[11px]">
          {label}
        </span>

        {/* Closed overlay */}
        {isInactive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-white/20 bg-black/55 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
              Closed
            </span>
          </div>
        )}

        {/* Logo badge */}
        {logo && (
          <div className="absolute bottom-3 left-3">
            <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-white shadow-md sm:h-10 sm:w-10">
              <img src={logo} alt={`${store.name} logo`} className="h-full w-full object-cover" />
            </div>
          </div>
        )}

        {/* Visit arrow — floating CTA matching ProductCard "+" */}
        <span
          className={[
            'absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full',
            'bg-white/90 text-cobalt backdrop-blur-sm shadow-md',
            'transition-all duration-200',
            'group-hover:scale-[1.12] group-hover:bg-brand-gradient group-hover:text-white group-hover:shadow-[0_4px_14px_rgba(56,61,146,0.55)]',
          ].join(' ')}
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="font-serif text-base font-bold leading-snug text-charcoal sm:text-lg">
          {store.name}
        </h3>

        {store.description ? (
          <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-forest-muted sm:line-clamp-2 sm:text-[13px]">
            {store.description}
          </p>
        ) : null}

        {/* Meta pills */}
        {(store.ussd_code || delivery) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-2.5">
            {store.ussd_code && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800 sm:px-2.5 sm:py-1 sm:text-[11px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
                {store.ussd_code}
              </span>
            )}
            {delivery && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-semibold text-success-fg sm:px-2.5 sm:py-1 sm:text-[11px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-2.5 w-2.5 shrink-0 sm:h-3 sm:w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
                {delivery}
              </span>
            )}
          </div>
        )}

        {/* CTA row */}
        <div className="mt-auto pt-3">
          <span className="text-xs font-semibold text-cobalt transition-colors group-hover:text-cobalt-dark sm:text-sm">
            Visit store
          </span>
        </div>
      </div>
    </Link>
  );
}
