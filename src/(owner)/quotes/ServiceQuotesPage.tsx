import { userMessage } from '@/lib/userMessage';
import { useWorkflowRecordSelection } from '@/hooks/useWorkflowRecordSelection';
import { useMemo, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { ownerApi } from '@/lib/api/services';
import { CustomerWorkflowList } from '@/components/common/CustomerWorkflowList';
import { workflowDate, workflowGroup } from '@/lib/workflowView';
import { StatusBadge } from '@/components/common/StatusBadge';
import { WorkflowDetailPage, WorkflowDetailBody, WorkflowDetailContent, WorkflowDetailFooter, WorkflowDetailHeader, WorkflowDetailTitle } from '@/components/common/WorkflowDetailPage';
import { notifyActivityChanged } from '@/hooks/useActivityCounts';
import { StoreCategoryBadge } from '../stores/BranchSelector';
import type { ServiceQuote, ServiceQuoteLine, ServiceQuoteLineType } from '@/types/serviceQuote';

const emptyLine = (): ServiceQuoteLine => ({ line_type: 'labour', description: '', quantity: 1, unit_price: '' });
const money = (value: string | number | undefined, currency = 'ZMW') =>
  new Intl.NumberFormat('en-ZM', { style: 'currency', currency }).format(Number(value || 0));

export default function ServiceQuotesPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStoreId } = useMarketplace();
  const [params] = useSearchParams();
  const detailId = params.get('detail') ?? '';
  const { data, loading, error, retry } = useFetchWrapper(
    () => selectedStoreId ? ownerApi.listServiceQuotes(selectedStoreId, { limit: 50, ...(detailId ? { id: detailId } : {}) }) : Promise.resolve({ items: [] }),
    [selectedStoreId, detailId], { enabled: Boolean(selectedStoreId) },
  );
  const quotes: ServiceQuote[] = data?.service_quotes ?? data?.quotes ?? data?.items ?? (Array.isArray(data) ? data : []);
  const { selectedId, selected, setSelected } = useWorkflowRecordSelection(quotes);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceQuote | null>(null);
  const [working, setWorking] = useState(false);
  const [apiError, setApiError] = useState('');
  const [form, setForm] = useState({ customer_email: '', title: '', description: '', line1: '', city: '', country: 'ZM', expires_at: '', lines: [emptyLine()] });
  const active = selected && quotes.find((quote) => quote.id === selected.id);
  const matching = quotes.filter(quote => `${quote.title} ${quote.status} ${quote.quote_number ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  const visible = matching.slice(page * 6, (page + 1) * 6);

  const estimated = useMemo(() => form.lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unit_price || 0), 0), [form.lines]);
  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  const updateStatus = async (quote: ServiceQuote, status: string) => {
    if (!selectedStoreId) return;
    setWorking(true); setApiError('');
    try { await ownerApi.updateServiceQuoteStatus(selectedStoreId, quote.id, status); await retry(); }
    catch (err: any) { setApiError(userMessage(err, 'Could not update this quote.')); }
    finally { setWorking(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStoreId) return;
    if (working) return;
    if ((!editing && !form.customer_email) || !form.title.trim() || estimated <= 0 || form.lines.some((line) => !line.description.trim() || Number(line.quantity) <= 0 || line.unit_price === '' || Number(line.unit_price) < 0)) { setApiError('Add a customer, a title, and positive priced charge lines.'); return; }
    setWorking(true); setApiError('');
    try {
      const payload = {
        ...(editing ? {} : { customer_email: form.customer_email }), title: form.title, description: form.description || undefined,
        service_address: form.line1 ? { line1: form.line1, city: form.city, country: form.country } : undefined,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
        lines: form.lines.map(line => ({ ...line, quantity: String(line.quantity), unit_price: String(line.unit_price) })),
      };
      const quote = editing ? await ownerApi.replaceServiceQuoteDraft(selectedStoreId, editing.id, payload) : await ownerApi.createServiceQuote(selectedStoreId, payload);
      setOpen(false); setSelected(quote); setForm({ customer_email: '', title: '', description: '', line1: '', city: '', country: 'ZM', expires_at: '', lines: [emptyLine()] }); await retry(); notifyActivityChanged();
    } catch (err: any) { setApiError(userMessage(err, 'Could not create this quote.')); } finally { setWorking(false); }
  };
  const updateLine = (index: number, patch: Partial<ServiceQuoteLine>) => setForm((current) => ({ ...current, lines: current.lines.map((line, i) => i === index ? { ...line, ...patch } : line) }));
  const editDraft = (quote: ServiceQuote) => {
    setEditing(quote); setSelected(null); setApiError('');
    setForm({ customer_email: '', title: quote.title, description: quote.description || '', line1: quote.service_address?.line1 || '', city: quote.service_address?.city || '', country: quote.service_address?.country || 'ZM', expires_at: '', lines: quote.lines?.length ? quote.lines : [emptyLine()] });
    setOpen(true);
  };

  return <div className={`workflow-page space-y-6${selectedId || open ? ' is-detail-view' : ''}`}>
    <header className="flex flex-wrap items-end justify-between gap-4"><div className="flex items-center gap-3"><div><h1 className="text-2xl font-bold text-charcoal">Service quotes</h1><p className="mt-1 text-sm text-forest-muted">Price labour, materials, travel and other charges before work begins.</p></div><StoreCategoryBadge /></div><button className="rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-dark" onClick={() => { setApiError(''); setEditing(null); setForm({ customer_email: '', title: '', description: '', line1: '', city: '', country: 'ZM', expires_at: '', lines: [emptyLine()] }); setSelected(null); setOpen(true); }}>Create quote</button></header>
    {apiError && !selectedId && !open && <div role="alert" className="rounded-lg bg-danger-light px-4 py-3 text-sm text-danger-fg">{apiError}</div>}
    <section className="workflow-panel" aria-labelledby="owner-quotes-heading"><div className="workflow-panel-heading"><h2 id="owner-quotes-heading">Estimate queue</h2><p>Search, open a breakdown, and take the next action.</p></div><div className="booking-toolbar"><label htmlFor="owner-quote-search">Find a quote</label><input id="owner-quote-search" type="search" value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Search by title, number or status" /><span>{matching.length} {matching.length === 1 ? 'quote' : 'quotes'}</span></div>
    <CustomerWorkflowList label="quotes" contextHeading="Location" loading={loading} error={error} onRetry={retry} paginated={matching.length > 6}
      onOpen={id => setSelected(quotes.find(quote => quote.id === id) ?? null)}
      items={visible.map(quote => ({
        id: quote.id, title: quote.title, reference: quote.quote_number ? `Quote #${quote.quote_number}` : undefined,
        context: quote.service_address?.line1 || 'Location to be arranged', date: workflowDate(quote.created_at), status: quote.status,
        value: quote.status === 'draft' && !quote.lines?.length ? 'Price not set' : money(quote.total, quote.currency),
        group: workflowGroup(quote.status, quote.status === 'draft'), actionLabel: quote.status === 'draft' ? 'Review request' : 'View details', description: quote.description,
        facts: [
          { label: 'Requested', value: workflowDate(quote.created_at) },
          { label: 'Service location', value: quote.service_address?.line1 || 'Location to be arranged' },
          ...(quote.expires_at ? [{ label: 'Respond by', value: workflowDate(quote.expires_at, true) }] : []),
        ],
      }))}
      empty={<p className="workflow-empty">{query ? 'No quotes match that search.' : 'No service quotes yet. Create one to send a clear estimate to a customer.'}</p>} />
    {matching.length > 6 && <nav className="booking-pagination" aria-label="Quote pages"><span>Page {page + 1} of {Math.ceil(matching.length / 6)}</span><div><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={(page + 1) * 6 >= matching.length} onClick={() => setPage(page + 1)}>Next</button></div></nav>}</section>
    <WorkflowDetailPage open={Boolean(selectedId)} loading={loading} available={Boolean(active)} error={error} busy={working} onOpenChange={open => { if (!open) setSelected(null); }}><WorkflowDetailContent aria-describedby="owner-quote-description"><WorkflowDetailHeader><WorkflowDetailTitle>{active?.title ?? 'Estimate details'}</WorkflowDetailTitle></WorkflowDetailHeader><WorkflowDetailBody>{apiError && <p role="alert" className="workflow-feedback is-error">{apiError}</p>}<p id="owner-quote-description" className="mb-3 text-sm text-forest-muted">Review the charges and next step for this estimate.</p><QuoteDetail onEdit={editDraft} quote={active ?? null} working={working} onStatus={updateStatus} onCreateJob={async (quote) => { if (!selectedStoreId) return; setWorking(true); setApiError(''); try { await ownerApi.createServiceJob(selectedStoreId, { quote_id: quote.id }); notifyActivityChanged(); setApiError('Service job created. Open Service jobs to dispatch the work.'); } catch (err: any) { setApiError(userMessage(err, 'Could not create this service job.')); } finally { setWorking(false); } }} /></WorkflowDetailBody><WorkflowDetailFooter><button type="button" className="booking-back-button" onClick={() => setSelected(null)}>Close</button></WorkflowDetailFooter></WorkflowDetailContent></WorkflowDetailPage>
    <WorkflowDetailPage open={open} busy={working} onOpenChange={value => { if (!working) setOpen(value); }}><WorkflowDetailContent aria-describedby="quote-editor-description"><WorkflowDetailHeader><WorkflowDetailTitle>{editing ? 'Price this request' : 'New service quote'}</WorkflowDetailTitle></WorkflowDetailHeader><WorkflowDetailBody><form id="quote-editor" onSubmit={submit}><div className="mb-5 flex items-center justify-between"><div><h2 className="sr-only">Service quote editor</h2><p id="quote-editor-description" className="text-sm text-forest-muted">Save the priced draft, then send it to the customer for approval. Existing customer details stay attached.</p></div></div><div className="grid gap-4 md:grid-cols-2">{!editing && <Field label="Customer email"><input required type="email" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className="field-input" /></Field>}<Field label="Quote title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="field-input" /></Field><Field label="Service address"><input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="field-input" /></Field><Field label="City"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="field-input" /></Field><Field label="Expiry (optional)"><input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="field-input" /></Field></div><Field label="Notes (optional)"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="field-input min-h-20" /></Field><div className="mt-5"><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold text-charcoal">Charges</h3><button type="button" onClick={() => setForm({ ...form, lines: [...form.lines, emptyLine()] })} className="text-sm font-semibold text-forest hover:underline">+ Add charge</button></div>{form.lines.map((line, index) => <div key={index} className="mb-3 grid gap-2 rounded-lg bg-cream/55 p-3 md:grid-cols-[8rem_1fr_5rem_7rem_auto]"><select aria-label="Charge type" value={line.line_type} onChange={(e) => updateLine(index, { line_type: e.target.value as ServiceQuoteLineType })} className="field-input"><option value="labour">Labour</option><option value="material">Material</option><option value="travel">Travel</option><option value="fee">Other fee</option></select><input aria-label="Charge description" placeholder="Description" value={line.description} onChange={(e) => updateLine(index, { description: e.target.value })} className="field-input" required/><input aria-label="Quantity" type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} className="field-input" required/><input aria-label="Unit price" type="number" min="0" step="0.01" placeholder="Price" value={line.unit_price} onChange={(e) => updateLine(index, { unit_price: e.target.value })} className="field-input" required/>{form.lines.length > 1 && <button type="button" onClick={() => setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) })} className="rounded px-2 text-sm text-danger-fg hover:bg-danger-light">Remove</button>}</div>)}<p className="text-right text-sm font-semibold text-charcoal">Estimated total: {money(estimated)}</p></div>{apiError && <p role="alert" className="workflow-feedback is-error mt-4">{apiError}</p>}</form></WorkflowDetailBody><WorkflowDetailFooter><button type="button" className="booking-back-button" disabled={working} onClick={() => setOpen(false)}>Cancel</button><button type="submit" form="quote-editor" className="workflow-primary" disabled={working}>{working ? 'Saving…' : editing ? 'Save priced draft' : 'Create draft'}</button></WorkflowDetailFooter></WorkflowDetailContent></WorkflowDetailPage>
  </div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mb-3 block text-sm font-medium text-charcoal"><span className="mb-1 block">{label}</span>{children}</label>; }
