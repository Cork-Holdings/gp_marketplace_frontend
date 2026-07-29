import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { usePermissions } from '@/lib/context/permissions';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { canAccessNav, hasPermission, PERM } from '@/lib/permissions';
import { BranchSelector } from '@/(owner)/stores/BranchSelector';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  to: string;
  end?: boolean;
  icon: ReactNode;
  primary?: boolean;
};

const iconClass = 'h-4 w-4 shrink-0';

const Icons = {
  overview: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  stores: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    </svg>
  ),
  catalog: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  ),
  orders: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  ),
  menu: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  tables: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h18M3 14h18M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
      />
    </svg>
  ),
  kitchen: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
      />
    </svg>
  ),
  counter: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  transactions: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  team: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  roles: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  business: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  branding: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  more: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
      />
    </svg>
  ),
  onboard: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    </svg>
  ),
  kyc: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  admins: (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
};

const adminNav: NavItem[] = [
  { label: 'Overview', to: '/portal/admin', end: true, icon: Icons.overview, primary: true },
  { label: 'Onboard Merchant', to: '/portal/admin/merchants/new', icon: Icons.onboard },
  { label: 'KYC Review', to: '/portal/admin/kyc', icon: Icons.kyc, primary: true },
  { label: 'All Stores', to: '/portal/admin/stores', icon: Icons.stores, primary: true },
  { label: 'Platform Admins', to: '/portal/admin/admins/new', icon: Icons.admins },
];

const SIDEBAR_COLLAPSED_KEY = 'geepay-portal-sidebar-collapsed';

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}

function SidebarProvider({ children }: { children: ReactNode }) {
  const { collapsed, toggle } = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

function useSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored !== null) return stored === 'true';
    } catch {
      /* ignore */
    }
    return typeof window !== 'undefined' && window.innerWidth < 1024;
  });

  const setCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setCollapsedState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggle = useCallback(() => setCollapsed((prev) => !prev), [setCollapsed]);

  return { collapsed, toggle, setCollapsed };
}

function SidebarNavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      aria-label={item.label}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-lg py-2.5 text-sm font-medium',
          'transition-all duration-200 ease-out motion-reduce:transition-none',
          collapsed ? 'justify-center px-2' : 'gap-3 px-3',
          isActive
            ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'text-white/70 hover:bg-white/10 hover:text-white',
          !collapsed && !isActive && 'hover:translate-x-0.5',
        )
      }
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-r-full bg-sky',
          'opacity-0 transition-all duration-200 ease-out motion-reduce:transition-none',
          'group-aria-[current=page]:h-6 group-aria-[current=page]:opacity-100',
        )}
      />
      <span
        className={cn(
          'flex shrink-0 items-center justify-center transition-transform duration-200 ease-out motion-reduce:transition-none',
          'group-hover:scale-110 group-aria-[current=page]:text-sky',
        )}
      >
        {item.icon}
      </span>
      <span
        className={cn(
          'overflow-hidden whitespace-nowrap transition-all duration-300 ease-out motion-reduce:transition-none',
          collapsed ? 'max-w-0 opacity-0' : 'max-w-[10rem] opacity-100 delay-75',
        )}
      >
        {item.label}
      </span>
      {collapsed && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg',
            'border border-white/10 bg-navy-dark px-2.5 py-1.5 text-xs font-medium text-white shadow-lg',
            'opacity-0 translate-x-1 transition-all duration-150 ease-out motion-reduce:transition-none',
            'group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0',
          )}
        >
          {item.label}
        </span>
      )}
    </NavLink>
  );
}

function SidebarToggleButton({ className }: { className?: string }) {
  const { collapsed, toggle, setMobileOpen } = useSidebar();

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        className={cn(
          'hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cream-dark bg-cream/50',
          'text-forest-muted transition-all duration-200 ease-out',
          'hover:border-forest/30 hover:bg-cream hover:text-forest motion-reduce:transition-none',
          'md:inline-flex',
          className,
        )}
      >
        <svg
          className={cn(
            'h-4 w-4 transition-transform duration-300 ease-out motion-reduce:transition-none',
            collapsed && 'rotate-180',
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className={cn(
          'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          'text-white/80 transition-colors duration-200 hover:bg-white/10 hover:text-white md:hidden',
          className,
        )}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </>
  );
}

function SidebarBrand({ brandSubtitle, collapsed }: { brandSubtitle: string; collapsed: boolean }) {
  return (
    <div
      className={cn(
        'flex border-b border-white/10 p-4 transition-all duration-300 ease-out motion-reduce:transition-none',
        collapsed ? 'flex-col items-center gap-2' : 'flex-col items-start gap-1.5',
      )}
    >
      <GeepayLogo className={cn('transition-transform duration-300 ease-out motion-reduce:transition-none', collapsed && 'scale-95')} />
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none',
          collapsed ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100 delay-75',
        )}
      >
        <p className="text-sm font-bold text-white">Geepay</p>
        <p className="text-[10px] text-white/70">{brandSubtitle}</p>
      </div>
    </div>
  );
}

