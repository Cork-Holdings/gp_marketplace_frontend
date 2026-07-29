import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from '../../common/Skeleton';
import { ErrorState } from '../../common/ErrorState';

import { normalizeProductList } from '@/lib/normalizeApi';

export function ShopGrid({ products, currency, onAdd, loading, error, onRetry, searchQuery = '' }) {
  if (loading) return <ProductGridSkeleton />;
  if (error) return <ErrorState error={error} onRetry={onRetry} title="Could not load products" />;

  const list = normalizeProductList(products);
  const filtered = searchQuery
    ? list.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : list;

  if (filtered.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-forest/20 py-16 text-center text-forest-muted">
        {searchQuery ? 'No products match your search.' : 'No products available yet.'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {filtered.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          currency={currency}
          onAdd={onAdd}
          index={index}
        />
      ))}
    </div>
  );
}
