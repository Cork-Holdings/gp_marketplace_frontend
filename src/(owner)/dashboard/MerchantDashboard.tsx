import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useAsync } from '@/hooks/useAsync';
import { ownerApi } from '@/lib/api/services';
import { formatCurrency } from '@/lib/utils';
import { normalizeOrderList, getStoreImageUrl } from '@/lib/normalizeApi';
import { TableSkeleton } from '@/components/common/Skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';

type PeriodKey = 'today' | '7d' | '30d' | 'all';

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function periodBounds(period: PeriodKey): { start: Date | null; prevStart: Date | null; prevEnd: Date | null } {
  const now = new Date();
  if (period === 'all') return { start: null, prevStart: null, prevEnd: null };
  if (period === 'today') {
    const start = startOfDay(now);
    const prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 1);
    return { start, prevStart, prevEnd: start };
  }
  const days = period === '7d' ? 7 : 30;
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  const prevEnd = start;
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  return { start, prevStart, prevEnd };
}

function orderDate(order: { created_at?: string; updated_at?: string }) {
  const raw = order.created_at ?? order.updated_at;
  return raw ? new Date(raw) : null;
}

function inRange(order: { created_at?: string }, start: Date | null, end: Date | null) {
  if (!start) return true;
  const d = orderDate(order);
  if (!d || Number.isNaN(d.getTime())) return false;
  if (d < start) return false;
  if (end && d >= end) return false;
  return true;
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
}) {
  return (
    <div className="dashboard-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm text-forest-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-charcoal tabular-nums">{value}</p>
          {sub && <p className="mt-1 text-xs text-forest-muted">{sub}</p>}
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-forest-muted">
          {icon}
        </span>
      </div>
    </div>
  );
}

function StorePlaceholderIcon() {
  return (
    <svg className="h-8 w-8 text-cream/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    </svg>
  );
}

