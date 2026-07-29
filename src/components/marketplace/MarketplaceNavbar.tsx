import { Link } from 'react-router-dom';
import { useState } from 'react';

export function MarketplaceNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <a href="#top" className="font-serif text-2xl font-semibold tracking-tight text-forest">
          Geepay
        </a>

        <nav className="hidden items-center gap-3 md:flex" aria-label="Marketplace">
          <a
            href="#stores"
            className="rounded-full px-4 py-2 text-sm font-medium text-charcoal/80 transition hover:text-forest"
          >
            Browse stores
          </a>
          <Link
            to="/register/merchant"
            className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-cream transition hover:bg-forest-dark"
          >
            Sell on Geepay
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-forest/25 px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-sage-light"
          >
            Merchant login
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-charcoal md:hidden"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col gap-3 border-t border-cream-dark px-4 py-4 md:hidden">
          <a href="#stores" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-charcoal/80">
            Browse stores
          </a>
          <Link
            to="/register/merchant"
            onClick={() => setMenuOpen(false)}
            className="rounded-full bg-forest px-4 py-2.5 text-center text-sm font-semibold text-cream"
          >
            Sell on Geepay
          </Link>
          <Link
            to="/login"
            onClick={() => setMenuOpen(false)}
            className="rounded-full border border-forest/25 px-4 py-2.5 text-center text-sm font-semibold text-forest"
          >
            Merchant login
          </Link>
        </nav>
      )}
    </header>
  );
}