function SidebarNavLinks({ items, collapsed }: { items: NavItem[]; collapsed: boolean }) {
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-3 scrollbar-hide" aria-label="Primary">
      {items.map((item, index) => (
        <div key={item.to} className="sidebar-nav-item" style={{ animationDelay: `${index * 35}ms` }}>
          <SidebarNavLink item={item} collapsed={collapsed} />
        </div>
      ))}
    </nav>
  );
}

function SidebarCollapseFooter() {
  const { collapsed, toggle } = useSidebar();

  return (
    <div className="border-t border-white/10 p-3">
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        className={cn(
          'group flex w-full items-center rounded-lg py-2 text-white/60',
          'transition-all duration-200 ease-out hover:bg-white/10 hover:text-white motion-reduce:transition-none',
          collapsed ? 'justify-center px-2' : 'gap-3 px-3',
        )}
      >
        <svg
          className={cn(
            'h-4 w-4 shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none',
            collapsed ? 'rotate-180' : 'group-hover:-translate-x-0.5',
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap text-xs font-medium transition-all duration-300 ease-out motion-reduce:transition-none',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-[8rem] opacity-100 delay-75',
          )}
        >
          Collapse
        </span>
      </button>
    </div>
  );
}

function MobileSidebarDrawer({ items, brandSubtitle }: { items: NavItem[]; brandSubtitle: string }) {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, setMobileOpen]);

  if (!mobileOpen) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <button
        type="button"
        className="sidebar-backdrop absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]"
        aria-label="Close navigation menu"
        onClick={() => setMobileOpen(false)}
      />
      <aside className="sidebar-drawer absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-white/10 bg-navy shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 p-4">
          <div>
            <GeepayLogo />
            <p className="mt-2 text-sm font-bold text-white">Geepay</p>
            <p className="text-[10px] text-white/70">{brandSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarNavLinks items={items} collapsed={false} />
      </aside>
    </div>
  );
}

function GeepayLogo({ className = 'h-9 w-9' }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-navy-dark ring-1 ring-white/10 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-5 w-5" fill="none">
        <circle cx="20" cy="20" r="14" stroke="#D1D2EF" strokeWidth="2" />
        <path d="M20 8a12 12 0 0 1 0 24" fill="#00afeb" stroke="#D1D2EF" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="4" fill="#ECECF8" />
      </svg>
    </div>
  );
}