function QuoteDetail({ quote, working, onStatus, onCreateJob, onEdit }: { onEdit: (quote: ServiceQuote) => void; quote: ServiceQuote | null; working: boolean; onStatus: (quote: ServiceQuote, status: string) => void; onCreateJob: (quote: ServiceQuote) => void }) { if (!quote) return null; return <section className="dashboard-card"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-forest-muted">Quote #{quote.quote_number ?? quote.id.slice(0, 6)}</p></div><StatusBadge status={quote.status}/></div>{quote.description && <p className="mt-3 text-sm text-forest-muted">{quote.description}</p>}<div className="mt-5 divide-y divide-cream-dark border-y border-cream-dark">{quote.lines?.map((line, index) => <div className="flex justify-between gap-4 py-3 text-sm" key={line.id ?? index}><span><b className="capitalize">{line.line_type}</b> · {line.description}<small className="block text-forest-muted">{line.quantity} × {money(line.unit_price, quote.currency)}</small></span><b>{money(line.total ?? Number(line.quantity) * Number(line.unit_price), quote.currency)}</b></div>)}</div><div className="mt-4 space-y-1 text-right text-sm"><p>Subtotal: {money(quote.subtotal, quote.currency)}</p><p>Tax: {money(quote.tax_amount, quote.currency)}</p><p className="text-base font-bold text-charcoal">Total: {money(quote.total, quote.currency)}</p></div>{quote.service_address?.line1 && <p className="mt-4 text-sm text-forest-muted">Service location: {quote.service_address.line1}{quote.service_address.city ? `, ${quote.service_address.city}` : ''}</p>}{quote.expires_at && <p className="mt-1 text-sm text-forest-muted">Expires {new Date(quote.expires_at).toLocaleString()}</p>}<div className="mt-6 flex flex-wrap gap-3">{quote.status === 'draft' && <button disabled={working} onClick={() => onEdit(quote)} className="booking-back-button">{quote.lines?.length ? 'Edit charges' : 'Add estimate'}</button>}{quote.status === 'draft' && Boolean(quote.lines?.length) && Number(quote.total) > 0 && <button disabled={working} onClick={() => onStatus(quote, 'sent')} className="rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Send to customer</button>}{quote.status === 'accepted' && <button disabled={working} onClick={() => onCreateJob(quote)} className="rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">Create service job</button>}{(quote.status === 'draft' || quote.status === 'sent') && <button disabled={working} onClick={() => onStatus(quote, 'cancelled')} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-danger-fg hover:bg-danger-light">Cancel quote</button>}</div></section>; }
