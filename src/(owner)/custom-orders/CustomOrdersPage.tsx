import { RecordListTable } from '@/components/common/RecordListTable';
import { userMessage } from '@/lib/userMessage';
import { RequestReferencePhotos } from '@/components/common/ReferencePhotos';
import { useWorkflowRecordSelection } from '@/hooks/useWorkflowRecordSelection';
import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { ownerApi } from '@/lib/api/services';
import { CustomerWorkflowList } from '@/components/common/CustomerWorkflowList';
import { workflowDate, workflowGroup } from '@/lib/workflowView';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useOwnerPaymentReadiness } from '@/hooks/useOwnerPaymentReadiness';
import { orderActionBlock } from '@/lib/workflowPrerequisites';
import './custom-order-detail.css';
import { WorkflowDetailPage, WorkflowDetailBody, WorkflowDetailContent, WorkflowDetailFooter, WorkflowDetailHeader, WorkflowDetailTitle } from '@/components/common/WorkflowDetailPage';

type Order = { id: string; title: string; status: string; order_kind: string; fulfilment_method: string; specification?: { details?: string; quantity?: string }; delivery_address?: { line1?: string; city?: string }; created_at: string; currency: string; offer_status: string; subtotal_amount: string; delivery_fee_amount: string; deposit_amount: string; balance_amount: string; offer_note?: string; offer_version: number };
type Line = { id: string; description: string; requested_quantity: string; fulfilled_quantity: string; status: string };

