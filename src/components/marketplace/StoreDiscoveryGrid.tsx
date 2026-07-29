import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { getActiveStores } from '@/lib/normalizeApi';
import { FALLBACK_STORE_TYPES, normalizeStoreTypes } from '@/lib/storeConfig';
import { StoreCard } from './StoreCard';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';

export function StoreDiscoveryGrid({
  stores,
  storeTypes,
  loading,
  error,
  onRetry,
}) {
  const [typeFilter, setTypeFilter] = useState('all');

  const types = useMemo(() => {
    const normalized = normalizeStoreTypes(storeTypes);
    return normalized.length > 0 ? normalized : FALLBACK_STORE_TYPES;
  }, [storeTypes]);

  const active = useMemo(() => getActiveStores(stores ?? []), [stores]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return active;
    return active.filter((s) => {
      const t = String(s.store_type ?? s.type ?? '').toUpperCase();
      return t === typeFilter.toUpperCase();
    });
  }, [active, typeFilter]);

  return (
    <section id="stores" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-forest-muted">Marketplace</p>
        <h2 className="mt-2 font-serif text-3xl text-charcoal sm:text-4xl">
          Browse <em className="not-italic text-forest">stores</em>
        </h2>
      </div>

      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
            typeFilter === 'all'
              ? 'bg-forest text-cream'
              : 'border border-cream-dark bg-white text-forest-muted hover:border-forest hover:text-forest'
          }`}
        >
          All
        </button>
        {types.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTypeFilter(t.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition sm:text-sm ${
              typeFilter === t.value
                ? 'bg-forest text-cream'
                : 'border border-cream-dark bg-white text-forest-muted hover:border-forest hover:text-forest'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} title="Could not load stores" />
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-forest/20 py-16 text-center text-forest-muted">
          <p className="font-medium text-charcoal">No stores yet</p>
          <p className="mt-2 text-sm">Check back soon, or register as a merchant to list yours.</p>
          <Link
            to="/register/merchant"
            className="mt-6 inline-flex rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-cream"
          >
            Sell on Geepay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
          {filtered.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </section>
  );
}
