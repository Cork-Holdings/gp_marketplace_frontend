import { userMessage } from '@/lib/userMessage';
import { useCustomerWorkflowList } from '@/hooks/useCustomerWorkflowList';
import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ServiceInquiryDialog } from '@/components/quotes/ServiceInquiryDialog';
import { useAuth } from '@/lib/context/useAuth';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { customerApi, StorefrontService } from '@/lib/api/services';
import { StatusBadge } from '@/components/common/StatusBadge';
import { CustomerWorkflowList } from '@/components/common/CustomerWorkflowList';
import { workflowDate, workflowGroup } from '@/lib/workflowView';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { WorkflowDetailPage, WorkflowDetailBody, WorkflowDetailContent, WorkflowDetailFooter, WorkflowDetailHeader, WorkflowDetailTitle } from '@/components/common/WorkflowDetailPage';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { WorkflowPageHeader, WorkflowEmpty } from '@/components/common/WorkflowVisuals';
import { WorkflowPaymentPanel } from '@/components/common/WorkflowPaymentPanel';
import type { ServiceQuote } from '@/types/serviceQuote';
import type { Store } from '@/types/store';

const money = (value: string | number | undefined, currency = 'ZMW') =>
  new Intl.NumberFormat('en-ZM', { style: 'currency', currency }).format(Number(value || 0));