export default function CustomOrdersPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStoreId: storeId } = useMarketplace();
  const [params] = useSearchParams();
  const detailId = params.get('detail') ?? '';
  const { data, loading, error, retry } = useFetchWrapper(() => storeId ? ownerApi.listCustomOrders(storeId, { limit: 50, ...(detailId ? { id: detailId } : {}) }) : Promise.resolve({ custom_orders: [] }), [storeId, detailId], { enabled: Boolean(storeId) });
  const orders: Order[] = data?.custom_orders ?? [];
  const { selectedId, setSelectedId } = useWorkflowRecordSelection(orders);
  const active = orders.find(order => order.id === selectedId);
  const payment = useOwnerPaymentReadiness(storeId, 'custom_order', active?.id);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const matching = orders.filter(order => `${order.title} ${order.status} ${order.order_kind} ${order.offer_status}`.toLowerCase().includes(query.trim().toLowerCase()));
  const visible = matching.slice(page * 6, (page + 1) * 6);
  const { data: lineData, retry: reloadLines } = useFetchWrapper(() => storeId && active ? ownerApi.listCustomOrderLines(storeId, active.id) : Promise.resolve([]), [storeId, active?.id], { enabled: Boolean(storeId && active) });
  const lines: Line[] = Array.isArray(lineData) ? lineData : lineData?.lines ?? [];
  const requestedUnits = Math.round(Number(active?.specification?.quantity ?? 0) * 1000);
  const allocatedUnits = lines.reduce((sum, line) => sum + Math.round(Number(line.requested_quantity) * 1000), 0);
  const remainingUnits = Math.max(0, requestedUnits - allocatedUnits);
  const remainingQuantity = remainingUnits / 1000;
  const bulkReady = lines.length > 0 && remainingUnits === 0 && lines.every(line => line.status === 'fulfilled');
  const block = (target: string) => orderActionBlock({ accepted: active?.offer_status === 'accepted', checking: payment.checking, readiness: payment.readiness, target, wholesale: active?.order_kind === 'wholesale', bulkReady });
  const amount = (value: number | string) => new Intl.NumberFormat('en-ZM', { style: 'currency', currency: active?.currency || 'ZMW' }).format(Number(value));
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [deposit, setDeposit] = useState('');
  const [offerNote, setOfferNote] = useState('');
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  const offerStatus = active?.offer_status;
  const offerSubtotal = active?.subtotal_amount;
  const offerDeliveryFee = active?.delivery_fee_amount;
  const offerDeposit = active?.deposit_amount;
  const currentOfferNote = active?.offer_note;
  useEffect(() => { setDescription(active?.title ?? ''); setQuantity(active?.specification?.quantity ?? ''); }, [active?.id, active?.title, active?.specification?.quantity]);
  useEffect(() => { setTotalPrice(offerStatus && offerStatus !== 'unpriced' ? String(Number(offerSubtotal) + Number(offerDeliveryFee)) : ''); setDeliveryFee(offerDeliveryFee ?? '0'); setDeposit(offerStatus === 'unpriced' ? '' : offerDeposit ?? ''); setOfferNote(currentOfferNote ?? ''); }, [active?.id, active?.offer_version, offerStatus, offerSubtotal, offerDeliveryFee, offerDeposit, currentOfferNote]);
  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  async function move(status: string) {
    if (!storeId || !active || working || block(status)) return; setWorking(true); setFeedback(null);
    try { await ownerApi.updateCustomOrderStatus(storeId, active.id, status); await retry(); setFeedback({ text: 'Order progress updated.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not update this order.'), error: true }); }
    finally { setWorking(false); }
  }
  async function sendOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!storeId || !active) return;
    const totalMinor = Math.round(Number(totalPrice) * 100);
    const feeMinor = active.fulfilment_method === 'delivery' ? Math.round(Number(deliveryFee) * 100) : 0;
    const depositMinor = Math.round(Number(deposit || '0') * 100);
    if (!Number.isSafeInteger(totalMinor) || totalMinor <= 0 || !Number.isSafeInteger(feeMinor) || feeMinor < 0 || feeMinor > totalMinor || !Number.isSafeInteger(depositMinor) || depositMinor < 0 || depositMinor > totalMinor) {
      setFeedback({ text: 'Enter a positive total. Delivery and deposit cannot exceed it.', error: true }); return;
    }
    const amount = (minor: number) => (minor / 100).toFixed(2);
    setWorking(true); setFeedback(null);
    try {
      await ownerApi.offerCustomOrder(storeId, active.id, { subtotal_amount: amount(totalMinor - feeMinor), delivery_fee_amount: amount(feeMinor), deposit_amount: amount(depositMinor), balance_amount: amount(totalMinor - depositMinor), note: offerNote.trim() });
      await retry(); setFeedback({ text: 'Price sent to the customer for approval.', error: false });
    } catch (err) { setFeedback({ text: userMessage(err, 'Could not send the price.'), error: true }); }
    finally { setWorking(false); }
  }
  async function addLine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!storeId || !active || working || block('allocated')) return; setWorking(true); setFeedback(null);
    try { await ownerApi.addCustomOrderLine(storeId, active.id, { description: description.trim(), requested_quantity: quantity }); await reloadLines(); const nextUnits = remainingUnits - Math.round(Number(quantity) * 1000); setQuantity(nextUnits > 0 ? String(nextUnits / 1000) : ''); setFeedback({ text: 'Fulfilment line added.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not add this line.'), error: true }); }
    finally { setWorking(false); }
  }
  async function updateLine(line: Line, fulfilled: string) {
    if (!storeId || !active || working || block('allocated')) return; setWorking(true); setFeedback(null);
    try { const complete = Number(fulfilled) === Number(line.requested_quantity); await ownerApi.allocateCustomOrderLine(storeId, active.id, line.id, { fulfilled_quantity: fulfilled, status: complete ? 'fulfilled' : 'partially_fulfilled' }); if (!complete && active.status === 'allocated') { await ownerApi.updateCustomOrderStatus(storeId, active.id, 'partially_fulfilled'); await retry(); } await reloadLines(); setFeedback({ text: 'Fulfilled quantity recorded.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not record this quantity.'), error: true }); }
    finally { setWorking(false); }
  }
  return <div className={`workflow-page${selectedId ? ' is-detail-view' : ''}`}><header className="workflow-header"><p className="workflow-eyebrow">Operations</p><h1>Custom & bulk orders</h1><p>Move made-to-order work through production and track partial quantities for bulk supply.</p></header>
    {feedback && !selectedId && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}
    <section className="workflow-panel" aria-labelledby="order-queue-heading"><div className="workflow-panel-heading"><h2 id="order-queue-heading">Requests</h2><p>Find a request, then open its price and fulfilment controls.</p></div><div className="booking-toolbar"><label htmlFor="owner-custom-search">Find a request</label><input id="owner-custom-search" type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Search item, type or status" /><span>{matching.length} {matching.length === 1 ? 'request' : 'requests'}</span></div>
      <CustomerWorkflowList label="requests" contextHeading="Type" valueHeading="Price" loading={loading} error={error} onRetry={retry} paginated={matching.length > 6} onOpen={setSelectedId}
        items={visible.map(order => ({
          id: order.id, title: order.title, context: order.order_kind === 'wholesale' ? 'Bulk supply' : 'Made to order',
          date: workflowDate(order.created_at), status: order.status,
          value: order.offer_status === 'unpriced' ? 'Price needed' : order.offer_status === 'rejected' ? 'Price declined' : new Intl.NumberFormat('en-ZM', { style: 'currency', currency: order.currency || 'ZMW' }).format(Number(order.subtotal_amount) + Number(order.delivery_fee_amount)),
          group: workflowGroup(order.status, ['unpriced', 'rejected'].includes(order.offer_status) || order.status === 'ready' || order.status === 'backordered'),
          actionLabel: 'Manage request', description: order.specification?.details,
          facts: [
            { label: 'Price approval', value: order.offer_status === 'unpriced' ? 'Price needed' : order.offer_status === 'offered' ? 'Awaiting customer approval' : order.offer_status === 'accepted' ? 'Price agreed' : 'Price declined' },
            { label: 'Fulfilment', value: order.fulfilment_method === 'delivery' ? 'Delivery' : 'Pick up' },
            ...(order.specification?.quantity ? [{ label: 'Requested quantity', value: order.specification.quantity }] : []),
          ],
        }))}
        empty={<p className="workflow-empty">{query ? 'No requests match that search.' : 'No requests yet. Customer requests appear here automatically.'}</p>} />
      {matching.length > 6 && <nav className="booking-pagination" aria-label="Request pages"><span>Page {page + 1} of {Math.ceil(matching.length / 6)}</span><div><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={(page + 1) * 6 >= matching.length} onClick={() => setPage(page + 1)}>Next</button></div></nav>}</section>
    <WorkflowDetailPage open={Boolean(selectedId)} loading={loading} available={Boolean(active)} error={error} busy={working} onOpenChange={open => { if (!open) setSelectedId(''); }}><WorkflowDetailContent aria-describedby="owner-custom-description"><WorkflowDetailHeader><WorkflowDetailTitle>{active?.title ?? 'Request details'}</WorkflowDetailTitle></WorkflowDetailHeader>
      {active && <WorkflowDetailBody className="custom-order-detail"><div className="custom-detail-summary"><div><p id="owner-custom-description">{active.order_kind === 'wholesale' ? 'Bulk supply' : 'Made to order'} · {active.fulfilment_method === 'delivery' ? 'Delivery' : 'Pickup'}</p><p className="custom-detail-muted">Requested {workflowDate(active.created_at)}</p></div><StatusBadge status={active.status} /></div>
        {feedback && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}
        <div className="custom-detail-columns"><section className="custom-detail-section"><h2>Request details</h2><p>{active.specification?.details || 'No additional details supplied.'}</p>{active.delivery_address?.line1 && <dl className="custom-detail-facts"><div><dt>Delivery address</dt><dd>{active.delivery_address.line1}, {active.delivery_address.city}</dd></div></dl>}<RequestReferencePhotos key={active.id} orderId={active.id} storeId={storeId ?? undefined} />{active.offer_note && <dl className="custom-detail-facts"><div><dt>Agreed scope</dt><dd>{active.offer_note}</dd></div></dl>}</section>
        <section className="custom-detail-section custom-detail-payment"><h2>Price & payment</h2><dl className="custom-detail-facts"><div><dt>Price approval</dt><dd>{active.offer_status === 'accepted' ? 'Accepted by customer' : active.offer_status === 'offered' ? 'Awaiting customer approval' : active.offer_status === 'rejected' ? 'Declined by customer' : 'Not priced yet'}</dd></div>{active.offer_status !== 'unpriced' && <><div><dt>Total agreed price</dt><dd className="custom-detail-amount">{amount(Number(active.subtotal_amount) + Number(active.delivery_fee_amount))}</dd></div><div><dt>{Number(active.deposit_amount) > 0 ? 'Deposit' : 'Full payment'}</dt><dd><strong>{amount(Number(active.deposit_amount) > 0 ? active.deposit_amount : active.balance_amount)}</strong><span className="custom-detail-muted">{payment.checking ? 'Checking…' : payment.readiness?.first_confirmed ? 'Confirmed' : payment.readiness ? 'Awaiting payment' : 'Confirmation unavailable'}</span></dd></div>{Number(active.deposit_amount) > 0 && Number(active.balance_amount) > 0 && <div><dt>Remaining payment</dt><dd><strong>{amount(active.balance_amount)}</strong><span className="custom-detail-muted">{payment.checking ? 'Checking…' : payment.readiness?.balance_confirmed ? 'Confirmed' : payment.readiness ? 'Due before handover' : 'Confirmation unavailable'}</span></dd></div>}</>}</dl><button className="workflow-text-action" type="button" disabled={payment.checking} onClick={payment.refresh}>Refresh payment readiness</button></section></div>
        {active.status === 'pending' && active.offer_status !== 'accepted' && <section aria-labelledby="offer-heading">
          <details key={`${active.id}-${active.offer_version}`} open={active.offer_status === 'unpriced'} className="custom-price-editor">
          <summary id="offer-heading"><span>{active.offer_status === 'unpriced' ? 'Price this request' : 'Update price'}</span>{active.offer_status !== 'unpriced' && <strong>{amount(Number(active.subtotal_amount) + Number(active.delivery_fee_amount))}</strong>}</summary>
          <div className="custom-price-editor-body">
          <p className="workflow-help">The customer reviews your full price. Work can begin only after they accept and the required first payment is verified.</p>
          <form className="workflow-form" onSubmit={sendOffer}>
            <label>Total price ({active.currency})<input required type="number" min="0.01" step="0.01" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} /></label>
            {active.fulfilment_method === 'delivery' && <label>Delivery included in total<input type="number" min="0" step="0.01" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} /></label>}
            <label>Deposit due now (optional)<input type="number" min="0" step="0.01" value={deposit} onChange={e => setDeposit(e.target.value)} placeholder="0.00" /></label>
            <label>What does this include? (optional)<textarea rows={3} maxLength={2000} value={offerNote} onChange={e => setOfferNote(e.target.value)} placeholder="Materials, scope, collection or delivery timing" /></label>
            <button type="submit" className="workflow-primary" disabled={working} aria-busy={working}>{working ? 'Sending…' : active.offer_status === 'offered' ? 'Update price' : 'Send price'}</button>
          </form>
          </div></details>
          {active.offer_status === 'offered' && <p className="workflow-feedback">Awaiting customer approval. Updating the price replaces the offer they see.</p>}
          {active.offer_status === 'rejected' && <p className="workflow-feedback">The customer declined the price. You can revise it and send a new offer.</p>}
        </section>}
        {!['fulfilled', 'cancelled'].includes(active.status) && <section className="custom-detail-section custom-detail-next"><h2>Next step</h2>
          {active.status === 'pending' && <OrderAction label={active.order_kind === 'wholesale' ? 'Start allocation' : 'Start production'} reason={block('allocated')} working={working} onClick={() => move(active.order_kind === 'wholesale' ? 'allocated' : 'in_production')} />}
          {['allocated', 'in_production', 'partially_fulfilled'].includes(active.status) && <OrderAction label="Mark ready" reason={block('ready')} working={working} onClick={() => move('ready')} />}
          {active.order_kind === 'wholesale' && ['allocated', 'partially_fulfilled'].includes(active.status) && <button type="button" className="workflow-text-action" disabled={working || Boolean(block('backordered'))} onClick={() => move('backordered')}>Mark backordered</button>}
          {active.status === 'backordered' && <OrderAction label="Resume allocation" reason={block('allocated')} working={working} onClick={() => move('allocated')} />}
          {active.status === 'ready' && <OrderAction label="Mark handed over" reason={block('fulfilled')} working={working} onClick={() => move('fulfilled')} />}
        </section>}
        {active.order_kind === 'wholesale' && <section className="custom-detail-section" aria-labelledby="quantity-heading"><h2 id="quantity-heading">Quantities & fulfilment</h2><dl className="custom-quantity-summary"><div><dt>Requested</dt><dd>{active.specification?.quantity ?? '—'}</dd></div><div><dt>Allocated</dt><dd>{allocatedUnits / 1000}</dd></div><div><dt>Unallocated</dt><dd>{remainingQuantity}</dd></div></dl>{lines.length ? <div className="custom-quantity-table-wrap"><RecordListTable className="custom-quantity-table"><thead><tr><th>Item</th><th>Allocated</th><th>Fulfilled</th><th>Status</th></tr></thead><tbody>{lines.map(line => <tr key={line.id}><th scope="row"><strong>{line.description}</strong>{!['ready', 'fulfilled', 'cancelled'].includes(active.status) && <LineUpdate key={`${line.id}-${line.fulfilled_quantity}`} line={line} disabled={working || Boolean(block('allocated'))} onSave={updateLine} />}</th><td>{Number(line.requested_quantity)}</td><td>{Number(line.fulfilled_quantity)}</td><td><StatusBadge status={line.status} /></td></tr>)}</tbody></RecordListTable></div> : <p className="custom-detail-muted">No fulfilment lines yet.</p>}
          {!['ready', 'fulfilled', 'cancelled'].includes(active.status) && remainingQuantity > 0 && <><p className="workflow-help">{block('allocated') || 'Add the items you will supply, then record the fulfilled quantities.'}</p><form className="workflow-form" onSubmit={addLine}><label>Item<input required value={description} onChange={e => setDescription(e.target.value)} /></label><label>Quantity for this line<input required type="number" min="0.001" max={remainingQuantity} step="0.001" value={quantity} onChange={e => setQuantity(e.target.value)} /></label><button className="workflow-primary" type="submit" disabled={working || Boolean(block('allocated'))} aria-busy={working}>Add line</button></form></>}
        </section>}
      </WorkflowDetailBody>}<WorkflowDetailFooter><button type="button" className="booking-back-button" disabled={working} onClick={() => setSelectedId('')}>Close</button></WorkflowDetailFooter></WorkflowDetailContent></WorkflowDetailPage>
  </div>;
}

function OrderAction({ label, reason, working, onClick }: { label: string; reason: string | null; working: boolean; onClick: () => void }) {
  return <div className="custom-detail-action">{reason && <p className="custom-detail-prerequisite" role="status">{reason}</p>}<button type="button" className="workflow-primary" disabled={working || Boolean(reason)} title={reason || undefined} onClick={onClick}>{label}</button></div>;
}

function LineUpdate({ line, disabled, onSave }: { line: Line; disabled: boolean; onSave: (line: Line, quantity: string) => void }) {
  const [value, setValue] = useState(line.fulfilled_quantity);
  return <form className="workflow-line-form" onSubmit={event => { event.preventDefault(); onSave(line, value); }}><label>Fulfilled quantity<input required type="number" min="0.001" step="0.001" max={line.requested_quantity} value={value} onChange={event => setValue(event.target.value)} /></label><button type="submit" className="workflow-text-action" disabled={disabled || Number(value) === Number(line.fulfilled_quantity)}>Save quantity</button></form>;
}
