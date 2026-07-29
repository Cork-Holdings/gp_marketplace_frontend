import { formatCurrency } from '@/lib/utils';

export function ProductCard({ product, currency, onAdd, brandColor }) {
  const outOfStock = product.stock_quantity !== undefined && product.stock_quantity <= 0;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative aspect-square bg-gray-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-gray-300" aria-hidden="true">
            📦
          </div>
        )}
        {outOfStock && (
          <span className="absolute inset-x-2 top-2 rounded bg-gray-900/75 px-2 py-0.5 text-center text-xs font-medium text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-base font-bold" style={{ color: brandColor }}>
            {formatCurrency(product.price, currency)}
          </span>
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => onAdd(product)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ backgroundColor: brandColor }}
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
