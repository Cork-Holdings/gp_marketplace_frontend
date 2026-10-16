import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useOwnerDashboard } from '@/hooks/useOwnerDashboard';
import { usePermissions } from '@/lib/context/permissions';
import { PERM } from '@/lib/permissions';
import { formatCurrency } from '@/lib/utils';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { CollectionTrend } from '@/components/portal/CollectionTrend';
import type { DashboardMoney, DashboardPeriod, DashboardTask, OwnerDashboard } from '@/types/ownerDashboard';

const PERIODS: { key: DashboardPeriod; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' }, { key: 'all', label: 'All time' },
];
const WORK = {
  order: { label: 'Checkout order', route: '/portal/owner/orders', icon: 'package' },
  reservation: { label: 'Booking', route: '/portal/owner/bookings', icon: 'calendar' },
  quote: { label: 'Estimate', route: '/portal/owner/quotes', icon: 'document' },
  custom_order: { label: 'Custom / bulk request', route: '/portal/owner/custom-orders', icon: 'package' },
  job: { label: 'Service visit', route: '/portal/owner/jobs', icon: 'briefcase' },
} as const;
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cream-dark px-3 py-2 text-sm font-semibold text-cobalt transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none';

function timeLabel(raw: string, includeDate = false) {
  return new Intl.DateTimeFormat('en-ZM', {
    timeZone: 'Africa/Lusaka', ...(includeDate ? { day: 'numeric', month: 'short' } : {}),
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(raw));
}

export function MerchantDashboardHeader({ userName }: { userName?: string }) {
  const hour = Number(new Intl.DateTimeFormat('en', { timeZone: 'Africa/Lusaka', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return <header>
    <h1 className="text-2xl font-bold tracking-tight text-charcoal md:text-[1.75rem]">{greeting}, {userName?.split(' ')[0] || 'there'}</h1>
    <p className="mt-1 max-w-prose text-sm text-forest-muted">Your money and the work that needs your attention.</p>
  </header>;
}

function DashboardSkeleton() {
  return <div role="status" aria-label="Loading business summary" className="space-y-6">
    <div aria-hidden="true" className="grid gap-5 rounded-2xl border border-cream-dark p-6 sm:grid-cols-3">
      {[0, 1, 2].map(item => <div key={item} className="space-y-3"><div className="h-4 w-28 rounded bg-cream-dark motion-safe:animate-pulse" /><div className="h-8 w-36 max-w-full rounded bg-cream-dark motion-safe:animate-pulse" /><div className="h-3 w-32 rounded bg-cream-dark" /></div>)}
    </div>
    <div aria-hidden="true" className="space-y-5 rounded-2xl border border-cream-dark p-6">{[0, 1, 2].map(item => <div key={item} className="h-14 rounded bg-cream-dark/50 motion-safe:animate-pulse" />)}</div>
    <span className="sr-only">Loading payments and urgent work.</span>
  </div>;
}

function MoneyOverview({ data, money }: { data: OwnerDashboard; money: DashboardMoney }) {
  const outstandingDescription = money.awaiting_count ? `${money.awaiting_count} agreement${money.awaiting_count === 1 ? '' : 's'} with a balance` : 'No outstanding agreed payments';
  return <>
    <dl className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <div className="min-w-0"><dt className="flex items-center gap-2 text-sm text-forest-muted"><WorkflowIcon name="creditCard" />Net confirmed collections</dt><dd className="mt-2 break-words text-3xl font-semibold tracking-tight text-charcoal tabular-nums" data-testid="dashboard-collected">{formatCurrency(money.collected, money.currency)}</dd><dd className="mt-2 text-xs leading-relaxed text-forest-muted">Real payments less refunds. Not a payout balance.</dd></div>
      <div className="min-w-0"><dt className="flex items-center gap-2 text-sm text-forest-muted"><WorkflowIcon name="clock" />Outstanding agreed value</dt><dd className="mt-2 break-words text-3xl font-semibold tracking-tight text-charcoal tabular-nums" data-testid="dashboard-outstanding">{formatCurrency(money.outstanding, money.currency)}</dd><dd className="mt-2 text-xs leading-relaxed text-forest-muted">{outstandingDescription}. Includes later balances.</dd></div>
      <div className="min-w-0"><dt className="flex items-center gap-2 text-sm text-forest-muted"><WorkflowIcon name="briefcase" />Needs your attention</dt><dd className="mt-2 text-3xl font-semibold tracking-tight text-charcoal tabular-nums">{data.work_visible ? data.owner_task_count : 'Restricted'}</dd><dd className="mt-2 text-xs leading-relaxed text-forest-muted">{data.work_visible ? `${data.customer_task_count} waiting on customers. Across all dates.` : 'Ask your owner for work access.'}</dd></div>
    </dl>
    {(data.simulated || Number(money.simulated_collected) > 0 || Number(money.simulated_refunded) > 0) && <div className="mt-5 flex flex-wrap items-start justify-between gap-3 rounded-lg bg-sky/10 px-4 py-3 text-sm" role="note">
      <div className="flex items-start gap-2"><WorkflowIcon name="creditCard" className="mt-0.5 shrink-0 text-cobalt" /><div><span className="font-semibold text-charcoal">Test collections: {formatCurrency(money.simulated_collected, money.currency)}</span><p className="mt-0.5 text-xs leading-relaxed text-forest-muted">Simulation only. No money collected or paid out.{data.simulated ? ' Outstanding value uses test payment results.' : ' Test payments do not reduce real outstanding value.'}</p></div></div>
      {Number(money.simulated_refunded) > 0 && <span className="text-xs text-forest-muted">Test refunds: {formatCurrency(money.simulated_refunded, money.currency)}</span>}
    </div>}
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-cream-dark pt-4 text-xs text-forest-muted">
      <span>Recorded refunds: <strong className="font-medium text-charcoal">{formatCurrency(money.refunded, money.currency)}</strong></span>
      <span>Collections in progress: <strong className="font-medium text-charcoal">{money.pending_count}</strong></span>
      <span>Outstanding value is current, not limited by the payment period.</span>
    </div>
    <CollectionTrend money={money} period={data.period} simulated={data.simulated} />
  </>;
}

function TaskRow({ task }: { task: DashboardTask }) {
  const work = WORK[task.kind];
  // Checkout's board has no URL detail selector; other work screens do.
  const to = task.kind === 'order' ? work.route : `${work.route}?detail=${encodeURIComponent(task.id)}`;
  return <li className="border-t border-cream-dark first:border-t-0">
    <Link to={to} className="group flex min-w-0 flex-wrap items-center gap-3 px-4 py-4 transition-colors hover:bg-cream/60 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-cobalt sm:flex-nowrap sm:px-6 motion-reduce:transition-none">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${task.priority === 0 ? 'bg-danger-light text-danger-fg' : task.priority === 1 ? 'bg-amber-50 text-amber-800' : 'bg-cobalt/10 text-cobalt'}`}><WorkflowIcon name={work.icon} size={18} /></span>
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold text-charcoal">{task.title}</p><p className={`mt-1 break-words text-xs ${task.priority === 0 ? 'text-danger-fg' : task.priority === 1 ? 'text-amber-800' : 'text-forest-muted'}`}>{task.reason}</p><p className="mt-1 text-xs text-forest-muted">{work.label}{task.due_at ? ` · ${timeLabel(task.due_at, true)}` : ''}</p></div>
      <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${task.audience === 'customer' ? 'bg-cream text-forest-muted' : 'bg-cobalt/10 text-cobalt'}`}>{task.audience === 'customer' ? 'Customer action' : 'Your action'}</span>
      <span className="ml-12 inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-cobalt sm:ml-0">{task.action}<WorkflowIcon name="arrowRight" size={14} /></span>
    </Link>
  </li>;
}

function SelectedBranchDashboard({ storeId }: { storeId: string }) {
  const { selectedStore } = useMarketplace();
  const { hasPermission } = usePermissions();
  const [period, setPeriod] = useState<DashboardPeriod>('7d');
  const [offset, setOffset] = useState(0);
  const [currency, setCurrency] = useState('');
  const { data, loading, error, refresh } = useOwnerDashboard(storeId, period, offset);
  const money = data?.money.find(item => item.currency === currency) ?? data?.money[0];
  const branchLabel = selectedStore?.branch_name || selectedStore?.name || 'this branch';
  return <div className="space-y-6" data-testid="owner-business-dashboard">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm font-semibold text-charcoal">{selectedStore?.name}</p><p className="mt-0.5 text-xs text-forest-muted">{branchLabel} · payment period</p></div>
      <div className="flex max-w-full flex-wrap items-center gap-2">
        <div role="group" aria-label="Payment period" className="flex flex-wrap gap-1 rounded-lg bg-cream p-1">{PERIODS.map(item => <button type="button" key={item.key} aria-pressed={period === item.key} onClick={() => { setPeriod(item.key); setOffset(0); }} className={`min-h-10 rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt motion-reduce:transition-none ${period === item.key ? 'bg-cobalt text-white' : 'text-forest-muted hover:text-charcoal'}`}>{item.label}</button>)}</div>
        <button type="button" disabled={loading} onClick={refresh} className={buttonClass}><WorkflowIcon name="clock" />{loading ? 'Refreshing…' : 'Refresh'}</button>
      </div>
    </div>
    {error ? <ErrorState error={error} onRetry={refresh} title="Could not load your business summary" /> : loading || !data ? <DashboardSkeleton /> : <>
      <section aria-labelledby="dashboard-money-title" className="rounded-2xl border border-cream-dark bg-white p-5 shadow-sm md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 id="dashboard-money-title" className="text-base font-semibold text-charcoal">Money overview</h2>{data.money.length > 1 && <label className="flex items-center gap-2 text-xs text-forest-muted">Currency<select aria-label="Dashboard currency" value={money?.currency ?? ''} onChange={event => setCurrency(event.target.value)} className="min-h-11 rounded-lg border border-cream-dark bg-white px-3 text-sm text-charcoal">{data.money.map(item => <option key={item.currency}>{item.currency}</option>)}</select></label>}{data.money_visible && <Link to="/portal/owner/transactions" className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-cobalt hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt">Checkout transactions<WorkflowIcon name="arrowRight" size={14} /></Link>}</div>
        {data.money_visible && money ? <MoneyOverview data={data} money={money} /> : <p className="text-sm text-forest-muted">Your role does not include payment summaries. Ask the business owner for payment access.</p>}
      </section>
      {data.work_visible && <section aria-labelledby="dashboard-attention-title" className="overflow-hidden rounded-2xl border border-cream-dark bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5 md:px-6"><div><h2 id="dashboard-attention-title" className="flex items-center gap-2 text-base font-semibold text-charcoal">Needs attention<span className="rounded-full bg-cobalt/10 px-2.5 py-0.5 text-xs text-cobalt">{data.task_count}</span></h2><p className="mt-1 text-xs leading-relaxed text-forest-muted">Problems and overdue work first. Customer actions are marked separately.</p></div><span className="text-xs text-forest-muted">Across all dates</span></div>
        {data.tasks.length ? <ul aria-label="Work needing attention">{data.tasks.map(task => <TaskRow key={`${task.kind}:${task.id}`} task={task} />)}</ul> : data.task_count > 0 ? <div className="px-6 py-8"><p className="text-sm text-forest-muted">This page is empty after the latest update.</p><button type="button" className={`${buttonClass} mt-3`} onClick={() => setOffset(0)}>Return to first page</button></div> : <div className="border-t border-cream-dark px-6 py-8"><WorkflowIcon name="check" size={24} className="mb-3 text-cobalt" /><h3 className="font-semibold text-charcoal">You're up to date</h3><p className="mt-1 max-w-prose text-sm text-forest-muted">No overdue work, requests to review or payment follow-ups for this branch. In-progress work stays on its work screen.</p></div>}
        {data.task_count > data.limit && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cream-dark px-4 py-3 md:px-6"><button type="button" className={buttonClass} disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - data.limit))}>Previous</button><span className="text-xs text-forest-muted" aria-live="polite">{Math.min(offset + 1, data.task_count)}–{Math.min(offset + data.tasks.length, data.task_count)} of {data.task_count}</span><button type="button" className={buttonClass} disabled={offset + data.limit >= data.task_count} onClick={() => setOffset(value => value + data.limit)}>Next</button></div>}
      </section>}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-forest-muted"><p role="status">Updated {timeLabel(data.updated_at)} · Lusaka time</p>{selectedStore?.slug && <Link to={`/store/${selectedStore.slug}`} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-cobalt hover:underline">View storefront<WorkflowIcon name="arrowRight" size={14} /></Link>}</div>
    </>}
    <nav aria-label="Business setup" className="flex flex-wrap gap-x-5 gap-y-1 border-t border-cream-dark pt-3 text-xs font-medium text-cobalt">
      {hasPermission(PERM.productsView) && <Link className="inline-flex min-h-11 items-center gap-2 hover:underline" to="/portal/owner/products"><WorkflowIcon name="settings" />Manage catalogue</Link>}
      {hasPermission(PERM.storesView) && <Link className="inline-flex min-h-11 items-center gap-2 hover:underline" to="/portal/owner/stores"><WorkflowIcon name="briefcase" />Manage branches</Link>}
    </nav>
  </div>;
}

export function MerchantDashboardOverview() {
  const { stores, selectedStoreId, loading, error, refreshStores } = useMarketplace();
  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refreshStores} title="Could not load your business" />;
  if (!stores.length) return <EmptyState title="Create your first branch" description="Your payment summary and urgent work will appear here once your business is set up." actionLabel="Set up business" actionTo="/portal/owner/stores/new" />;
  if (!selectedStoreId) return <p className="text-sm text-forest-muted">Choose a branch to see its payments and work.</p>;
  return <SelectedBranchDashboard key={selectedStoreId} storeId={selectedStoreId} />;
}
export default MerchantDashboardOverview;
