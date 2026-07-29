export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded ${className}`} aria-hidden="true" />;
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06),0_6px_18px_-2px_rgba(0,0,0,0.08)]"
          aria-hidden="true"
        >
          {/* Image with floating + skeleton */}
          <div className="relative aspect-square">
            <Skeleton className="h-full w-full rounded-none" />
            <Skeleton className="absolute bottom-2 right-2 h-7 w-7 rounded-full sm:h-8 sm:w-8" />
          </div>
          {/* Content */}
          <div className="px-2.5 pb-3 pt-2.5 sm:px-3.5 sm:pb-3.5 sm:pt-3">
            <Skeleton className="mb-1.5 h-4 w-4/5" />
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="mt-2 h-4 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
