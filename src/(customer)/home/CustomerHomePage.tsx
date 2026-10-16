import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useCustomerHome } from '@/hooks/useCustomerHome';
import { customerReviews, type CustomerHomeRecord } from '@/lib/customerHome';
import { DEFAULT_LOCALE } from '@/lib/locale';
import { recordedCurrency } from '@/lib/recordedData';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { AccountIcon } from '@/components/customer/AccountIcon';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { Metric } from '@/components/reference/ReferenceUI';
import { ServiceJobProgress } from '@/components/jobs/ServiceJobProgress';
import type { ServiceJobStatus } from '@/types/serviceQuote';

const focus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest';
const panel = 'min-w-0 overflow-hidden rounded-2xl border border-[#dfe4ef] bg-white';
const shortcuts = [
  {title: 'Shop products', description: 'Everyday essentials, food and more.', to: '/?kind=products', image: 'fashion', action: 'Explore products'},
  {title: 'Find a service', description: 'Haircuts, home repairs and care.', to: '/?kind=services', image: 'barbering', action: 'Explore services'},
  {title: 'Custom & bulk', description: 'Made for you, or supplied in quantity.', to: '/account/custom-orders?view=new', image: 'cakes', action: 'Start a request'},
];

function dateLabel(value?: string, withTime = false) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Date to be arranged';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {dateStyle: 'medium', ...(withTime ? {timeStyle: 'short' as const} : {})}).format(new Date(value));
}

function TextLink({to, children}: {to: string; children: ReactNode}) {
  return <Link to={to} className={`inline-flex min-h-11 items-center gap-2 rounded text-sm font-semibold text-forest hover:underline ${focus}`}>{children}<WorkflowIcon name="arrowRight" size={14} /></Link>;
}

