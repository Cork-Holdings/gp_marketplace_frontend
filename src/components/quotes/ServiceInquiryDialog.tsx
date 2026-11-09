import { userMessage } from '@/lib/userMessage';
import { useEffect, useRef, useState } from 'react';
import { customerApi } from '@/lib/api/services';
import { WorkflowDetailPage, WorkflowDetailBody, WorkflowDetailContent, WorkflowDetailFooter, WorkflowDetailHeader, WorkflowDetailTitle } from '@/components/common/WorkflowDetailPage';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import type { Store } from '@/types/store';
import type { ServiceQuote } from '@/types/serviceQuote';
import { VisitWindowPicker } from '@/components/bookings/VisitWindowPicker';
import { emptyVisit } from '@/lib/visitScheduling';
import { visitWindow } from '@/lib/bookingTime';

export function ServiceInquiryDialog({ open, onClose, stores, initialStore = '', initialTitle = '', onCreated }: {
  open: boolean; onClose: () => void; stores: Store[]; initialStore?: string; initialTitle?: string;
  onCreated: (quote: ServiceQuote) => void;
}) {
  const [step, setStep] = useState(0);
  const [storeId, updateStoreId] = useState(initialStore);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [title, setTitle] = useState(initialTitle);
  const [details, setDetails] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [visit,setVisit]=useState(emptyVisit);
  const setStoreId=(id:string)=>{updateStoreId(id);setVisit(emptyVisit());};
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  useEffect(() => { if (open) { setStoreId(initialStore); setTitle(initialTitle); setStep(0); setError(''); } }, [open, initialStore, initialTitle]);
  const providers = stores.filter(store => store.store_category === 'ON_SITE_SERVICE');
  const selected = providers.find(store => store.id === storeId);
  const filtered = providers.filter(store => `${store.name} ${store.description ?? ''} ${store.store_type ?? ''}`.replaceAll('_', ' ').toLowerCase().includes(search.trim().toLowerCase()));
  const needsReady = title.trim().length > 0 && details.trim().length >= 10 && address.trim().length > 0 && city.trim().length > 0;
  const visitReady = Boolean(visit.scheduled_at && Date.parse(visit.scheduled_at)>Date.now());
  const canContinue = step === 0 ? Boolean(selected) : step === 1 ? needsReady : needsReady && visitReady;
  async function submit() {
    if (!selected || !needsReady || !visitReady || submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    try {
      const quote = await customerApi.createServiceInquiry({ store_id: selected.id, title: title.trim(), description: details.trim(), service_address: { line1: address.trim(), city: city.trim(), country: 'ZM' }, ...visit });
      setDetails(''); setAddress(''); setCity(''); setVisit(emptyVisit()); onClose(); onCreated(quote);
    } catch (cause) { setError(userMessage(cause, 'Could not send your request. Your details are still here.')); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <WorkflowDetailPage open={open} busy={busy} onOpenChange={value => { if (!value && !busy) onClose(); }}>
    <WorkflowDetailContent aria-describedby="inquiry-description">
      <WorkflowDetailHeader><WorkflowDetailTitle>Request a service estimate</WorkflowDetailTitle></WorkflowDetailHeader>
      <WorkflowDetailBody><p id="inquiry-description" className="workflow-help">Describe the work first. The provider sends an itemised price; you approve it before paying.</p>
        <ol className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-forest-muted" aria-label="Request progress">{['Provider', 'Your needs', 'Visit time', 'Review'].map((name, index) => <li key={name} aria-current={index === step ? 'step' : undefined} className={index === step ? 'text-forest' : ''}>{index + 1}. {name}</li>)}</ol>
        <div className="mt-5 space-y-4">
          {step === 0 && <><label className="block text-sm font-semibold">Find the work you need<input className="field-input mt-2" type="search" placeholder="Try plumbing, electrical or mobile grooming" value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} /></label>
            <ul className="space-y-2">{filtered.slice(page * 6, (page + 1) * 6).map(store => <li key={store.id}><button type="button" aria-pressed={storeId === store.id} onClick={() => setStoreId(store.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${storeId === store.id ? 'border-forest bg-forest/5' : 'border-cream-dark hover:bg-cream'}`}><span className="flex items-center justify-between gap-3"><strong>{store.name}</strong>{storeId === store.id && <WorkflowIcon name="check" />}</span><span className="mt-1 block text-sm text-forest-muted">{store.description || store.store_type?.replaceAll('_', ' ')}</span><span className="mt-2 block text-xs font-semibold text-forest">Price after estimate · At your location</span></button></li>)}</ul>
            {!filtered.length && <p className="workflow-empty">No providers match. Try the service type rather than a business name.</p>}
            {filtered.length > 6 && <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Service provider pages"><button className="booking-back-button" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>{page + 1} / {Math.ceil(filtered.length / 6)}</span><button className="booking-back-button" disabled={(page + 1) * 6 >= filtered.length} onClick={() => setPage(page + 1)}>Next</button></nav>}
          </>}
          {step === 1 && <><p className="workflow-feedback"><b>{selected?.name}</b> will receive your request. Your account identifies you automatically.</p>
            <label className="block text-sm font-semibold">What needs doing?<input className="field-input mt-2" maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="Repair a leaking kitchen pipe" /></label>
            <label className="block text-sm font-semibold">Details<textarea className="field-input mt-2 min-h-24" minLength={10} maxLength={4000} value={details} onChange={event => setDetails(event.target.value)} placeholder="Describe the issue, size or work needed. At least 10 characters." /></label>
            <label className="block text-sm font-semibold">Service address<input className="field-input mt-2" autoComplete="street-address" maxLength={250} value={address} onChange={event => setAddress(event.target.value)} /></label>
            <label className="block text-sm font-semibold">City or town<input className="field-input mt-2" autoComplete="address-level2" maxLength={100} value={city} onChange={event => setCity(event.target.value)} /></label>
          </>}
          {step === 2 && <><VisitWindowPicker key={storeId} storeId={storeId} value={visit} onChange={setVisit} />{!visitReady && <p className="text-sm text-forest-muted">Choose a future date and arrival time to review your request.</p>}</>}
          {step === 3 && <><div className="rounded-xl border border-cream-dark p-4"><p className="text-xs font-semibold uppercase text-forest-muted">{selected?.name}</p><h3 className="mt-2 font-semibold">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm text-forest-muted">{details}</p><p className="mt-3 text-sm"><b>At your location:</b> {address}, {city}</p><p className="mt-3 text-sm"><b>Preferred arrival:</b> {visitWindow(visit.scheduled_at)}</p></div><p className="workflow-feedback">No payment is requested now. Review the provider’s price and proposed visit window before accepting.</p></>}
          {error && <p role="alert" className="workflow-feedback is-error">{error}</p>}
        </div>
      </WorkflowDetailBody>
      <WorkflowDetailFooter><button className="booking-back-button mr-auto" type="button" disabled={busy} onClick={() => step ? setStep(step - 1) : onClose()}>{step ? 'Back' : 'Cancel'}</button><button className="workflow-primary" type="button" disabled={busy || !canContinue} onClick={() => step === 3 ? void submit() : setStep(step + 1)}>{busy ? 'Sending request…' : step === 3 ? 'Send request' : step === 2 ? 'Review request' : 'Continue'}</button></WorkflowDetailFooter>
    </WorkflowDetailContent>
  </WorkflowDetailPage>;
}