function AccountMenu({
  user,
  onLogout,
  extraLinks = [],
}: {
  user: { full_name?: string; email?: string } | null;
  onLogout: () => void;
  extraLinks?: Array<{ label: string; to: string }>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const initials = (user?.full_name ?? user?.email ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-cream-dark bg-cream/50 px-2 py-1.5 transition hover:border-forest/30"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-xs font-semibold text-white">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-xs font-semibold text-charcoal">{user?.full_name ?? 'User'}</p>
          <p className="text-[10px] text-forest-muted">{user?.email}</p>
        </div>
        <svg className="hidden h-3.5 w-3.5 text-forest-muted sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-cream-dark bg-white py-1 shadow-lg"
        >
          {extraLinks.map((link) => (
            <button
              key={link.to}
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-cream/60"
              onClick={() => {
                setOpen(false);
                navigate(link.to);
              }}
            >
              {link.label}
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-cream/60"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function PortalTopBar({
  user,
  onLogout,
  showBranch = false,
  showSidebarToggle = false,
  extraLinks = [],
}: {
  user: { full_name?: string; email?: string } | null;
  onLogout: () => void;
  showBranch?: boolean;
  showSidebarToggle?: boolean;
  extraLinks?: Array<{ label: string; to: string }>;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-cream-dark bg-white/90 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showSidebarToggle && <SidebarToggleButton />}
          {showBranch && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden text-[11px] font-medium uppercase tracking-wide text-forest-muted sm:inline">
                Branch
              </span>
              <BranchSelector className="min-w-[10rem] max-w-[16rem]" />
            </div>
          )}
        </div>
        <AccountMenu user={user} onLogout={onLogout} extraLinks={extraLinks} />
      </div>
    </header>
  );
}

function SidebarNav({ items, brandSubtitle }: { items: NavItem[]; brandSubtitle: string }) {
  const { collapsed } = useSidebar();

  return (
    <aside
      className={cn(
        'sidebar-shell hidden shrink-0 flex-col border-r border-white/10 bg-navy md:flex',
        'transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none',
        collapsed ? 'w-[4.25rem]' : 'w-56',
      )}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <SidebarBrand brandSubtitle={brandSubtitle} collapsed={collapsed} />
      <SidebarNavLinks items={items} collapsed={collapsed} />
      <SidebarCollapseFooter />
    </aside>
  );
}

function MobileBottomNav({
  primary,
  overflow,
}: {
  primary: NavItem[];
  overflow: NavItem[];
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const overflowActive = overflow.some((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  );

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-cream-dark bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5 gap-0">
          {primary.slice(0, 4).map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium ${
                    isActive ? 'text-forest' : 'text-forest-muted'
                  }`
                }
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`flex w-full flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium ${
                overflowActive || moreOpen ? 'text-forest' : 'text-forest-muted'
              }`}
            >
              {Icons.more}
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/40"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-cream-dark bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-forest-muted">More</p>
            <ul className="space-y-1">
              {[...primary.slice(4), ...overflow].map((item) => (
                <li key={item.to}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-charcoal hover:bg-cream/60"
                    onClick={() => {
                      setMoreOpen(false);
                      navigate(item.to);
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function buildMerchantNav(isFood: boolean, permissions: Set<string>): { all: NavItem[]; primary: NavItem[]; overflow: NavItem[] } {
  const core: NavItem[] = [
    { label: 'Overview', to: '/portal/owner', end: true, icon: Icons.overview, primary: true },
    { label: 'Stores', to: '/portal/owner/stores', icon: Icons.stores, primary: true },
    { label: 'Branding', to: '/portal/owner/store-settings', icon: Icons.branding },
    { label: isFood ? 'Items' : 'Catalog', to: '/portal/owner/products', icon: Icons.catalog, primary: true },
    { label: 'Counter', to: '/portal/owner/counter', icon: Icons.counter, primary: true },
    { label: 'Orders', to: '/portal/owner/orders', icon: Icons.orders, primary: true },
    { label: 'Transactions', to: '/portal/owner/transactions', icon: Icons.transactions, primary: true },
    { label: 'Team', to: '/portal/owner/team', icon: Icons.team },
    { label: 'Roles', to: '/portal/owner/roles', icon: Icons.roles },
  ];

  const food: NavItem[] = isFood
    ? [
        { label: 'Menu', to: '/portal/owner/menu', icon: Icons.menu, primary: true },
        { label: 'Tables', to: '/portal/owner/tables', icon: Icons.tables },
        { label: 'Kitchen', to: '/portal/owner/kitchen', icon: Icons.kitchen, primary: true },
      ]
    : [];

  const all = [...core, ...food].filter((item) => canAccessNav(permissions, item.to));
  const primaryKeys = isFood
    ? ['/portal/owner', '/portal/owner/products', '/portal/owner/counter', '/portal/owner/orders', '/portal/owner/transactions']
    : ['/portal/owner', '/portal/owner/counter', '/portal/owner/products', '/portal/owner/orders', '/portal/owner/transactions'];
  const primary = primaryKeys
    .map((to) => all.find((i) => i.to === to))
    .filter(Boolean) as NavItem[];
  const overflow = all.filter((i) => !primaryKeys.includes(i.to));
  return { all, primary, overflow };
}

export function PortalLayout() {
  const { user, logout, isAdmin, isStoreOwner } = useAuth();
  const navigate = useNavigate();
  const { selectedStore } = useMarketplace();
  const { permissions } = usePermissions();
  const capabilities = useMarketplaceCapabilities(selectedStore);

  const merchantNav = buildMerchantNav(capabilities.isFood, permissions);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isAdmin) {
    const primary = adminNav.filter((i) => i.primary);
    const overflow = adminNav.filter((i) => !i.primary);
    return (
      <SidebarProvider>
        <div className="flex min-h-screen bg-cream">
          <a
            href="#portal-main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-forest focus:shadow"
          >
            Skip to content
          </a>
          <SidebarNav items={adminNav} brandSubtitle="Admin Portal" />
          <MobileSidebarDrawer items={adminNav} brandSubtitle="Admin Portal" />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-navy px-4 py-3 md:hidden">
              <div className="flex items-center gap-2">
                <SidebarToggleButton />
                <GeepayLogo className="h-8 w-8" />
                <p className="text-sm font-bold text-white">Geepay Admin</p>
              </div>
            </div>
            <PortalTopBar user={user} onLogout={handleLogout} showSidebarToggle />
            <main id="portal-main" className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
              <Outlet />
            </main>
            <MobileBottomNav primary={primary} overflow={overflow} />
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-cream">
        <a
          href="#portal-main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-forest focus:shadow"
        >
          Skip to content
        </a>

        {isStoreOwner && <SidebarNav items={merchantNav.all} brandSubtitle="Merchant Portal" />}
        {isStoreOwner && (
          <MobileSidebarDrawer items={merchantNav.all} brandSubtitle="Merchant Portal" />
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 bg-navy px-4 py-3 md:hidden">
            <div className="flex items-center gap-2">
              {isStoreOwner && <SidebarToggleButton />}
              <GeepayLogo className="h-8 w-8" />
              <p className="text-sm font-bold text-white">Geepay Merchant</p>
            </div>
          </div>

          {isStoreOwner && (
            <PortalTopBar
              user={user}
              onLogout={handleLogout}
              showBranch
              showSidebarToggle
              extraLinks={
                hasPermission(permissions, PERM.storesManage)
                  ? [{ label: 'Add business', to: '/portal/owner/businesses/new' }]
                  : []
              }
            />
          )}

          <main id="portal-main" className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
            <Outlet />
          </main>

          {isStoreOwner && (
            <MobileBottomNav primary={merchantNav.primary} overflow={merchantNav.overflow} />
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