function PreviewSkeleton({label}: {label: string}) {
  return <div role="status" aria-label={label} className="space-y-5 p-5"><span className="sr-only">{label}…</span>{[0,1,2].map(item => <div key={item} aria-hidden className="space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div>)}</div>;
}

function HistoryPanel({kind, rows, loading, error, refresh, business}: {kind: 'bookings' | 'orders'; rows: CustomerHomeRecord[]; loading: boolean; error?: unknown; refresh: () => void; business: (row: CustomerHomeRecord) => string}) {
  const bookings = kind === 'bookings';
  const title = bookings ? 'Latest bookings' : 'Latest orders';
  return <section className={panel} aria-labelledby={`home-${kind}`}>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4e8f1] px-5 py-4"><h2 id={`home-${kind}`} className="flex items-center gap-2 text-lg font-semibold text-navy"><WorkflowIcon name={bookings ? 'calendar' : 'package'} size={20} />{title}</h2><TextLink to={bookings ? '/account/bookings' : '/account/ledger'}>{bookings ? 'All bookings' : 'All orders'}</TextLink></div>
    {loading ? <PreviewSkeleton label={`Loading ${kind}`} /> : error ? <div className="p-4"><ErrorState error={error} title={`${bookings ? 'Bookings' : 'Orders'} could not be loaded`} onRetry={refresh} /></div> : rows.length ? <ul className="divide-y divide-[#e4e8f1]">{rows.map(row => <li key={row.id}>
      <Link to={bookings ? `/account/bookings?detail=${encodeURIComponent(row.id)}` : `/account/orders/${encodeURIComponent(row.id)}`} className={`flex min-w-0 flex-wrap items-start justify-between gap-3 px-5 py-4 hover:bg-cream/30 ${focus}`}>
        <div className="min-w-0 flex-1 basis-40"><p className="break-words text-sm font-semibold text-navy">{bookings ? row.title || 'Booking' : row.order_number ? `Order #${row.order_number}` : 'Your order'}</p><p className="mt-1 break-words text-xs leading-5 text-forest-muted">{business(row)}{!bookings && ` · ${dateLabel(row.created_at)}`}</p><p className="mt-2 flex items-start gap-1.5 text-xs font-medium tabular-nums text-forest">{bookings ? <><WorkflowIcon name="clock" size={14} /><span>{dateLabel(row.starts_at, true)}</span></> : recordedCurrency(row.total ?? row.total_amount, row.currency)}</p></div><StatusBadge status={row.status} />
      </Link>
    </li>)}</ul> : <div className="p-5"><p className="text-sm font-semibold text-navy">{bookings ? 'Your next visit starts here' : 'No orders yet'}</p><p className="mt-1 text-sm leading-6 text-forest-muted">{bookings ? 'Find a provider by service, then choose a time.' : 'Your purchases will appear here with pickup or delivery updates.'}</p><div className="mt-3"><TextLink to={bookings ? '/?kind=services' : '/?kind=products'}>{bookings ? 'Find a service' : 'Explore products'}</TextLink></div></div>}
  </section>;
}

export default function CustomerHomePage() {
  const {user} = useAuth();
  const navigate = useNavigate();
  const {records, errors, loading, refresh, storeNames, updatedAt} = useCustomerHome();
  const reviews = customerReviews(records);
  const reviewError = errors.quotes || errors.jobs || errors.requests;
  const firstName = user?.full_name?.trim().split(/\s+/)[0];
  const visit = (records.jobs ?? []).find(row=>['assigned','dispatched','arrived','in_progress','provider_completed','disputed'].includes(row.status));
  const business = (row: CustomerHomeRecord) => row.store_name || (row.store_id && storeNames[row.store_id]) || 'Marketplace business';
  return <main className="reference-customer-home space-y-4" aria-labelledby="customer-home-title">
    <header>
      <p className="text-xs font-semibold uppercase tracking-[.12em] text-forest">Your GeePay</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><h1 id="customer-home-title" className="break-words text-2xl font-bold leading-tight text-navy [text-wrap:balance] sm:text-3xl">{firstName ? `Welcome back, ${firstName}` : 'Welcome to your GeePay'}</h1><p className="mt-2 text-sm leading-6 text-forest-muted">Your purchases, plans and next steps—all in one place.</p></div><button type="button" onClick={refresh} disabled={loading} aria-busy={loading} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#dfe4ef] bg-white px-4 text-sm font-semibold text-navy hover:bg-cream disabled:cursor-wait disabled:opacity-60 ${focus}`}><WorkflowIcon name="clock" />{loading ? 'Updating…' : 'Refresh'}</button></div>
      <form role="search" aria-label="Find products or services" className="mt-5 flex min-w-0 items-center gap-2 rounded-xl border border-[#dfe4ef] bg-white p-2 focus-within:ring-2 focus-within:ring-forest/30" onSubmit={event => {event.preventDefault(); const query = String(new FormData(event.currentTarget).get('q') ?? '').trim(); navigate(query ? `/?q=${encodeURIComponent(query)}` : '/');}}>
        <span className="ml-2 text-forest-muted"><WorkflowIcon name="search" size={20} /></span><label className="sr-only" htmlFor="account-marketplace-search">What are you looking for?</label><input id="account-marketplace-search" name="q" type="search" maxLength={120} autoComplete="off" placeholder="Try a haircut, plumbing or a birthday cake…" className="min-h-11 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-navy outline-none placeholder:text-forest-muted" /><button type="submit" aria-label="Search marketplace" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-forest text-white hover:bg-forest-dark ${focus}`}><WorkflowIcon name="arrowRight" size={20} /></button>
      </form>
    </header>
    <div className="reference-metrics customer-metrics" aria-label="Recent account activity">
      <Metric title="Recent orders" icon="bag" tone="blue" value={loading?'…':errors.orders?'Unavailable':records.orders?.length??0} caption="Latest loaded records" to="/account/ledger"/>
      <Metric title="Recent bookings" icon="calendar" tone="violet" value={loading?'…':errors.bookings?'Unavailable':records.bookings?.length??0} caption="Latest loaded records" to="/account/bookings"/>
      <Metric title="Ready for review" icon="document" tone="gold" value={loading?'…':reviewError?'Unavailable':reviews.length} caption={reviewError?'Some records unavailable':'Recent requests and work'}/>
      <Metric title="Payments & receipts" icon="wallet" tone="mint" value="View activity" caption="Recorded payments" to="/account/transactions"/>
    </div>
    {visit&&<section className={panel} aria-label="Active service visit"><div className="flex flex-wrap justify-between gap-2 p-4"><div><h2 className="font-semibold">{visit.title||'Your service visit'}</h2><p className="text-xs text-forest-muted mt-1">{business(visit)}</p></div><TextLink to={`/account/jobs?detail=${encodeURIComponent(visit.id)}`}>Open visit</TextLink></div><div className="px-4 pb-4"><ServiceJobProgress status={visit.status as ServiceJobStatus}/></div></section>}
    <section aria-label="Explore GeePay" className="grid gap-3 md:grid-cols-3">{shortcuts.map(shortcut => <Link key={shortcut.title} to={shortcut.to} className={`group flex min-w-0 items-center gap-4 overflow-hidden rounded-xl border border-[#dfe4ef] bg-white p-3 transition-colors hover:border-forest/40 hover:bg-cream/30 motion-reduce:transition-none ${focus}`}>
      <img src={`/images/discovery/painted/${shortcut.image}-160.webp`} alt="" width={96} height={96} className="h-24 w-24 shrink-0 rounded-lg object-cover" /><div className="min-w-0"><h2 className="text-base font-semibold text-navy">{shortcut.title}</h2><p className="mt-1 text-xs leading-5 text-forest-muted">{shortcut.description}</p><span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-forest">{shortcut.action}<WorkflowIcon name="arrowRight" size={14} /></span></div>
    </Link>)}</section>
    <section className={panel} aria-labelledby="customer-review-heading">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4e8f1] px-5 py-4"><div><h2 id="customer-review-heading" className="text-lg font-semibold text-navy">Ready for your review</h2><p className="mt-1 text-sm leading-6 text-forest-muted">Recent estimates, prices and completed work waiting for your decision.</p></div><TextLink to="/account/quotes">All estimates</TextLink></div>
      {loading ? <PreviewSkeleton label="Loading your next steps" /> : <>
        {reviewError && <div className="p-4"><ErrorState error={reviewError} title="Some requests could not be loaded" onRetry={refresh} /></div>}
        {reviews.length > 0 ? <ul className="divide-y divide-[#e4e8f1]">{reviews.slice(0,4).map(review => <li key={review.id}><Link to={review.to} className={`flex min-w-0 flex-wrap items-center gap-3 px-5 py-4 hover:bg-cream/30 sm:flex-nowrap ${focus}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-forest/10 text-forest"><AccountIcon name={review.icon} /></span><div className="min-w-0 flex-1 basis-40"><p className="break-words text-sm font-semibold text-navy">{review.title}</p><p className="mt-1 text-xs leading-5 text-forest-muted">{review.description}</p></div><span className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-forest">{review.action}<WorkflowIcon name="arrowRight" size={16} /></span></Link></li>)}</ul> : !reviewError && <div className="flex items-start gap-3 p-5"><span className="mt-0.5 text-success-fg"><WorkflowIcon name="check" size={20} /></span><div><p className="text-sm font-semibold text-navy">No recent requests waiting for review</p><p className="mt-1 text-sm leading-6 text-forest-muted">You can explore the marketplace or open a section to check older activity.</p></div></div>}
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[#e4e8f1] px-5 py-2"><TextLink to="/account/custom-orders">All custom requests</TextLink><TextLink to="/account/jobs">All service visits</TextLink></div>
      </>}
    </section>
    <div className="grid items-start gap-5 xl:grid-cols-2"><HistoryPanel kind="bookings" rows={(records.bookings ?? []).slice(0,3)} loading={loading} error={errors.bookings} refresh={refresh} business={business} /><HistoryPanel kind="orders" rows={(records.orders ?? []).slice(0,3)} loading={loading} error={errors.orders} refresh={refresh} business={business} /></div>
    <Link to="/account/transactions" className={`flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-[#dfe4ef] bg-white px-5 py-4 hover:bg-cream/30 ${focus}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-forest/10 text-forest"><WorkflowIcon name="creditCard" size={20} /></span><div className="min-w-0 flex-1 basis-40"><h2 className="text-sm font-semibold text-navy">Payments & receipts</h2><p className="mt-1 text-xs leading-5 text-forest-muted">Check recorded payment activity. Pay from the relevant order or request.</p></div><WorkflowIcon name="arrowRight" size={20} /></Link>
    <p className="text-xs leading-5 text-forest-muted">This home shows recent activity, not every open item. Open each section for more details and history.{updatedAt && <> Updated {dateLabel(updatedAt, true)}.</>}</p>
  </main>;
}
