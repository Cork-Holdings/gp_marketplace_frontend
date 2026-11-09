import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useOwnerDashboard } from '@/hooks/useOwnerDashboard';
import { recordedCurrency, recordedNumber } from '@/lib/recordedData';
import { orderSummary } from '@/lib/orderSummary';
import { ErrorState } from '@/components/common/ErrorState';
import type { DashboardPeriod } from '@/types/ownerDashboard';
import { Metric, QuickAction, ReferencePanel } from './ReferenceUI';
import { BusinessModuleDirectory } from './ModuleOverviewPage';
import { TrendChart } from './ReferenceCharts';
import { StockRows, ActivityRows, OrderSummaryRows } from './DashboardWidgets';
import { ReferenceIcon } from './ReferenceIcon';
import { OwnerService } from '@/lib/api/services/owner';
import { usePermissions } from '@/lib/context/permissions';
import { PERM } from '@/lib/permissions';
import { ERPActivitySummary } from '@/components/erp/ERPActivitySummary';
import type { Product } from '@/types/product';
const taskRoutes = { order: 'orders', reservation: 'bookings', quote: 'quotes', custom_order: 'custom-orders', job: 'jobs' };
export default function OwnerReferenceDashboard() {
    const { user } = useAuth();
    const { selectedStore } = useMarketplace();
    const [period, setPeriod] = useState<DashboardPeriod>('30d');
    const [currency, setCurrency] = useState('');
    const [offset, setOffset] = useState(0);
    const result = useOwnerDashboard(selectedStore?.id, period, offset);
    const { hasPermission } = usePermissions();
    const canReadStock = hasPermission(PERM.productsView);
    const storeId = selectedStore?.id;
    const canReadOrders = hasPermission(PERM.ordersView);
    const [stock, setStock] = useState<{
        key?: string;
        rows?: Product[];
        error?: unknown;
    }>({});
    useEffect(() => { if (!storeId || !canReadStock)
        return; let ignore = false; setStock({ key: storeId }); void OwnerService.listProducts(storeId).then(rows => { if (!ignore)
        setStock({ key: storeId, rows }); }, error => { if (!ignore)
        setStock({ key: storeId, error }); }); return () => { ignore = true; }; }, [storeId, canReadStock]);
    const data = result.data;
    const orders = orderSummary(data?.order_counts);
    const money = data?.money.find(item => item.currency === currency) ?? data?.money[0];
    const trend = money?.trend.map(point => ({ label: Number.isFinite(Date.parse(point.date)) ? new Intl.DateTimeFormat('en-ZM', {timeZone:'Africa/Lusaka', month:'short', day:'numeric'}).format(new Date(point.date)) : point.date, value: recordedNumber(point.collected) }));
    const validTrend = trend?.length && trend.every(point => point.value !== undefined);
    return <div className="reference-dashboard">
    <header className="reference-dashboard-head"><div><h1>Welcome back, {user?.full_name?.split(' ')[0] || 'there'}!</h1><p>Here’s how your business is doing{selectedStore ? ` · ${selectedStore.name}` : ''}.</p></div><label className="reference-period"><ReferenceIcon name="calendar" size={17}/><span className="sr-only">Collection period</span><select value={period} onChange={event => { setPeriod(event.target.value as DashboardPeriod); setOffset(0); }}><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="all">All time</option></select></label></header>
    
    {!selectedStore && <p className="reference-notice">Select a branch to see its collections and work.</p>}
    {result.error && <ErrorState error={result.error} onRetry={result.refresh} title="Business summary could not be loaded"/>}
    <div className="reference-owner-grid"><div className="reference-owner-main">
      <div className="reference-metrics">
        <Metric title={'Confirmed collections'} value={data?.money_visible && money ? recordedCurrency(money.collected, money.currency) : selectedStore && result.loading ? 'Loading…' : '—'} caption={'Net of refunds · not a payout balance'} icon="chart" tone="mint"/>
        <Metric title="Total Orders" icon="bag" tone="blue" to="/portal/owner/orders" value={!canReadOrders?'Restricted':orders?.total ?? (storeId && result.loading?'Loading…':'Unavailable')} caption="All time · selected branch"/>
      </div>
      <div className="reference-owner-sales"><ReferencePanel title={'Collection Overview'} action={data?.money.length > 1 ? <label>Currency <select aria-label="Collection currency" value={money?.currency} onChange={event => setCurrency(event.target.value)}>{data.money.map(item => <option key={item.currency}>{item.currency}</option>)}</select></label> : <span className="reference-small">{period === 'all' ? 'Most recent 30 days' : period === 'today' ? 'Today' : period === '7d' ? 'Last 7 days' : 'Last 30 days'}</span>}>
        {data?.money_visible && validTrend ? <TrendChart money={money.currency === 'ZMW'} points={trend} valueLabel={`Net collections (${money.currency})`}/> : <div className="reference-pending"><ReferenceIcon name="chart" size={30}/><p>{selectedStore && result.loading ? 'Loading collections…' : 'No collection trend available'}</p><small>{data && !data.money_visible ? 'Your role does not include payment summaries.' : 'Confirmed collections appear here. Sales and profit reporting are coming soon.'}</small></div>}
      </ReferencePanel><ReferencePanel title="Orders" to="/portal/owner/orders"><OrderSummaryRows counts={data?.order_counts} loading={result.loading} restricted={!canReadOrders}/></ReferencePanel></div>
      <BusinessModuleDirectory role="owner"/>
      <ERPActivitySummary/>
      {data && <ReferencePanel title="Needs attention" action={<button className="reference-link-button" onClick={result.refresh} disabled={result.loading}>Refresh</button>}>
        {data.simulated && <p className="reference-notice">Simulation mode · test collections are not real money.</p>}
        {data.money_visible && <div className="reference-payment-facts">{data.money.map(item => <div key={item.currency}><strong>{recordedCurrency(item.outstanding, item.currency)}</strong><span>Outstanding agreed value · {item.pending_count} collections in progress</span></div>)}</div>}
        {!data.work_visible ? <p className="reference-note">Your role does not include work summaries.</p> : <><ActivityRows rows={data.tasks.map(task => ({ title: task.title, detail: task.reason, age: task.audience === 'customer' ? 'Customer action' : 'Your action', icon: task.kind === 'reservation' ? 'calendar' : 'document', tone: task.priority === 0 ? 'rose' : 'blue', to: `/portal/owner/${taskRoutes[task.kind]}${task.kind === 'order' ? '' : `?detail=${encodeURIComponent(task.id)}`}` }))}/>{!data.tasks.length && <p className="reference-note">No work waiting on this page. Open a work section to see ongoing items.</p>}{data.task_count > data.limit && <div className="reference-pagination"><button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - data.limit))}>Previous</button><span>{offset + 1}–{Math.min(offset + data.tasks.length, data.task_count)} of {data.task_count}</span><button disabled={offset + data.limit >= data.task_count} onClick={() => setOffset(offset + data.limit)}>Next</button></div>}</>}
      </ReferencePanel>}
    </div><aside className="reference-owner-rail" aria-label="Business actions and alerts"><div className="reference-quick-actions"><QuickAction icon="plus" label="Add Product / Service" to="/portal/owner/products" primary/><QuickAction icon="document" label="Create Quotation" to="/portal/owner/quotes"/><QuickAction icon="monitor" label="View Store" to={selectedStore ? `/store/${encodeURIComponent(selectedStore.slug)}` : '/portal/owner/stores'}/></div>
      <ReferencePanel title="Inventory Alerts" to="/portal/owner/inventory">{canReadStock && stock.key === storeId && stock.rows ? <StockRows products={stock.rows}/> : <p className="reference-note">{stock.key === storeId && stock.error ? 'Stock could not be loaded. Open Inventory to retry.' : canReadStock && storeId ? 'Loading stock…' : 'Open Inventory to review available stock and variants.'}</p>}</ReferencePanel>
    </aside></div>
  </div>;
}
