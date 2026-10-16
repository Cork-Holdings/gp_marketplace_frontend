import { userMessage } from '@/lib/userMessage';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api/crud';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { usePaymentMode } from '@/hooks/usePaymentMode';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { TableSkeleton } from '@/components/common/Skeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';

type RecordItem = { reference: string; kind: string; source_id: string; stage: string; store_name: string; title: string; amount: string; currency: string; collection: string; created_at: string; delivered: boolean; receipt_confirmed: boolean; state: string; problem: string };
const labels: Record<string,string> = { confirm_receipt: 'Confirm receipt', report_problem: 'Report a problem', release: 'Simulate release', resolve_release: 'Resolve case and simulate release', payout: 'Simulate payout', refund: 'Simulate full refund' };
const kindLabels: Record<string,string> = { order: 'Store order', reservation: 'Appointment', quote: 'Service estimate', custom_order: 'Custom or bulk request' };
function sourcePath(item: RecordItem, mode: string) {
 const root = mode === 'customer' ? '/account' : '/portal/owner';
 const pages: Record<string,string> = { order: mode === 'customer' ? 'ledger' : 'orders', reservation: 'bookings', quote: 'quotes', custom_order: 'custom-orders' };
 return `${root}/${pages[item.kind] ?? 'transactions'}`;
}

