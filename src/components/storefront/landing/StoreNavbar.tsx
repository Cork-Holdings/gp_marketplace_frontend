import { Link } from 'react-router-dom';
import { getStoreLogoUrl } from '@/lib/normalizeApi';
import { useState } from 'react';
import { useCart } from '@/lib/context/useCart';
import { marketplaceHomePath } from '@/lib/storeRouting';

const RETAIL_NAV_LINKS = [
  { label: 'Shop', href: '#shop' },
  { label: 'Featured', href: '#bestsellers' },
  { label: 'About', href: '#about' },
];

const FOOD_NAV_LINKS = [
  { label: 'Menu', href: '#shop' },
  { label: 'Featured', href: '#bestsellers' },
  { label: 'About', href: '#about' },
];

const DINE_IN_NAV_LINKS = [{ label: 'Menu', href: '#shop' }];

function CartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-forest-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

export function StoreNavbar({ store, onSearch, dineInMode = false, isFood = false }) {
  const { totals, toggleCart } = useCart();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const storeImage = getStoreLogoUrl(store);
  const navLinks = dineInMode ? DINE_IN_NAV_LINKS : isFood ? FOOD_NAV_LINKS : RETAIL_NAV_LINKS;
  const handleSearch = (e) => {
    e.preventDefault();
    onSearch?.(search.trim());
  };

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
        <div className="hidden items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr]">
          <nav className="flex items-center gap-6" aria-label="Main">
            {!dineInMode && (
              <Link
                to={marketplaceHomePath()}
                className="text-sm font-medium text-charcoal/80 transition hover:text-forest"
              >
                All stores
              </Link>
            )}
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-charcoal/80 transition hover:text-forest"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a href="#top" className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight text-forest">
            {storeImage ? (
              <img src={storeImage} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : null}
            {store.name}
          </a>
          <div className="flex items-center justify-end gap-3">
            <form onSubmit={handleSearch} className="relative hidden lg:block">
              <input
                type="search"
                placeholder={isFood || dineInMode ? 'Search menu…' : 'Search…'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  onSearch?.(e.target.value.trim());
                }}
                className="w-52 rounded-full border border-cream-dark bg-white py-2 pl-9 pr-4 text-sm text-charcoal placeholder:text-gray-400 focus:border-forest/30 focus:outline-none focus:ring-1 focus:ring-forest/20"
              />
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </span>
            </form>

            {!dineInMode && (
              <Link
                to="/login"
                className="hidden rounded-full border border-forest/25 px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest hover:bg-sage-light sm:inline-flex"
              >
                Merchant login
              </Link>
            )}

            <button
              type="button"
              onClick={() => toggleCart(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/15 text-charcoal transition hover:border-forest hover:text-forest"
              aria-label={`Open cart, ${totals.itemCount} items`}
            >
              <CartIcon />
              {totals.itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-forest text-[10px] font-bold text-white">
                  {totals.itemCount > 9 ? '9+' : totals.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-charcoal"
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

          <a href="#top" className="flex items-center gap-2 font-serif text-xl font-semibold text-forest">
            {storeImage ? (
              <img src={storeImage} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : null}
            {store.name}
          </a>

          <button
            type="button"
            onClick={() => toggleCart(true)}
            className="relative rounded-full p-2"
            aria-label={`Open cart, ${totals.itemCount} items`}
          >
            <CartIcon />
            {totals.itemCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-forest text-[9px] font-bold text-white">
                {totals.itemCount}
              </span>
            )}
          </button>
        </div>

        {menuOpen && (
          <nav className="mt-4 flex flex-col gap-3 border-t border-cream-dark pt-4 md:hidden">
            {!dineInMode && (
              <Link
                to={marketplaceHomePath()}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-charcoal/80"
              >
                All stores
              </Link>
            )}
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-charcoal/80"
              >
                {link.label}
              </a>
            ))}
            {!dineInMode && (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-full border border-forest/25 px-4 py-2.5 text-center text-sm font-semibold text-forest"
              >
                Merchant login
              </Link>
            )}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="search"
                placeholder={isFood || dineInMode ? 'Search menu…' : 'Search…'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  onSearch?.(e.target.value.trim());
                }}
                className="w-full rounded-full border border-cream-dark bg-white py-2.5 pl-4 pr-4 text-sm"
              />
            </form>
          </nav>
        )}
      </div>
    </header>
  );
}
