export function ActivityBadge({ count, className = '' }: { count?: number; className?: string }) {
  if (!count) return null;
  return <span aria-hidden="true" className={`inline-flex min-w-5 items-center justify-center rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums text-white ${className}`}>{count > 99 ? '99+' : count}</span>;
}