export default function SettlementRehearsalPage({mode,storeId}: {mode: 'customer'|'merchant'|'admin';storeId?: string}) {
 const simulated = usePaymentMode();
 const [search,setSearch] = useState('');
 const [query,setQuery] = useState('');
 const [page,setPage] = useState(0);
 const [selected,setSelected] = useState<RecordItem|null>(null);
 const [action,setAction] = useState('');
 const [reason,setReason] = useState('');
 const [busy,setBusy] = useState(false);
 const busyRef = useRef(false);
 const [notice,setNotice] = useState('');
 const [failure,setFailure] = useState('');
 useEffect(() => { const t=setTimeout(()=>{setQuery(search.trim());setPage(0);},250);return()=>clearTimeout(t); },[search]);
 useEffect(()=>{setPage(0);setSelected(null);},[storeId]);
 const { data,loading,error,retry } = useFetchWrapper(({signal})=>api.get(`/local-settlements?limit=12&offset=${page*12}&q=${encodeURIComponent(query)}${storeId ? `&store=${storeId}` : ''}`,{signal}),[simulated,page,query,storeId],{enabled: simulated && (mode!=='merchant'||Boolean(storeId))});
 const items: RecordItem[] = data?.items ?? [];
 const startAction = (item: RecordItem,name: string) => { setSelected(item);setAction(name);setReason('');setFailure(''); };
 const perform = async () => {
  if(!selected || busyRef.current)return;
  busyRef.current=true;setBusy(true);setFailure('');
  try {
   await api.post(`/local-settlements/${selected.reference}/actions`,{action,reason});
   setNotice(`${labels[action]} recorded. No money moved.`);setAction('');setSelected(null);await retry();
  } catch(err) { setFailure(userMessage(err, 'Could not record this decision. Try again.')); }
  finally{busyRef.current=false;setBusy(false);}
 };
 const needsReason = action !== 'confirm_receipt';
 // Customer pages own their main landmark; merchant/admin shells already do.
 const PageRoot = mode === 'customer' ? 'main' : 'div';
 return <PageRoot className="workflow-page">
  <header className="workflow-header"><p className="workflow-eyebrow">Local test environment</p><h1>{mode==='customer' ? 'Payment & receipt history' : mode==='admin' ? 'Financial test queue' : 'Settlement rehearsal'}</h1><p>Follow a payment from collection to receipt, release and payout.</p></header>
  <div className="mb-6 flex items-start gap-3 rounded-xl border border-sky/25 bg-sky/5 p-4 text-sm text-forest-muted" role="note"><WorkflowIcon name="creditCard" className="mt-0.5 h-5 w-5 shrink-0 text-forest"/><p><strong className="text-charcoal">Simulation only.</strong> No money is collected, held, refunded or paid out. Fees are zero for this rehearsal. Live settlement still needs provider support and approved policies.</p></div>
  {notice && <p role="status" className="mb-4 rounded-lg bg-sage/40 p-3 text-sm text-forest">{notice}</p>}
  {!simulated ? <p className="workflow-empty">This rehearsal is only available with the local simulator running.</p> : mode==='merchant'&&!storeId ? <p className="workflow-empty">Choose a branch to view its test payments.</p> : <section className="workflow-panel">
   <div className="workflow-panel-heading"><h2>{mode==='admin' ? 'Payments and cases' : 'Test payment activity'}</h2><p>{mode==='customer' ? 'Confirm receipt after delivery, or report a problem before release.' : mode==='merchant' ? 'Track collection, delivery and the test payout status for this branch.' : 'Only finance and super administrators can record financial decisions.'}</p></div>
   <div className="flex flex-wrap items-center gap-3 border-b border-cream-dark p-4"><label className="flex min-w-0 flex-1 items-center gap-2" htmlFor="settlement-search"><WorkflowIcon name="search" className="h-4 w-4 shrink-0 text-forest-muted"/><span className="sr-only">Search payment history</span><input id="settlement-search" className="field-input" type="search" maxLength={120} placeholder="Search service, business or payment state" value={search} onChange={event=>setSearch(event.target.value)}/></label><Button variant="secondary" onClick={()=>void retry().catch(()=>{})} disabled={loading}>Refresh</Button></div>
   {loading ? <TableSkeleton rows={4} cols={3}/> : error ? <ErrorState error={error} onRetry={retry}/> : items.length ? <ul className="customer-activity-list">{items.map(item=><li className="customer-activity-row" key={item.reference}>
    <div className="customer-activity-main"><button type="button" className="customer-activity-title text-left" onClick={()=>{setSelected(item);setAction('');setFailure('');}}>{item.title}</button><span>{item.store_name} · {kindLabels[item.kind]} · {item.stage==='deposit'?'Initial payment':item.stage==='balance'?'Balance':'Full payment'}</span><span>{new Date(item.created_at).toLocaleDateString('en-ZM')} · {item.delivered ? 'Delivery recorded' : 'Awaiting delivery'}{item.receipt_confirmed ? ' · Receipt confirmed' : ''}</span>{item.problem&&<span className="text-red-700">Problem reported: {item.problem}</span>}</div>
    <div className="customer-activity-meta"><strong>{formatCurrency(item.amount,item.currency)}</strong><StatusBadge status={item.collection==='successful' ? item.state : item.collection}/><Button size="sm" variant="secondary" onClick={()=>{setSelected(item);setAction('');setFailure('');}}>View details <WorkflowIcon name="arrowRight" className="h-4 w-4"/></Button></div>
   </li>)}</ul> : <div className="workflow-empty"><WorkflowIcon name="document" className="mx-auto mb-3 h-7 w-7 text-forest-muted"/><p>{query ? 'No test payments match your search.' : 'No simulated payments yet. Complete a test payment first.'}</p>{query&&<Button variant="secondary" onClick={()=>setSearch('')}>Clear search</Button>}</div>}
   <nav aria-label="Payment history pages" className="flex items-center justify-between gap-4 border-t border-cream-dark p-4"><Button size="sm" variant="secondary" disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>Previous</Button><span className="text-sm text-forest-muted">Page {page+1}</span><Button size="sm" variant="secondary" disabled={!data?.has_more||loading} onClick={()=>setPage(p=>p+1)}>Next</Button></nav>
  </section>}
  <Dialog open={Boolean(selected)} onOpenChange={open=>{if(!open&&!busy)setSelected(null);}}>
   <DialogContent size="md" onEscapeKeyDown={event=>{if(busy)event.preventDefault();}} onPointerDownOutside={event=>{if(busy)event.preventDefault();}}>
    <DialogHeader><DialogTitle>{action ? labels[action] : selected?.title}</DialogTitle></DialogHeader>
    <DialogBody>{selected&&<>
     <p className="mb-4 text-sm text-forest-muted">{selected.store_name} · Simulation only</p>
     <dl className="divide-y divide-cream-dark text-sm"><div className="flex justify-between gap-3 py-3"><dt>Amount</dt><dd className="font-semibold">{formatCurrency(selected.amount,selected.currency)}</dd></div><div className="flex justify-between gap-3 py-3"><dt>Collection</dt><dd className="capitalize">{selected.collection}</dd></div><div className="flex justify-between gap-3 py-3"><dt>Test settlement</dt><dd className="capitalize">{selected.collection==='successful' ? selected.state.replaceAll('_',' ') : 'Not collected'}</dd></div><div className="flex justify-between gap-3 py-3"><dt>Delivery / receipt</dt><dd>{selected.delivered ? 'Recorded' : 'Not yet'} / {selected.receipt_confirmed ? 'Confirmed' : 'Not yet'}</dd></div></dl>
     {selected.problem&&<p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{selected.problem}</p>}
     {action ? <div className="mt-5"><p className="mb-3 text-sm text-forest-muted">{action==='confirm_receipt' ? 'Confirm only after you have received the goods or service. This makes the test payment eligible for release.' : 'This records a test decision, not a real money movement. A reason is retained in the audit record.'}</p>{needsReason&&<><label className="field-label" htmlFor="financial-reason">{action==='report_problem'?'What went wrong?':'Decision reason'}</label><textarea id="financial-reason" className="field-input" rows={3} maxLength={1000} value={reason} onChange={event=>setReason(event.target.value)} placeholder="Explain in at least 10 characters"/></>}</div> : <div className="mt-5 space-y-3"><p className="break-all text-xs text-forest-muted">Test reference: {selected.reference}</p><p className="text-xs text-forest-muted">Created {new Date(selected.created_at).toLocaleString('en-ZM')}. Test fee: {formatCurrency(0,selected.currency)}.</p>{mode!=='admin'&&<Link className="inline-flex items-center gap-2 text-sm font-semibold text-forest underline" to={sourcePath(selected,mode)}>Open {kindLabels[selected.kind].toLowerCase()}<WorkflowIcon name="arrowRight" className="h-4 w-4"/></Link>}</div>}
     {failure&&<p className="mt-4 text-sm text-red-700" role="alert">{failure}</p>}
    </>}</DialogBody>
    <DialogFooter className="flex-wrap gap-2">
     {action ? <><Button variant="secondary" disabled={busy} onClick={()=>setAction('')}>Back</Button><Button variant={action==='refund'||action==='report_problem'?'danger':'primary'} disabled={busy||(needsReason&&reason.trim().length<10)} aria-busy={busy} onClick={()=>void perform()}>{busy?'Saving…':labels[action]}</Button></> : <>
      <Button variant="secondary" onClick={()=>setSelected(null)}>Close</Button>
      {selected?.collection==='successful'&&selected.state==='held'&&mode==='customer'&&<>{!selected.problem&&!selected.receipt_confirmed&&selected.delivered&&<Button onClick={()=>startAction(selected,'confirm_receipt')}>Confirm receipt</Button>}<Button variant="danger" onClick={()=>startAction(selected,'report_problem')}>Report a problem</Button></>}
      {selected?.collection==='successful'&&mode==='admin'&&<>{selected.state==='held'&&<><Button variant="danger" onClick={()=>startAction(selected,'refund')}>Simulate full refund</Button>{selected.delivered&&(selected.receipt_confirmed||selected.problem)&&<Button onClick={()=>startAction(selected,selected.problem?'resolve_release':'release')}>{selected.problem?'Resolve case':'Simulate release'}</Button>}</>}{selected.state==='released'&&<Button onClick={()=>startAction(selected,'payout')}>Simulate payout</Button>}</>}
     </>}
    </DialogFooter>
   </DialogContent>
  </Dialog>
 </PageRoot>;
}
export function MerchantSettlementRehearsalPage(){const {selectedStoreId}=useMarketplace();return <SettlementRehearsalPage mode="merchant" storeId={selectedStoreId??undefined}/>;}
