import { userMessage } from '@/lib/userMessage';
import { ReferencePhotoField, ReferencePhotoPreviews, RequestReferencePhotos } from '@/components/common/ReferencePhotos';
import { useCustomerWorkflowList } from '@/hooks/useCustomerWorkflowList';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { customerApi, StorefrontService } from '@/lib/api/services';
import { ErrorState } from '@/components/common/ErrorState';
import { CustomerWorkflowList } from '@/components/common/CustomerWorkflowList';
import { workflowDate, workflowGroup } from '@/lib/workflowView';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { WorkflowDetailPage, WorkflowDetailBody, WorkflowDetailContent, WorkflowDetailFooter, WorkflowDetailHeader, WorkflowDetailTitle } from '@/components/common/WorkflowDetailPage';
import { notifyActivityChanged } from '@/hooks/useActivityCounts';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { WorkflowPageHeader, WorkflowEmpty } from '@/components/common/WorkflowVisuals';
import { WorkflowPaymentPanel } from '@/components/common/WorkflowPaymentPanel';
import type { Store } from '@/types/store';

type CustomOrder = {
  id: string; store_id: string; title: string; status: string; currency: string;
  order_kind: string; fulfilment_method: string; deposit_amount: string; balance_amount: string;
  offer_status: string; subtotal_amount: string; delivery_fee_amount: string; offer_note?: string; created_at?: string;
};

const storeSearchTerms: Record<string, string> = {
  CAKE_MAKER: 'cake birthday cake wedding cake custom cake baked goods bakery',
  BOUTIQUE: 'clothing clothes fashion dress shirts tailoring accessories',
  FASHION: 'clothing clothes fashion dress shirts tailoring accessories',
  CAFE: 'food catering baked goods cakes pastries',
  WHOLESALER: 'wholesale bulk groceries grocery supplies distributor building materials',
  HARDWARE: 'hardware building materials tools construction supplies wholesale bulk',
};

function matchesNeed(store: Store, query: string) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const searchable = `${store.name} ${store.description ?? ''} ${store.store_type?.replaceAll('_', ' ') ?? ''} ${storeSearchTerms[store.store_type ?? ''] ?? ''}`.toLowerCase();
  return terms.every(term => searchable.includes(term));
}

