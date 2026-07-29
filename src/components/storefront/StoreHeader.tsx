import { useCart } from '@/lib/context/useCart';

export function StoreHeader({ store, brandColor }) {
  const { totals, toggleCart } = useCart();

  return (
    <header
      className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-sm"
      style={{ borderBottomColor: `${brandColor}22` }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: brandColor }}
              aria-hidden="true"
            >
              {(store.name ?? 'S')[0]}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900">{store.name}</h1>
            {store.description && (
              <p className="text-xs text-gray-500 line-clamp-1">{store.description}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => toggleCart(true)}
          className="relative rounded-full p-2 transition hover:bg-gray-100"
          aria-label={`Open cart, ${totals.itemCount} items`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {totals.itemCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: brandColor }}
            >
              {totals.itemCount > 9 ? '9+' : totals.itemCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
