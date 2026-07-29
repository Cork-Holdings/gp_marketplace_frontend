import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/lib/api/services';
import { useAsync } from '@/hooks/useAsync';
import { ErrorState } from '@/components/common/ErrorState';
import { TableSkeleton } from '@/components/common/Skeleton';
import { formatGmv, mapOrderActivity, mapStoreCard } from './adminDashboardData';
import { DEFAULT_CURRENCY } from '@/lib/locale';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const STATUS_STYLES = {
  completed: 'bg-sage text-forest',
  active: 'bg-sage text-forest',
  pending: 'bg-red-50 text-red-600',
  'in progress': 'bg-amber-50 text-amber-700',
  inactive: 'bg-cream-dark text-forest-muted',
  paid: 'bg-sage text-forest',
  confirmed: 'bg-sage text-forest',
  cancelled: 'bg-red-50 text-red-600',
};

function StatusBadge({ status }) {
  const key = status?.toLowerCase() ?? 'pending';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[key] ?? STATUS_STYLES.pending}`}>
      {status}
    </span>
  );
}

function StatIcon({ type }) {
  const icons = {
    orders: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    vendors: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    tickets: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    stores: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  };
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream text-forest-muted">
      {icons[type]}
    </span>
  );
}

function ActivityIcon({ type }) {
  const base = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs';
  const styles = {
    package: `${base} bg-sage text-forest`,
    payment: `${base} bg-forest/10 text-forest`,
    vendor: `${base} bg-cream-dark text-forest-muted`,
    store: `${base} bg-forest text-cream`,
    payout: `${base} bg-forest-muted/20 text-forest-muted`,
  };
  const labels = { package: '📦', payment: '💳', vendor: '👤', store: '🏪', payout: '💰' };
  return <span className={styles[type] ?? styles.package} aria-hidden="true">{labels[type] ?? '•'}</span>;
}

export function AdminDashboardHeader({ userName }) {
  const firstName = userName?.split(' ')?.[0] ?? 'Admin';
  return (
    <header>
      <h1 className="text-2xl font-bold tracking-tight text-charcoal md:text-[1.75rem]">
        {getGreeting()}, {firstName}
      </h1>
      <p className="mt-1 text-sm text-forest-muted">
        Stay on top of marketplace health, monitor vendors, and track platform activity.
      </p>
    </header>
  );
}

function PlatformSummaryCard({ overview }) {
  return (
    <div className="dashboard-card lg:col-span-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-forest-muted">Platform snapshot</p>
          <p className="mt-1 text-[1.65rem] font-bold leading-tight text-charcoal md:text-3xl">
            {overview.orderTotalLabel}
          </p>
          <p className="mt-1 text-xs text-forest-muted">
            Sum of the latest {overview.recentOrderCount} orders (analytics API not yet available)
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          to="/portal/admin/merchants/new"
          className="flex-1 rounded-xl bg-forest py-2.5 text-center text-sm font-semibold text-cream shadow-sm transition hover:bg-forest-dark"
        >
          Onboard Merchant
        </Link>
        <Link
          to="/portal/admin/stores"
          className="flex-1 rounded-xl border border-cream-dark bg-white py-2.5 text-center text-sm font-semibold text-charcoal transition hover:bg-cream"
        >
          Manage Stores
        </Link>
      </div>

      <div className="mt-6 grid gap-2.5 border-t border-cream-dark pt-5 sm:grid-cols-3">
        <div className="rounded-xl border border-cream-dark bg-cream/60 px-3 py-3">
          <p className="text-xs font-medium text-forest-muted">Merchants</p>
          <p className="mt-1.5 text-base font-bold text-charcoal">{overview.merchantTotal}</p>
          <p className="mt-0.5 text-[10px] text-forest-muted">{overview.verifiedMerchants} verified</p>
        </div>
        <div className="rounded-xl border border-cream-dark bg-cream/60 px-3 py-3">
          <p className="text-xs font-medium text-forest-muted">Stores</p>
          <p className="mt-1.5 text-base font-bold text-charcoal">{overview.storeTotal}</p>
          <p className="mt-0.5 text-[10px] text-forest-muted">{overview.activeStores} active</p>
        </div>
        <div className="rounded-xl border border-cream-dark bg-cream/60 px-3 py-3">
          <p className="text-xs font-medium text-forest-muted">Pending KYC</p>
          <p className="mt-1.5 text-base font-bold text-charcoal">{overview.pendingKyc}</p>
          <Link to="/portal/admin/kyc" className="mt-0.5 text-[10px] font-medium text-forest hover:underline">
            Review queue
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryStatCards({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:col-span-7">
      {stats.map((card) => (
        <div
          key={card.label}
          className={`dashboard-card relative flex flex-col justify-between p-4 ${
            card.highlight ? 'bg-forest text-cream shadow-md' : 'bg-white'
          }`}
        >
          {!card.highlight && card.icon && (
            <div className="absolute right-3 top-3">
              <StatIcon type={card.icon} />
            </div>
          )}
          <p className={`text-xs font-medium ${card.highlight ? 'text-cream/75' : 'text-forest-muted'}`}>
            {card.label}
          </p>
          <p className={`mt-3 text-xl font-bold leading-none md:text-2xl ${card.highlight ? 'text-cream' : 'text-charcoal'}`}>
            {card.value}
          </p>
          {card.hint && (
            <p className={`mt-2 text-xs ${card.highlight ? 'text-cream/70' : 'text-forest-muted'}`}>
              {card.hint}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function StoreCardVisual({ store }) {
  const isDark = store.variant === 'dark';

  return (
    <div
      className={`store-card-visual relative overflow-hidden rounded-2xl p-4 ${
        isDark ? 'bg-forest text-cream' : 'bg-forest-muted text-cream'
      }`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between">
        <div className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-200/80 to-amber-400/60" />
        <StatusBadge status={store.status} />
      </div>

      <p className="relative mt-6 font-mono text-sm tracking-[0.2em] opacity-90">
        •••• •••• •••• {store.slug.slice(-4).toUpperCase()}
      </p>
      <div className="relative mt-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider opacity-60">Store</p>
          <p className="text-sm font-semibold">{store.name}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider opacity-60">USSD</p>
          <p className="font-mono text-xs">{store.ussd}</p>
        </div>
      </div>
    </div>
  );
}

function FeaturedStoresSection({ stores }) {
  return (
    <div className="dashboard-card">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-charcoal">Active Stores</p>
        <Link to="/portal/admin/stores" className="text-xs font-semibold text-forest hover:underline">
          View all
        </Link>
      </div>
      {stores.length === 0 ? (
        <p className="py-6 text-center text-sm text-forest-muted">No stores yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {stores.map((store) => (
            <StoreCardVisual key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecentActivitiesTable({ activities }) {
  const [search, setSearch] = useState('');

  const filtered = activities.filter(
    (a) =>
      !search ||
      a.detail.toLowerCase().includes(search.toLowerCase()) ||
      a.activity.toLowerCase().includes(search.toLowerCase()) ||
      a.orderId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="dashboard-card lg:col-span-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-charcoal">Recent Orders</p>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-forest-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
          <input
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-cream-dark bg-cream py-1.5 pl-8 pr-3 text-xs focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-left text-sm">
          <thead>
            <tr className="border-b border-cream-dark text-[11px] font-medium uppercase tracking-wide text-forest-muted">
              <th className="pb-3 pr-3">Order ID</th>
              <th className="pb-3 pr-3">Activity</th>
              <th className="pb-3 pr-3">Price</th>
              <th className="pb-3 pr-3">Status</th>
              <th className="pb-3 pr-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-dark/80">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-forest-muted">
                  No orders yet.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="group hover:bg-cream/40">
                  <td className="py-3 pr-3 font-mono text-xs text-forest-muted">{row.orderId}</td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <ActivityIcon type={row.icon} />
                      <div>
                        <p className="font-medium text-charcoal">{row.activity}</p>
                        <p className="text-xs text-forest-muted">{row.detail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 font-medium text-charcoal">{row.price}</td>
                  <td className="py-3 pr-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-3 pr-3 text-xs text-forest-muted whitespace-nowrap">{row.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildOverview({ merchantsRes, storesRes, ordersRes, kycRes }) {
  const merchants = merchantsRes?.merchants ?? [];
  const stores = storesRes?.stores ?? storesRes?.items ?? [];
  const orders = ordersRes?.orders ?? [];
  const merchantTotal = merchantsRes?.total ?? merchants.length;
  const storeTotal = storesRes?.total ?? stores.length;
  const orderTotal = ordersRes?.total ?? orders.length;
  const pendingKyc = kycRes?.total ?? (kycRes?.verifications ?? []).length;
  const verifiedMerchants = merchants.filter((m) => m.is_verified).length;
  const activeStores = stores.filter((s) => s.is_active !== false).length;

  const currency = orders[0]?.currency || DEFAULT_CURRENCY;
  const recentSum = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  return {
    merchantTotal,
    verifiedMerchants,
    storeTotal,
    activeStores,
    orderTotal,
    pendingKyc,
    recentOrderCount: orders.length,
    orderTotalLabel: formatGmv(recentSum, currency),
    stats: [
      {
        label: 'Total Orders',
        value: String(orderTotal),
        hint: 'Across all merchants',
        highlight: true,
      },
      {
        label: 'Merchants',
        value: String(merchantTotal),
        hint: `${verifiedMerchants} verified`,
        icon: 'vendors',
      },
      {
        label: 'Stores',
        value: String(storeTotal),
        hint: `${activeStores} active`,
        icon: 'stores',
      },
      {
        label: 'Pending KYC',
        value: String(pendingKyc),
        hint: pendingKyc ? 'Needs review' : 'Queue clear',
        icon: 'tickets',
      },
    ],
    featuredStores: stores.slice(0, 4).map(mapStoreCard),
    activities: orders.slice(0, 10).map(mapOrderActivity),
  };
}

export function AdminDashboardOverview() {
  const { data, loading, error, retry } = useAsync(async () => {
    const [merchantsRes, storesRes, ordersRes, kycRes] = await Promise.all([
      adminApi.listMerchants(),
      adminApi.listStores(),
      adminApi.listOrders({ limit: '20' }),
      adminApi.listKyc({ status: 'pending', limit: '1' }),
    ]);
    return buildOverview({ merchantsRes, storesRes, ordersRes, kycRes });
  }, []);

  if (loading) return <TableSkeleton rows={6} cols={4} />;
  if (error) return <ErrorState error={error} onRetry={retry} title="Could not load dashboard" />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-12">
        <PlatformSummaryCard overview={data} />
        <SummaryStatCards stats={data.stats} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <FeaturedStoresSection stores={data.featuredStores} />
        </div>
        <RecentActivitiesTable activities={data.activities} />
      </div>
    </div>
  );
}