export default function CustomerServiceQuotesPage() {
  const { hasRole, isAuthenticated } = useAuth();
  const customer = hasRole('customer');
  const { records: quotes, total, loading, error, retry, selectedId, setSelectedId, active, detailLoading, detailError, query, setQuery, page, setPage, pageSize } = useCustomerWorkflowList<ServiceQuote>(customerApi.listServiceQuotes, 'service_quotes', isAuthenticated && customer);
  const { data: storeData } = useFetchWrapper(() => StorefrontService.listStores(), []);
  const stores: Store[] = Array.isArray(storeData) ? storeData : [];
  const [params, setParams] = useSearchParams();
  const [requesting, setRequesting] = useState(params.get('request') === '1');
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!customer) return <Navigate to="/portal" replace />;

  const business = (quote: ServiceQuote) => quote.store_name || stores.find(store => store.id === quote.store_id)?.name || 'Business';
  const visible = quotes;
  async function decide(status: 'accepted' | 'rejected') {
    if (!active) return; setWorking(true); setFeedback(null);
    try { await customerApi.updateServiceQuoteStatus(active.id, status); await retry(); setDecision(null); if (status === 'rejected') setSelectedId(''); setFeedback({ text: status === 'accepted' ? 'Estimate accepted. Pay below before the business starts work.' : 'Estimate declined. The business can see your decision.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not update this estimate.'), error: true }); }
    finally { setWorking(false); }
  }
  return <main className={`workflow-page${selectedId || requesting ? ' is-detail-view' : ''}`}><WorkflowPageHeader kind="estimate" title="Quotes & estimates" description="Know the cost before work begins. Review labour, materials and other charges in one clear breakdown."><button className="workflow-primary mt-4" type="button" onClick={() => setRequesting(true)}><WorkflowIcon name="plus" /> Request an estimate</button></WorkflowPageHeader>
    {feedback && !selectedId && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}
    <section className="workflow-panel" aria-labelledby="quote-list-heading"><div className="workflow-panel-heading"><h2 id="quote-list-heading">Your estimates</h2><p>Search, open a breakdown, then decide when you are ready.</p></div><div className="booking-toolbar"><label htmlFor="quote-search"><WorkflowIcon name="search" size={16} />Find an estimate</label><input id="quote-search" name="quote-search" autoComplete="off" type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Search by service, business or status" /><span>{total} {total === 1 ? 'estimate' : 'estimates'}</span></div>
    <CustomerWorkflowList label="estimates" loading={loading} error={error} onRetry={retry} paginated={total > pageSize} onOpen={setSelectedId}
      items={visible.map(quote => ({
        id: quote.id, title: quote.title, reference: quote.quote_number ? `Estimate #${quote.quote_number}` : undefined,
        context: business(quote), date: workflowDate(quote.created_at), status: quote.status,
        value: quote.status === 'draft' && !quote.lines?.length ? 'Awaiting estimate' : money(quote.total, quote.currency),
        group: workflowGroup(quote.status, quote.status === 'sent'), actionLabel: quote.status === 'sent' ? 'Review estimate' : 'View breakdown',
        description: quote.description,
        facts: [
          { label: 'Business', value: business(quote) },
          { label: 'Requested', value: workflowDate(quote.created_at) },
          ...(quote.expires_at ? [{ label: 'Respond by', value: workflowDate(quote.expires_at, true) }] : []),
          ...(quote.service_address?.line1 ? [{ label: 'Service location', value: quote.service_address.line1 }] : []),
        ],
      }))}
      empty={<WorkflowEmpty kind="estimate" title={query ? 'No matching estimates' : 'Start with a clear estimate'} description={query ? 'Try another service, business or status.' : 'Explain what you need. The provider will send an itemised price for you to review.'} />} />
    {total > pageSize && <nav className="booking-pagination" aria-label="Estimate pages"><span>Page {page + 1} of {Math.ceil(total / pageSize)}</span><div><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)}>Next</button></div></nav>}</section>
    <WorkflowDetailPage open={Boolean(selectedId)} loading={detailLoading} available={Boolean(active)} error={detailError} busy={working} onOpenChange={open => { if (!open) setSelectedId(''); }}><WorkflowDetailContent aria-describedby="quote-detail-description"><WorkflowDetailHeader><WorkflowDetailTitle>{active?.title ?? 'Estimate details'}</WorkflowDetailTitle></WorkflowDetailHeader>
      {active && <WorkflowDetailBody className="booking-detail-body"><div className="workflow-detail !p-0"><p id="quote-detail-description" className="workflow-help">{business(active)} · Quote #{active.quote_number ?? '—'}</p>{feedback?.error && <p role="alert" className="workflow-feedback is-error">{feedback.text}</p>}<div className="workflow-quote-summary"><StatusBadge status={active.status} /><strong>{active.status === 'draft' && !active.lines?.length ? 'Awaiting estimate' : money(active.total, active.currency)}</strong></div>{active.description && <p>{active.description}</p>}
        <section aria-labelledby="charges-heading">{active.status === 'draft' && !active.lines?.length && <p className="workflow-feedback">Your request has reached the provider. No price has been agreed and no payment is due yet.</p>}<h3 id="charges-heading">Charges</h3><div className="workflow-charge-list">{active.lines?.map((line, index) => <div className="workflow-charge" key={line.id ?? index}><div><span className="workflow-charge-kind">{line.line_type}</span><strong>{line.description}</strong><small>{line.quantity} × {money(line.unit_price, active.currency)}</small></div><b>{money(line.line_total ?? line.total ?? Number(line.quantity) * Number(line.unit_price), active.currency)}</b></div>)}</div>{Boolean(active.lines?.length) && <div className="workflow-charge-total"><span>Total estimate</span><strong>{money(active.total, active.currency)}</strong></div>}</section>
        {active.service_address?.line1 && <p><b>Service location</b><br />{active.service_address.line1}{active.service_address.city ? `, ${active.service_address.city}` : ''}</p>}
        {active.expires_at && <p>Respond by {new Date(active.expires_at).toLocaleString()}</p>}
        {active.status === 'sent' && <div className="workflow-actions"><button className="workflow-primary" type="button" disabled={working} onClick={() => setDecision('accepted')}>Accept estimate</button><button className="workflow-text-action" type="button" disabled={working} onClick={() => setDecision('rejected')}>Decline</button></div>}
        {active.status === 'accepted' && <p className="workflow-feedback">Price agreed. Full payment is required before the business dispatches or starts work.</p>}
      </div></WorkflowDetailBody>}
      <WorkflowDetailFooter className="booking-detail-footer">{active?.status === 'accepted' && <WorkflowPaymentPanel kind="quote" sourceId={active.id} stage="full" label="Pay the accepted estimate" compact />}<div className="booking-detail-footer-actions"><button type="button" className="booking-back-button" onClick={() => setSelectedId('')}>Close</button></div></WorkflowDetailFooter>
    </WorkflowDetailContent></WorkflowDetailPage>
    <ServiceInquiryDialog open={requesting} onClose={() => { setRequesting(false); if (params.has('request')) { const next = new URLSearchParams(params); next.delete('request'); setParams(next, { replace: true }); } }} stores={stores} initialStore={params.get('store') ?? ''} initialTitle={params.get('item') ?? ''} onCreated={quote => { setRequesting(false); void retry(); setSelectedId(quote.id); setFeedback({ text: 'Request sent. The provider will prepare an estimate for you to review.', error: false }); }} />
    <ConfirmDialog open={Boolean(decision)} title={decision === 'accepted' ? 'Accept this estimate?' : 'Decline this estimate?'} description={active ? `${active.title} totals ${money(active.total, active.currency)}. ${decision === 'accepted' ? 'Accepting confirms the price. Payment is a separate step before work begins.' : 'The business will see that you declined this price.'}` : undefined} confirmLabel={decision === 'accepted' ? 'Accept estimate' : 'Decline estimate'} cancelLabel="Keep reviewing" tone={decision === 'accepted' ? 'primary' : 'danger'} busy={working} onCancel={() => setDecision(null)} onConfirm={() => { if (decision) void decide(decision); }} />
  </main>;
}
