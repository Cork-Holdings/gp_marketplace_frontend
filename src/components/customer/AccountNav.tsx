import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';

const LINKS = [
  { to: '/account/ledger', label: 'Orders' },
  { to: '/account/quotes', label: 'Quotes' },
  { to: '/account/jobs', label: 'Jobs' },
  { to: '/account/bookings', label: 'Bookings' },
  { to: '/account/custom-orders', label: 'Custom requests' },
  { to: '/account/transactions', label: 'Transactions' },
] as const;

export function AccountNav() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <nav
      className="customer-account-nav"
      aria-label="Account"
    >
      {LINKS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            isActive ? 'customer-account-link is-active' : 'customer-account-link'
          }
        >
          {label}
        </NavLink>
      ))}
      <button type="button" onClick={() => { logout(); navigate('/login'); }} className="customer-account-link customer-signout">Sign out</button>
    </nav>
  );
}

export default AccountNav;
