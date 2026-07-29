import { useMarketplace } from '@/lib/context/useMarketplace';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';

export function BranchSelector({ className = '' }) {
  const { stores, selectedStoreId, selectedStore, selectStore, loading } = useMarketplace();

  if (loading && !stores.length) {
    return <div className={`skeleton h-10 w-48 rounded-lg ${className}`} aria-hidden="true" />;
  }

  if (!stores.length) {
    return (
      <span className={`rounded-lg border border-dashed border-cream-dark px-3 py-2 text-sm text-forest-muted ${className}`}>
        No branch selected
      </span>
    );
  }

  if (stores.length === 1) {
    const store = stores[0];
    return (
      <span
        className={`inline-flex max-w-full items-center gap-2 truncate rounded-lg border border-cream-dark bg-white px-3 py-2 text-sm font-medium text-charcoal ${className}`}
        title={store.name}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-forest" aria-hidden="true" />
        <span className="truncate">{store.branch_name || store.name}</span>
      </span>
    );
  }

  return (
    <select
      value={selectedStoreId ?? selectedStore?.id ?? ''}
      onChange={(e) => selectStore(e.target.value)}
      className={`rounded-lg border border-cream-dark bg-white px-3 py-2 text-sm font-medium text-charcoal focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest ${className}`}
      aria-label="Select branch"
    >
      {stores.map((s) => (
        <option key={s.id} value={s.id}>
          {s.branch_name ? `${s.name} · ${s.branch_name}` : s.name}
        </option>
      ))}
    </select>
  );
}

export function StoreCategoryBadge() {
  const { selectedStore } = useMarketplace();
  const { categoryLabel } = useMarketplaceCapabilities(selectedStore);
  if (!selectedStore) return null;
  return (
    <span className="rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium text-forest">
      {categoryLabel}
    </span>
  );
}

export default BranchSelector;
