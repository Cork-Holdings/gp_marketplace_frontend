import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from '../common/Skeleton';
import { ErrorState } from '../common/ErrorState';

export function ProductGrid({ products, currency, onAdd, brandColor, loading, error, onRetry }) {
  if (loading) return <ProductGridSkeleton />;
  if (error) return <ErrorState error={error} onRetry={onRetry} title="Could not load products" />;

  const list = Array.isArray(products) ? products : products?.items ?? products?.data ?? [];

  if (list.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <p className="text-gray-500">No products available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {list.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          currency={currency}
          onAdd={onAdd}
          brandColor={brandColor}
        />
      ))}
    </div>
  );
}