export default function CustomerCustomOrdersPage() {
  const [params] = useSearchParams();
  const { records: orders, total, loading, error, retry, selectedId, setSelectedId, active: selected, detailLoading, detailError, query, setQuery, page, setPage, pageSize } = useCustomerWorkflowList<CustomOrder>(customerApi.listCustomOrders, 'custom_orders');
  const { data: storesData, loading: storesLoading, error: storesError, retry: retryStores } = useFetchWrapper(() => StorefrontService.listStores(), []);
  const stores: Store[] = useMemo(() => Array.isArray(storesData) ? storesData : [], [storesData]);
  const [storeId, setStoreId] = useState(params.get('store') ?? '');
  const [view, setView] = useState<'requests' | 'new'>(params.get('store') || params.get('view') === 'new' ? 'new' : 'requests');
  const [businessQuery, setBusinessQuery] = useState('');
  const [step, setStep] = useState(0);
  const [businessPage, setBusinessPage] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [offerDecision, setOfferDecision] = useState<boolean | null>(null);
  const [kind, setKind] = useState<'made_to_order' | 'wholesale'>(params.get('kind') === 'wholesale' ? 'wholesale' : 'made_to_order');
  const eligibleStores = useMemo(() => stores.filter(store => kind === 'wholesale'
    ? ['WHOLESALER', 'HARDWARE'].includes(store.store_type ?? '')
    : ['CAKE_MAKER', 'BOUTIQUE', 'FASHION', 'CAFE'].includes(store.store_type ?? '')), [stores, kind]);
  const matchingStores = eligibleStores.filter(store => matchesNeed(store, businessQuery));
  const providerPageCount = Math.max(1, Math.ceil(matchingStores.length / 6));
  const providerPage = Math.min(businessPage, providerPageCount - 1);
  const providerChoices = matchingStores.slice(providerPage * 6, (providerPage + 1) * 6);
  const selectedStore = eligibleStores.find(store => store.id === storeId);
  const business = (order: CustomOrder) => stores.find(store => store.id === order.store_id)?.name ?? 'Business';
  const visible = orders;
  const [title, setTitle] = useState(params.get('item') ?? '');
  const [details, setDetails] = useState('');
  const [referencePhotos, setReferencePhotos] = useState<File[]>([]);
  const [quantity, setQuantity] = useState('');
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [neededBy, setNeededBy] = useState('');
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  const [paidDeposits, setPaidDeposits] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!storeId && eligibleStores.length === 1) setStoreId(eligibleStores[0].id);
  }, [storeId, eligibleStores]);

  useEffect(() => { if (view === 'new') headingRef.current?.focus(); }, [step, view]);

  function continueRequest() {
    setFeedback(null);
    if (step === 0 && !selectedStore) {
      setFeedback({ text: 'Choose a business below to receive your request.', error: true });
      formRef.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
      return;
    }
    if (!formRef.current?.reportValidity()) return;
    if (step === 1 && (!title.trim() || !details.trim())) {
      setFeedback({ text: 'Add the item and its specifications so the business can price your request.', error: true });
      formRef.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(!title.trim() ? 'input' : 'textarea')?.focus();
      return;
    }
    if (step === 1 && kind === 'wholesale' && (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0)) {
      setFeedback({ text: 'Enter a quantity greater than zero.', error: true }); return;
    }
    setStep(value => Math.min(value + 1, 2));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working) return;
    if (step < 2) { continueRequest(); return; }
    setFeedback(null);
    if (!selectedStore || !title.trim() || !details.trim()) { setFeedback({ text: 'Check the business and specifications before sending.', error: true }); setStep(0); return; }
    if (method === 'delivery' && (!address.trim() || !city.trim())) { setFeedback({ text: 'Add a delivery address and city.', error: true }); return; }
    setWorking(true);
    try {
      await customerApi.createCustomOrder(storeId, {
        order_kind: kind, title: title.trim(),
        specification: { details: details.trim(), ...(kind === 'wholesale' && quantity ? { quantity } : {}), ...(neededBy ? { needed_by: neededBy } : {}) },
        fulfilment_method: method,
        ...(method === 'delivery' ? { delivery_address: { line1: address.trim(), city: city.trim() } } : {}),
      }, referencePhotos);
      setTitle(''); setDetails(''); setQuantity(''); setAddress(''); setCity(''); setNeededBy(''); setStep(0);
      setReferencePhotos([]);
      setFeedback({ text: 'Request sent. Agree on the price with the business before work begins; you can track progress here.', error: false });
      notifyActivityChanged(); setView('requests');
      // A list refresh failure must not turn a saved request into a failed send.
      // The list owns its error and retry control; never ask for another POST.
      await retry().catch(() => {});
    } catch (err) {
      setFeedback({ text: userMessage(err, 'Could not send the request. Please try again.'), error: true });
    } finally { setWorking(false); }
  }

  async function respond(id: string, accept: boolean) {
    setWorking(true); setFeedback(null);
    try { await customerApi.respondToCustomOrderOffer(id, accept); await retry(); setOfferDecision(null); if (!accept) setSelectedId(null); setFeedback({ text: accept ? 'Price accepted. Pay below before work begins.' : 'Price declined. The business can send you a revised offer.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not save your decision.'), error: true }); }
    finally { setWorking(false); }
  }

  return <main className={`workflow-page${selectedId ? ' is-detail-view' : ''}`}>
    <WorkflowPageHeader kind="request" title="Custom & bulk requests" description="Made your way, or supplied in quantity. Share what you need, review the price and follow the work." />
    {feedback && !selectedId && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}
    <div className="booking-view-switch" role="group" aria-label="Custom request view"><button type="button" aria-pressed={view === 'requests'} onClick={() => setView('requests')}><WorkflowIcon name="package" />My requests</button><button type="button" aria-pressed={view === 'new'} onClick={() => setView('new')}><WorkflowIcon name="plus" />New request</button></div>
    <div className="workflow-layout booking-single-layout">
      {view === 'new' && <section className="workflow-panel" aria-labelledby="request-heading">
        <div className="workflow-panel-heading"><h2 id="request-heading">New request</h2><p>Your account details are included automatically.</p></div>
        <ol className="booking-steps" aria-label="Request progress">{['Business', 'Specifications', 'Review & delivery'].map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={step === index ? 'is-current' : step > index ? 'is-done' : ''}><span>{step > index ? <WorkflowIcon name="check" size={12} /> : index + 1}</span>{label}</li>)}</ol>
        <form ref={formRef} onSubmit={submit} className="workflow-form booking-wizard-form">
          <div className="booking-step-intro"><p className="workflow-eyebrow">Step {step + 1} of 3</p><h3 ref={headingRef} tabIndex={-1}>{step === 0 ? 'Who can help with your request?' : step === 1 ? 'Tell us what you need' : 'Check the details before sending'}</h3><p>{step === 0 ? 'Search by item, service or business. You do not need to know the name.' : step === 1 ? 'Include the information the business needs to prepare an accurate price.' : 'No payment is taken now. The business will send a price for you to review.'}</p></div>
          {step === 0 && <>
          <fieldset className="workflow-choice"><legend>What are you requesting?</legend>
            <label><input type="radio" name="order-kind" checked={kind === 'made_to_order'} onChange={() => { setKind('made_to_order'); setStoreId(''); setBusinessPage(0); }} /> Made for me</label>
            <label><input type="radio" name="order-kind" checked={kind === 'wholesale'} onChange={() => { setKind('wholesale'); setStoreId(''); setBusinessPage(0); }} /> Bulk quantity</label>
          </fieldset>
          {selectedStore && <p className="workflow-selection-note"><WorkflowIcon name="check" /><span>{params.get('store') === storeId ? 'Selected from marketplace: ' : 'Selected: '}<strong>{selectedStore.name}</strong>. You can choose another business below.</span></p>}
          <label>Find an item or business<input type="search" value={businessQuery} onChange={e => { setBusinessQuery(e.target.value); setBusinessPage(0); }} placeholder={kind === 'wholesale' ? 'Try bulk groceries, building materials or a business' : 'Try birthday cake, clothing or a business'} /></label>
          <div className="booking-picker-heading"><h3>Choose a business</h3><span role="status">{storesLoading ? 'Searching…' : `${matchingStores.length} matches`}</span></div>
          {storesLoading ? <div className="booking-skeleton-list" role="status" aria-label="Loading businesses"><span /><span /></div> : storesError ? <ErrorState error={storesError} onRetry={retryStores} title="Could not load businesses" /> : providerChoices.length ? <ul className="booking-provider-list">{providerChoices.map(store => <li key={store.id}><button type="button" className="booking-provider-row" aria-pressed={store.id === storeId} onClick={() => setStoreId(store.id)}><span className="booking-provider-glyph"><WorkflowIcon name="package" /></span><span className="booking-provider-main"><strong>{store.name}</strong><small>{store.description || (kind === 'wholesale' ? 'Bulk supply and quantity requests' : 'Made to your specifications')}</small></span><span className="booking-provider-meta"><strong>Price after offer</strong><small>{store.id === storeId ? 'Selected' : 'Choose business'}</small></span></button></li>)}</ul> : <div className="workflow-empty"><p>No businesses match that need yet. Try a broader term.</p>{businessQuery && <button type="button" className="workflow-text-action" onClick={() => setBusinessQuery('')}>Clear search</button>}</div>}
          {providerPageCount > 1 && <nav className="booking-pagination !p-0" aria-label="Request provider pages"><span>Page {providerPage + 1} of {providerPageCount}</span><div><button type="button" disabled={providerPage === 0} onClick={() => setBusinessPage(providerPage - 1)}>Previous</button><button type="button" disabled={providerPage + 1 >= providerPageCount} onClick={() => setBusinessPage(providerPage + 1)}>Next</button></div></nav>}
          </>}
          {step === 1 && <>
          <label>What do you need?<input required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} placeholder={kind === 'wholesale' ? 'e.g. Branded work shirts' : 'e.g. Birthday cake'} /></label>
          {kind === 'wholesale' && <label>Quantity<input required inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,3})?" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="e.g. 100" /></label>}
          <label>Details<textarea required value={details} onChange={e => setDetails(e.target.value)} rows={4} placeholder="Size, colour, materials, timing or anything the business needs to know" /></label>
          <ReferencePhotoField files={referencePhotos} onChange={setReferencePhotos} disabled={working} />
          <label>Needed by <small>(optional)</small><input type="date" value={neededBy} onChange={e => setNeededBy(e.target.value)} /><small>The business will confirm whether it can meet this date.</small></label>
          </>}
          {step === 2 && <>
          {referencePhotos.length > 0 && <section className="reference-photos"><h3>Reference photos</h3><p className="reference-photo-hint">These samples will be sent with your request.</p><ReferencePhotoPreviews files={referencePhotos} /></section>}
          <dl className="booking-review"><div><dt>Business</dt><dd>{selectedStore?.name}</dd></div><div><dt>Request</dt><dd>{title}</dd></div>{kind === 'wholesale' && <div><dt>Quantity</dt><dd>{quantity}</dd></div>}<div><dt>Specifications</dt><dd>{details}</dd></div>{neededBy && <div><dt>Needed by</dt><dd>{new Date(`${neededBy}T12:00:00`).toLocaleDateString(undefined, { dateStyle: 'long' })}</dd></div>}<div><dt>Price</dt><dd>The business will send an offer</dd></div></dl>
          <fieldset className="workflow-choice"><legend>How would you like to receive it?</legend>
            <label><input type="radio" name="fulfilment" checked={method === 'pickup'} onChange={() => setMethod('pickup')} /> Pick up</label>
            <label><input type="radio" name="fulfilment" checked={method === 'delivery'} onChange={() => setMethod('delivery')} /> Delivery</label>
          </fieldset>
          {method === 'delivery' && <div className="workflow-fields"><label>Delivery address<input required autoComplete="street-address" value={address} onChange={e => setAddress(e.target.value)} /></label><label>City<input required autoComplete="address-level2" value={city} onChange={e => setCity(e.target.value)} /></label></div>}
          </>}
          <div className="booking-step-actions">{step > 0 && <button type="button" className="booking-back-button" disabled={working} onClick={() => { setFeedback(null); setStep(value => value - 1); }}>Back</button>}<button className="workflow-primary" type="submit" disabled={working} aria-busy={working}>{working ? 'Sending…' : step === 2 ? 'Send request' : step === 1 ? 'Review request' : 'Continue to specifications'}<WorkflowIcon name="arrowRight" /></button></div>
        </form>
      </section>}
      {view === 'requests' && <section className="workflow-panel" aria-labelledby="orders-heading"><div className="workflow-panel-heading"><h2 id="orders-heading">Your requests</h2><p>Track the price and progress. Open a request for details and options.</p></div><div className="booking-toolbar"><label htmlFor="custom-request-search"><WorkflowIcon name="search" size={16} />Find a request</label><input id="custom-request-search" name="custom-request-search" autoComplete="off" type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Search by item, business or status" /><span>{total} {total === 1 ? 'request' : 'requests'}</span></div>
        <CustomerWorkflowList label="requests" valueHeading="Price" loading={loading} error={error} onRetry={retry} paginated={total > pageSize} onOpen={setSelectedId}
          items={visible.map(order => {
            const format = (amount: number | string) => new Intl.NumberFormat('en-ZM', { style: 'currency', currency: order.currency || 'ZMW' }).format(Number(amount));
            const amount = format(Number(order.subtotal_amount) + Number(order.delivery_fee_amount));
            return {
              id: order.id, title: order.title, context: business(order), date: workflowDate(order.created_at), status: order.status,
              value: order.offer_status === 'unpriced' ? 'Awaiting price' : order.offer_status === 'offered' ? `Offered: ${amount}` : order.offer_status === 'accepted' ? `Agreed: ${amount}` : 'Price declined',
              group: workflowGroup(order.status, order.offer_status === 'offered'), actionLabel: order.offer_status === 'offered' ? 'Review offer' : 'View details', description: order.offer_note,
              facts: [
                { label: 'Business', value: business(order) },
                { label: 'Request type', value: order.order_kind === 'wholesale' ? 'Bulk supply' : 'Made to order' },
                { label: 'Fulfilment', value: order.fulfilment_method === 'delivery' ? 'Delivery' : 'Pick up' },
                ...(order.offer_status !== 'unpriced' && order.offer_status !== 'rejected' ? [
                  { label: 'Deposit amount', value: format(order.deposit_amount) },
                  { label: 'Balance amount', value: format(order.balance_amount) },
                ] : []),
              ],
            };
          })}
          empty={<WorkflowEmpty kind="request" title={query ? 'No matching requests' : 'Something made just for you'} description={query ? 'Try another item, business or status.' : 'Send your specifications to a business, then review its offer here.'}>{!query && <button className="workflow-primary" type="button" onClick={() => setView('new')}><WorkflowIcon name="plus" /> New request</button>}</WorkflowEmpty>} />
        {total > pageSize && <nav className="booking-pagination" aria-label="Request pages"><span>Page {page + 1} of {Math.ceil(total / pageSize)}</span><div><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={(page + 1) * pageSize >= total} onClick={() => setPage(page + 1)}>Next</button></div></nav>}
      </section>}
    </div>
    <WorkflowDetailPage open={Boolean(selectedId)} loading={detailLoading} available={Boolean(selected)} error={detailError} busy={working} onOpenChange={open => { if (!open) setSelectedId(null); }}><WorkflowDetailContent aria-describedby="custom-detail-description"><WorkflowDetailHeader><WorkflowDetailTitle>{selected?.title ?? 'Request details'}</WorkflowDetailTitle></WorkflowDetailHeader>{selected && <WorkflowDetailBody className="booking-detail-body"><div className="workflow-detail !p-0">{feedback && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}<p id="custom-detail-description">{business(selected)} · {selected.order_kind === 'wholesale' ? 'Bulk order' : 'Made to order'} · {selected.fulfilment_method === 'delivery' ? 'Delivery' : 'Pickup'}</p><div className="workflow-status-row"><StatusBadge status={selected.status} /></div><RequestReferencePhotos key={selected.id} orderId={selected.id} /><section><h3>Price</h3><p>Goods or service: {new Intl.NumberFormat('en-ZM', { style: 'currency', currency: selected.currency }).format(Number(selected.subtotal_amount))}</p><p>Delivery: {new Intl.NumberFormat('en-ZM', { style: 'currency', currency: selected.currency }).format(Number(selected.delivery_fee_amount))}</p><p>{Number(selected.deposit_amount) > 0 ? `Deposit ${selected.deposit_amount} · Later balance ${selected.balance_amount}` : 'Full price due before work begins'}</p>{selected.offer_note && <p>{selected.offer_note}</p>}</section>{selected.offer_status === 'unpriced' && <p>Waiting for the business to send a price.</p>}{selected.offer_status === 'accepted' && <p>Price agreed. Pay the first stage before production or allocation begins. Any balance is due before handover.</p>}{selected.offer_status === 'rejected' && <p>Price declined. The business can send a revision.</p>}{selected.offer_status === 'offered' && <><p className="workflow-help">Accepting confirms the price, but does not take payment.</p><div className="workflow-actions"><button type="button" className="workflow-primary" disabled={working} onClick={() => setOfferDecision(true)}>Accept price</button><button type="button" className="workflow-text-action" disabled={working} onClick={() => setOfferDecision(false)}>Decline</button></div></>}</div></WorkflowDetailBody>}<WorkflowDetailFooter className="booking-detail-footer">{selected?.offer_status === 'accepted' && (paidDeposits.has(selected.id) && Number(selected.deposit_amount) > 0 && Number(selected.balance_amount) > 0 ? <WorkflowPaymentPanel kind="custom_order" sourceId={selected.id} stage="balance" label="Pay remaining balance" compact /> : <WorkflowPaymentPanel kind="custom_order" sourceId={selected.id} stage="deposit" label={Number(selected.deposit_amount) > 0 ? 'Pay deposit' : 'Pay full price'} onPaid={() => setPaidDeposits(previous => new Set(previous).add(selected.id))} compact />)}<div className="booking-detail-footer-actions"><button type="button" className="booking-back-button" onClick={() => setSelectedId(null)}>Close</button></div></WorkflowDetailFooter></WorkflowDetailContent></WorkflowDetailPage>
    <ConfirmDialog open={offerDecision !== null} title={offerDecision ? 'Accept this price?' : 'Decline this price?'} description={selected ? `${selected.title}: ${new Intl.NumberFormat('en-ZM', { style: 'currency', currency: selected.currency }).format(Number(selected.subtotal_amount) + Number(selected.delivery_fee_amount))}. ${offerDecision ? 'This confirms the price, but does not collect payment.' : 'The business may send a revised offer.'}` : undefined} confirmLabel={offerDecision ? 'Accept price' : 'Decline price'} cancelLabel="Keep reviewing" tone={offerDecision ? 'primary' : 'danger'} busy={working} onCancel={() => setOfferDecision(null)} onConfirm={() => { if (selected && offerDecision !== null) void respond(selected.id, offerDecision); }} />
  </main>;
}
