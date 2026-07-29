import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/account/ledger', label: 'Orders' },
  { to: '/account/transactions', label: 'Transactions' },
] as const;

export function AccountNav() {
  return (
    <nav
      className="flex gap-1 rounded-lg border border-cream-dark bg-cream/40 p-1"
      aria-label="Account"
    >
      {LINKS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            [
              'flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition',
              isActive
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-forest-muted hover:text-forest',
            ].join(' ')
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

export default AccountNav;
