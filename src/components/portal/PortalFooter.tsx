import { Link } from 'react-router-dom';
import { useMarketplace } from '@/lib/context/useMarketplace';

/** In the page's scroll area, never fixed over work or mobile navigation. */
export function PortalFooter() {
  const { selectedStore } = useMarketplace();
  return <footer className="mt-8 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-cream-dark pt-4 text-xs text-forest-muted">
    <p>© {new Date().getFullYear()} <span className="font-semibold text-charcoal">GeePay</span> · Merchant portal</p>
    <nav aria-label="Merchant portal footer" className="flex flex-wrap gap-x-5 gap-y-1">
      <Link to="/" className="inline-flex min-h-11 items-center font-medium hover:text-cobalt hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">Marketplace</Link>
      {selectedStore?.slug && <Link to={`/store/${selectedStore.slug}`} className="inline-flex min-h-11 items-center font-medium hover:text-cobalt hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">Your storefront</Link>}
    </nav>
  </footer>;
}
