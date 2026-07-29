import { Link } from 'react-router-dom';

export function MarketplaceFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cream-dark bg-cream-dark/40 px-4 py-12 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="font-serif text-xl text-forest">Geepay</p>
        <p className="text-center text-xs text-forest-muted sm:text-sm">
          © {year} Geepay. Pay securely with Mobile Money.
        </p>
        <div className="flex gap-6 text-xs font-medium text-forest-muted">
          <a href="#stores" className="hover:text-forest">
            Stores
          </a>
          <Link to="/register/merchant" className="hover:text-forest">
            Sell on Geepay
          </Link>
          <Link to="/login" className="hover:text-forest">
            Merchant login
          </Link>
        </div>
      </div>
    </footer>
  );
}
