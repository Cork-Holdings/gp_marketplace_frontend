import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { AdminService } from '@/lib/api/services/admin';
import api from '@/lib/api/crud';
import { recordedCount, recordedCurrency, recordedNumber } from '@/lib/recordedData';
import { ErrorState } from '@/components/common/ErrorState';
import { Metric, QuickAction, ReferencePanel } from './ReferenceUI';
import { BusinessModuleDirectory } from './ModuleOverviewPage';
import { OrderSummaryRows } from './DashboardWidgets';
import { TrendChart } from './ReferenceCharts';
import { SettlementAlertSummary } from '@/components/payments/SettlementAlerts';

type Point = {date: string; value: string | number};
type PlatformData = {
  merchants: number; customers: number; stores: number; collection_count: number;
  order_counts: Record<string, number>;
  money: {currency: string; count: number; collected: string; average: string; trend: Point[]}[];
  merchant_growth: Point[]; customer_growth: Point[]; updated_at: string;
};
const points = (rows?: Point[]) => rows?.map(point => ({label: new Date(point.date).toLocaleDateString('en-ZM', {month:'short', day:'numeric', timeZone:'Africa/Lusaka'}), value: recordedNumber(point.value)}));

export default function AdminReferenceDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState<{data?: PlatformData; kyc?: number; error?: unknown; loading: boolean}>({loading:true});
  const [revision, setRevision] = useState(0);
  const [currency, setCurrency] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setState({loading:true});
    void Promise.allSettled([api.get('/admin/dashboard', {signal:controller.signal}), AdminService.listKyc({status:'pending',limit:'1'})]).then(results => {
      if (controller.signal.aborted) return;
      const summary = results[0], kyc = results[1];
      setState({data:summary.status==='fulfilled'?summary.value:undefined,kyc:kyc.status==='fulfilled'?recordedCount(kyc.value?.total):undefined,error:summary.status==='rejected'?summary.reason:undefined,loading:false});
    });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener('geepay:activity-changed', refresh);
    return () => window.removeEventListener('geepay:activity-changed', refresh);
  }, []);
  const data = state.data;
  const money = data?.money.find(item => item.currency===currency) ?? data?.money[0];
  const count = (value:unknown) => recordedCount(value) ?? (state.loading?'Loading…':'Unavailable');
  const trend = points(money?.trend), merchantGrowth = points(data?.merchant_growth), customerGrowth = points(data?.customer_growth);
  const chart = (series:ReturnType<typeof points>,label:string,monetary=false) => series?.length && series.every(point=>point.value!==undefined) ? <TrendChart points={series as {label:string;value:number}[]} valueLabel={label} money={monetary} area={!monetary}/> : <p className="reference-note" role="status">{state.loading?'Loading data…':'No data available for this summary.'}</p>;
  return <div className="reference-dashboard">
    <header className="reference-dashboard-head"><div><h1>Welcome back, {user?.full_name?.split(' ')[0] || 'there'}</h1><p>Recorded platform data. Totals are all time; trends cover the last 30 days.</p></div><button className="reference-button" disabled={state.loading} onClick={()=>setRevision(value=>value+1)}>Refresh data</button></header>
    {state.error && <ErrorState error={state.error} title="Platform summary could not be loaded" onRetry={()=>setRevision(value=>value+1)}/>}
    <div className="reference-metrics admin-metrics">
      <Metric title="Confirmed collections" icon="cart" tone="mint" value={count(data?.collection_count)} caption="Successful provider payments"/>
      <Metric title="Collected value" icon="coins" tone="blue" value={money?recordedCurrency(money.collected,money.currency):state.loading?'Loading…':'No confirmed collections'} caption="Before partial refunds · not payout float"/>
      <Metric title="Total Merchants" icon="monitor" tone="violet" value={count(data?.merchants)} to="/portal/admin/merchants" caption="Registered businesses · all time"/>
      <Metric title="Total Customers" icon="users" tone="gold" value={count(data?.customers)} to="/portal/admin/customers" caption="Registered customer accounts"/>
      <Metric title="Average Collection" icon="wallet" tone="mint" value={money?recordedCurrency(money.average,money.currency):state.loading?'Loading…':'No confirmed collections'} caption={money?.currency ?? 'No currencies combined'}/>
    </div>
    <div className="reference-admin-row module-admin-row">
      <ReferencePanel title="Collection Value" action={data?.money.length?<label className="reference-small">Currency <select aria-label="Platform collection currency" value={money?.currency} onChange={event=>setCurrency(event.target.value)}>{data.money.map(item=><option key={item.currency}>{item.currency}</option>)}</select></label>:undefined}>{chart(trend,`Collections (${money?.currency ?? ''})`,money?.currency==='ZMW')}</ReferencePanel>
      <ReferencePanel title="Orders by Status" to="/portal/admin/orders"><OrderSummaryRows counts={data?.order_counts} loading={state.loading}/></ReferencePanel>
    </div>
    <div className="reference-admin-row row-two">
      <ReferencePanel title="Merchant Registrations" to="/portal/admin/merchants">{chart(merchantGrowth,'Registered merchants')}</ReferencePanel>
      <ReferencePanel title="Customer Registrations">{chart(customerGrowth,'Registered customer accounts')}</ReferencePanel>
      <ReferencePanel title="Stores" to="/portal/admin/stores"><div className="reference-note"><strong>{count(data?.stores)} registered stores</strong><p>Open the store directory to view and manage storefronts.</p><QuickAction label="Onboard merchant" icon="plus" to="/portal/admin/merchants/new"/></div></ReferencePanel>
    </div>
    <ReferencePanel title="Business records"><div className="admin-records-shortcuts"><QuickAction label="Business ERP oversight" icon="layers" to="/portal/admin/erp"/><QuickAction label="Service & booking records" icon="calendar" to="/portal/admin/operations"/><QuickAction label="Customer directory" icon="users" to="/portal/admin/customers"/><QuickAction label="Products & Services" icon="package" to="/portal/admin/products"/></div></ReferencePanel>
    <BusinessModuleDirectory role="admin"/>
    <div className="reference-admin-row module-admin-row">
      <ReferencePanel title="KYC Review Queue" to="/portal/admin/kyc"><div className="reference-note"><strong>{state.kyc ?? (state.loading?'Loading…':'Unavailable')} pending KYC reviews</strong><p>Review submitted business and identity documents.</p></div></ReferencePanel>
      <ReferencePanel title="Settlement alerts" to="/portal/admin/notifications"><SettlementAlertSummary/></ReferencePanel>
    </div>
  </div>;
}