function MerchantStoreCard({ store }) {
  const imageUrl = getStoreImageUrl(store);
  const isActive = store.is_active !== false;

  return (
    <div className="group overflow-hidden rounded-2xl border border-cream-dark bg-white shadow-sm transition hover:shadow-md">
      <div
        className={`relative h-28 ${
          imageUrl ? 'bg-cover bg-center' : 'bg-gradient-to-br from-forest to-forest-muted'
        }`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      >
        {!imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <StorePlaceholderIcon />
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            isActive ? 'bg-sage text-forest' : 'bg-cream-dark text-forest-muted'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="p-4">
        <p className="font-semibold text-charcoal">{store.name}</p>
        <p className="mt-0.5 text-xs text-forest-muted">
          {store.branch_name ? `${store.branch_name} · ` : ''}
          {store.store_type ?? store.store_category ?? 'Store'}
        </p>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="font-mono text-forest-muted">*{store.ussd_code}#</span>
          <a
            href={`/store/${store.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-forest hover:underline"
          >
            View storefront →
          </a>
        </div>
      </div>
    </div>
  );
}

export function MerchantDashboardHeader({ userName }) {
  const firstName = userName?.split(' ')?.[0] ?? 'there';
  return (
    <header>
      <h1 className="text-2xl font-bold tracking-tight text-charcoal md:text-[1.75rem]">
        {getGreeting()}, {firstName}
      </h1>
      <p className="mt-1 text-sm text-forest-muted">
        Manage your branches, catalog, and live order operations from one place.
      </p>
    </header>
  );
}

function formatDelta(current: number, previous: number) {
  if (previous === 0 && current === 0) return 'No change vs prior period';
  if (previous === 0) return 'New vs prior period';
  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}% vs prior period`;
}

export function MerchantDashboardOverview() {
  const { stores, selectedStore, selectedStoreId, loading: storesLoading } = useMarketplace();
  const [period, setPeriod] = useState<PeriodKey>('7d');
  const { data: ordersData, loading: ordersLoading } = useAsync(
    () => (selectedStoreId ? ownerApi.listOrders(selectedStoreId) : Promise.resolve([])),
    [selectedStoreId],
  );

  const orders = normalizeOrderList(ordersData);
  const bounds = periodBounds(period);

  const { periodOrders, prevOrders } = useMemo(() => {
    const periodOrders = orders.filter((o) => inRange(o, bounds.start, null));
    const prevOrders =
      bounds.prevStart && bounds.prevEnd
        ? orders.filter((o) => inRange(o, bounds.prevStart, bounds.prevEnd))
        : [];
    return { periodOrders, prevOrders };
  }, [orders, bounds.start, bounds.prevStart, bounds.prevEnd]);

  const paidStatuses = ['paid', 'fulfilled', 'completed', 'served'];
  const paidOrders = periodOrders.filter((o) => paidStatuses.includes(o.status ?? ''));
  const prevPaid = prevOrders.filter((o) => paidStatuses.includes(o.status ?? ''));
  const revenue = paidOrders.reduce((sum, o) => sum + (parseFloat(String(o.total ?? o.total_amount)) || 0), 0);
  const prevRevenue = prevPaid.reduce((sum, o) => sum + (parseFloat(String(o.total ?? o.total_amount)) || 0), 0);
  const pending = periodOrders.filter((o) => o.status === 'pending_payment').length;
  const openOps = orders.filter((o) =>
    ['paid', 'preparing', 'ready', 'ready_for_dispatch', 'ready_for_pickup', 'dispatched'].includes(o.status ?? ''),
  ).length;
  const recentOrders = orders.slice(0, 5);
  const branchLabel = selectedStore?.branch_name || selectedStore?.name || 'selected branch';

  const nextSteps = [
    stores.length === 0 && {
      to: '/portal/owner/stores/new',
      label: 'Create your first store',
      desc: 'Launch a customer-facing storefront',
      urgent: true,
    },
    pending > 0 && {
      to: '/portal/owner/orders',
      label: `${pending} awaiting payment`,
      desc: 'Follow up or advance on the order board',
      urgent: true,
    },
    openOps > 0 && {
      to: '/portal/owner/orders',
      label: `${openOps} open order${openOps === 1 ? '' : 's'}`,
      desc: 'Fulfill live tickets on the order board',
      urgent: true,
    },
    {
      to: '/portal/owner/products',
      label: 'Manage catalog',
      desc: 'Add or update products and services',
      urgent: false,
    },
    {
      to: '/portal/owner/stores/new',
      label: 'Add another branch',
      desc: 'Open another location under this business',
      urgent: false,
    },
  ].filter(Boolean) as Array<{ to: string; label: string; desc: string; urgent: boolean }>;

  // Prefer urgent first, cap at 4
  const actions = [...nextSteps.filter((a) => a.urgent), ...nextSteps.filter((a) => !a.urgent)].slice(0, 4);

  if (storesLoading) return <TableSkeleton rows={3} cols={3} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-forest-muted">
          Metrics for <span className="font-medium text-charcoal">{branchLabel}</span>
        </p>
        <div className="flex rounded-full bg-cream p-1" role="group" aria-label="Revenue period">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                period === p.key ? 'bg-forest text-cream shadow-sm' : 'text-forest-muted hover:text-charcoal'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Branches"
          value={stores.length}
          sub={stores.length === 1 ? '1 location' : `${stores.length} locations`}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          }
        />
        <StatCard
          label="Revenue"
          value={ordersLoading ? '…' : formatCurrency(revenue)}
          sub={
            ordersLoading
              ? 'Loading…'
              : period === 'all'
                ? 'Paid & fulfilled · all time'
                : formatDelta(revenue, prevRevenue)
          }
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          label="Paid orders"
          value={ordersLoading ? '…' : paidOrders.length}
          sub={PERIODS.find((p) => p.key === period)?.label}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Awaiting payment"
          value={ordersLoading ? '…' : pending}
          sub={pending > 0 ? 'Needs attention' : 'All clear'}
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="dashboard-card lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-charcoal">Your stores</p>
            <Button asChild size="sm">
              <Link to="/portal/owner/stores/new">+ Add branch</Link>
            </Button>
          </div>
          {stores.length === 0 ? (
            <EmptyState
              title="No stores yet"
              description="Create your first branch to start selling on Geepay."
              actionLabel="Create first store"
              actionTo="/portal/owner/stores/new"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {stores.slice(0, 4).map((store) => (
                <MerchantStoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
          {stores.length > 4 && (
            <Link
              to="/portal/owner/stores"
              className="mt-4 block text-center text-xs font-semibold text-forest hover:underline"
            >
              View all {stores.length} stores
            </Link>
          )}
        </div>

        <div className="dashboard-card lg:col-span-2">
          <p className="mb-4 text-sm font-semibold text-charcoal">Next steps</p>
          <div className="space-y-2">
            {actions.map((action) => (
              <Link
                key={`${action.to}-${action.label}`}
                to={action.to}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition hover:border-forest/30 hover:bg-cream/50 ${
                  action.urgent ? 'border-amber-200 bg-amber-50/50' : 'border-cream-dark'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-charcoal">{action.label}</p>
                  <p className="text-xs text-forest-muted">{action.desc}</p>
                </div>
                <span className="text-forest-muted" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-card">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-charcoal">Recent orders</p>
          <Link to="/portal/owner/orders" className="text-xs font-semibold text-forest hover:underline">
            View all
          </Link>
        </div>
        {ordersLoading ? (
          <TableSkeleton rows={3} cols={4} />
        ) : recentOrders.length === 0 ? (
          <EmptyState
            title="No orders for this branch yet"
            description="Orders will appear here once customers start checking out."
            actionLabel="Open order board"
            actionTo="/portal/owner/orders"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-cream-dark text-[11px] font-medium uppercase tracking-wide text-forest-muted">
                  <th className="pb-3 pr-4">Order</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-dark">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/40">
                    <td className="py-3 pr-4 font-medium text-charcoal">
                      #{order.order_number ?? order.id?.slice(0, 8)}
                    </td>
                    <td className="py-3 pr-4 text-forest-muted">{order.customer_phone ?? '—'}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatCurrency(order.total ?? order.total_amount)}</td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MerchantDashboardOverview;
