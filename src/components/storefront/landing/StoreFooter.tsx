import { Link } from 'react-router-dom';
import { marketplaceHomePath } from '@/lib/storeRouting';
import { getStorefrontSettings } from '@/lib/normalizeApi';

export function StoreFooter({ store }) {
  const year = new Date().getFullYear();
  const settings = getStorefrontSettings(store);
  const blurb =
    settings.footer_blurb?.trim() || 'Pay securely with Mobile Money via Geepay.';

  return (
    <footer className="border-t border-cream-dark bg-cream-dark/40 px-4 py-12 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="font-serif text-xl text-forest">{store.name}</p>
        <p className="text-center text-xs text-forest-muted sm:text-sm">
          © {year} {store.name}. {blurb}
        </p>
        <div className="flex gap-6 text-xs font-medium text-forest-muted">
          <a href="#shop" className="hover:text-forest">
            Shop
          </a>
          <Link to={marketplaceHomePath()} className="hover:text-forest">
            All stores
          </Link>
          <Link to="/login" className="hover:text-forest">
            Merchant login
          </Link>
        </div>
      </div>
    </footer>
  );
}
