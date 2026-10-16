import { isBookingTimeConflict, userMessage } from '@/lib/userMessage';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { customerApi, StorefrontService } from '@/lib/api/services';
import { ErrorState } from '@/components/common/ErrorState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BookingAgenda } from '@/components/bookings/BookingAgenda';
import { BookingSlotPicker } from '@/components/bookings/BookingSlotPicker';
import { ServiceProviderPicker } from '@/components/bookings/ServiceProviderPicker';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { WorkflowPageHeader, WorkflowEmpty } from '@/components/common/WorkflowVisuals';
import { WorkflowPaymentPanel } from '@/components/common/WorkflowPaymentPanel';
import { notifyActivityChanged } from '@/hooks/useActivityCounts';
import type { BookableService, MerchantResource, Reservation, ServiceProvider } from '@/types/serviceQuote';
import type { Store } from '@/types/store';

const PAGE_SIZE = 6;
const SERVICE_PAGE_SIZE = 4;
const PROVIDER_PAGE_SIZE = 8;
const money = (amount: string, currency = 'ZMW') => new Intl.NumberFormat('en-ZM', { style: 'currency', currency }).format(Number(amount));

export default function CustomerReservationsPage() {
  const { hasRole, isAuthenticated } = useAuth();
  const [params] = useSearchParams();
  const customer = hasRole('customer');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [view, setView] = useState<'schedule' | 'new'>(params.get('store') ? 'new' : 'schedule');
  useEffect(() => { const timer = window.setTimeout(() => { setPage(0); setSearch(query.trim()); }, 300); return () => window.clearTimeout(timer); }, [query]);
  const { data, loading, error, retry } = useFetchWrapper(() => customerApi.listReservations({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, search }), [page, search], { enabled: isAuthenticated && customer });
  const { data: storesData } = useFetchWrapper(() => StorefrontService.listStores(), []);
  const stores: Store[] = useMemo(() => Array.isArray(storesData) ? storesData : [], [storesData]);
  const bookableStores = useMemo(() => stores.filter(store => store.store_category === 'ON_PREMISE_SERVICE' || store.store_category === 'ON_SITE_SERVICE'), [stores]);
  const [providerQuery, setProviderQuery] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [providerPage, setProviderPage] = useState(0);
  useEffect(() => { const timer = window.setTimeout(() => { setProviderPage(0); setProviderSearch(providerQuery.trim()); }, 300); return () => window.clearTimeout(timer); }, [providerQuery]);
  const { data: providerData, loading: loadingProviders, error: providerError } = useFetchWrapper(
    () => StorefrontService.searchServiceProviders(providerSearch, PROVIDER_PAGE_SIZE, providerPage * PROVIDER_PAGE_SIZE),
    [providerSearch, providerPage],
  );
  const providers: ServiceProvider[] = useMemo(() => providerData?.providers ?? [], [providerData]);
  const providerTotal = Number(providerData?.total ?? 0);
  const rows: Reservation[] = data?.reservations ?? [];
  const total = Number(data?.total ?? 0);
  const [storeId, setStoreId] = useState(params.get('store') ?? '');
  const { data: resourceData, loading: loadingResources } = useFetchWrapper(
    () => storeId ? StorefrontService.listResources(storeId) : Promise.resolve({ resources: [] }),
    [storeId], { enabled: Boolean(storeId) },
  );
  const resources: MerchantResource[] = useMemo(() => resourceData?.resources ?? [], [resourceData]);
  const { data: serviceData, loading: loadingServices } = useFetchWrapper(
    () => storeId ? StorefrontService.listBookableServices(storeId) : Promise.resolve({ services: [] }),
    [storeId], { enabled: Boolean(storeId) },
  );
  const services: BookableService[] = useMemo(() => serviceData?.services ?? [], [serviceData]);
  const requestedItem = params.get('item')?.trim() ?? '';
  const [serviceQuery, setServiceQuery] = useState('');
  const [servicePage, setServicePage] = useState(0);
  const matchingServices = services.filter(service => service.name.toLowerCase().includes(serviceQuery.trim().toLowerCase()));
  const visibleServices = matchingServices.slice(servicePage * SERVICE_PAGE_SIZE, (servicePage + 1) * SERVICE_PAGE_SIZE);
  const [resourceId, setResourceId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const selectedService = services.find(service => service.id === serviceId);
  const itemUnavailable = Boolean(requestedItem && !loadingServices && storeId && services.length > 0 && !services.some(service => service.name.toLocaleLowerCase() === requestedItem.toLocaleLowerCase()));
  const [startsAt, setStartsAt] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState('');
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef('0-false');
  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);

  useEffect(() => { if (!storeId && providers.length === 1 && providers[0].service_count > 0 && providers[0].resource_count > 0 && !providerSearch) setStoreId(providers[0].store_id); }, [storeId, providers, providerSearch]);
  useEffect(() => { setResourceId(resources.length === 1 ? resources[0].id : ''); }, [storeId, resources]);
  useEffect(() => {
    const matched = requestedItem && services.find(service => service.name.toLocaleLowerCase() === requestedItem.toLocaleLowerCase());
    setServiceId(matched?.id ?? (services.length === 1 ? services[0].id : ''));
  }, [storeId, services, requestedItem]);
  useEffect(() => { setServiceQuery(''); setServicePage(0); }, [storeId]);
  useEffect(() => {
    const current = `${step}-${bookingSuccess}`;
    if (previousStepRef.current === current) return;
    previousStepRef.current = current;
    stepHeadingRef.current?.focus({ preventScroll: true });
    stepHeadingRef.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [step, bookingSuccess]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!customer) return <Navigate to="/portal" replace />;

  function continueToTime() {
    setFeedback(null);
    if (!storeId || !serviceId || loadingServices || !services.some(service => service.id === serviceId)) {
      setFeedback({ text: 'Choose a business and one of its available services to continue.', error: true });
      return;
    }
    if (loadingResources || resources.length === 0) {
      setFeedback({ text: 'This business has not opened online appointment slots yet. Explore its storefront for other ways to request this service.', error: true });
      return;
    }
    setStep(1);
  }

  function continueToReview() {
    setFeedback(null);
    if (!resourceId || loadingResources || !resources.some(resource => resource.id === resourceId)) {
      setFeedback({ text: 'Choose where your appointment will take place.', error: true });
      return;
    }
    const start = new Date(startsAt);
    if (!Number.isFinite(start.getTime()) || start.getTime() < Date.now()) {
      setFeedback({ text: 'Choose a future appointment date and time.', error: true });
      return;
    }
    setStep(2);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFeedback(null);
    if (!storeId || !resourceId || !serviceId) { setFeedback({ text: 'Choose a business, a service and an available resource.', error: true }); return; }
    const start = new Date(startsAt);
    if (!Number.isFinite(start.getTime()) || start.getTime() < Date.now()) { setFeedback({ text: 'Choose a future appointment time.', error: true }); return; }
    setWorking(true);
    try {
      const booking: Reservation = await customerApi.createReservation(storeId, {
        kind: 'appointment', service_id: serviceId, resource_id: resourceId,
        starts_at: start.toISOString(),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      setStartsAt(''); setNotes('');
      setCreatedBookingId(booking.id);
      setBookingSuccess(true);
      setStep(0);
      await retry();
      notifyActivityChanged();
    } catch (err) {
      if (isBookingTimeConflict(err)) setStep(1);
      setFeedback({ text: userMessage(err, 'Could not request the booking. Check your details before trying again.'), error: true });
    }
    finally { setWorking(false); }
  }

  async function cancel(id: string) {
    setFeedback(null); setWorking(true);
    try { await customerApi.updateReservationStatus(id, 'cancelled'); setCancelTarget(null); setFeedback({ text: 'Booking cancelled.', error: false }); await retry(); notifyActivityChanged(); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not cancel the booking.'), error: true }); }
    finally { setWorking(false); }
  }

  return <main className="workflow-page"><WorkflowPageHeader kind="booking" title="Bookings" description="Your next visit, neatly planned. Choose a service, request a time and follow its confirmation." />
    <div className="booking-view-switch" role="group" aria-label="Booking view"><button type="button" aria-pressed={view === 'schedule'} onClick={() => setView('schedule')}><WorkflowIcon name="calendar" />My schedule</button><button type="button" aria-pressed={view === 'new'} onClick={() => setView('new')}><WorkflowIcon name="plus" />New booking</button></div>
    {view === 'new' && params.get('assessment') && <p className="booking-preselection" role="status">Choose an available assessment service and time. The business can price the actual work after reviewing it; the amount shown is only for the booking you select.</p>}
    {view === 'new' && itemUnavailable && <p className="booking-preselection" role="status">“{requestedItem}” is not currently listed as a bookable service. Select an available service below and review its price before requesting a time.</p>}
    {view === 'new' && Boolean(params.get('store')) && !loadingServices && services.length === 0 && <p className="booking-preselection" role="status">This business has not published an online booking or assessment service yet, so no appointment can be requested here.</p>}
    <div className="workflow-layout booking-single-layout">{view === 'new' && <section className="workflow-panel" aria-labelledby="booking-form-heading"><div className="workflow-panel-heading"><h2 id="booking-form-heading">Request an appointment</h2><p>Choose a service, find a time, then check everything before requesting.</p></div>
      {bookingSuccess ? <div className="booking-success" role="status"><span className="booking-success-icon" aria-hidden="true">✓</span><h3 ref={stepHeadingRef} tabIndex={-1}>Request sent</h3><p>Your booking appears in your schedule. Payment is required before the business can confirm it.</p>{createdBookingId && <WorkflowPaymentPanel kind="reservation" sourceId={createdBookingId} stage="full" label="Pay for this booking" />}<button type="button" className="workflow-primary" onClick={() => { setBookingSuccess(false); setFeedback(null); }}>Book another time</button></div> : <><ol className="booking-steps" aria-label="Booking progress">{['Service', 'Time & place', 'Review'].map((label, index) => <li key={label} className={index === step ? 'is-current' : index < step ? 'is-done' : ''} aria-current={index === step ? 'step' : undefined}><span>{index < step ? '✓' : index + 1}</span>{label}</li>)}</ol>
      <form key={step} className="workflow-form booking-wizard-form" onSubmit={submit}>
        {step === 0 && <><div className="booking-step-intro"><p className="workflow-eyebrow">Step 1 of 3</p><h3 ref={stepHeadingRef} tabIndex={-1}>What would you like to book?</h3><p>Search for the work you need or choose a business. Prices and duration come from the provider.</p></div>{params.get('store') === storeId && storeId && <p className="booking-preselection">Selected from the marketplace: <strong>{bookableStores.find(store => store.id === storeId)?.name ?? 'your chosen business'}</strong>. You can choose another below.</p>}<ServiceProviderPicker query={providerQuery} onQueryChange={query => { setProviderQuery(query); setStoreId(''); setServiceId(''); setResourceId(''); }} providers={providers} total={providerTotal} page={providerPage} pageSize={PROVIDER_PAGE_SIZE} onPageChange={setProviderPage} selectedStoreId={storeId} onSelect={provider => { setStoreId(provider.store_id); setResourceId(''); setServiceId(''); }} loading={loadingProviders} error={providerError ? 'Could not load providers. Please try again.' : undefined} />
          {storeId && <section className="booking-service-picker" aria-labelledby="choose-service-heading"><div className="booking-picker-heading"><h3 id="choose-service-heading">Choose a service</h3><span>{loadingServices ? 'Loading…' : `${services.length} available`}</span></div>{!loadingResources && resources.length === 0 && <p className="booking-preselection" role="status">This business has not opened online appointment slots. You can explore its storefront for other service options.</p>}{services.length > SERVICE_PAGE_SIZE && <label htmlFor="customer-service-search">Find a service<input id="customer-service-search" type="search" value={serviceQuery} onChange={e => { setServiceQuery(e.target.value); setServicePage(0); }} placeholder="Search services" /></label>}{loadingServices ? <p className="booking-picker-empty">Loading services…</p> : visibleServices.length ? <div className="booking-service-choices">{visibleServices.map(service => <button key={service.id} type="button" className="booking-service-choice" aria-pressed={serviceId === service.id} onClick={() => setServiceId(service.id)}><span><strong>{service.name}</strong><small>{service.duration_minutes} minutes</small></span><b>{money(service.price, service.currency)}</b></button>)}</div> : <p className="booking-picker-empty">{serviceQuery ? 'No services match that search.' : 'This business has not added a priced service yet.'}</p>}{matchingServices.length > SERVICE_PAGE_SIZE && <nav className="booking-pagination" aria-label="Available service pages"><span>Page {servicePage + 1} of {Math.ceil(matchingServices.length / SERVICE_PAGE_SIZE)}</span><div><button type="button" disabled={servicePage === 0} onClick={() => setServicePage(servicePage - 1)}>Previous</button><button type="button" disabled={(servicePage + 1) * SERVICE_PAGE_SIZE >= matchingServices.length} onClick={() => setServicePage(servicePage + 1)}>Next</button></div></nav>}</section>}</>}
        {step === 1 && <><div className="booking-step-intro"><p className="workflow-eyebrow">Step 2 of 3</p><h3 ref={stepHeadingRef} tabIndex={-1}>When should we expect you?</h3><p>Choose an available time within the business’s opening hours. Times are shown in Lusaka (UTC+2).</p></div><label>With whom or where?<select value={resourceId} onChange={e => setResourceId(e.target.value)}><option value="">{loadingResources ? 'Loading choices…' : 'Choose an available option'}</option>{resources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select>{!loadingResources && !resources.length && <small>This business has not opened online appointment slots yet.</small>}</label><BookingSlotPicker storeId={storeId} serviceId={serviceId} resourceId={resourceId} value={startsAt} onChange={setStartsAt} /><label>Anything else? <span className="sr-only">Optional</span><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional details for the business" /></label></>}
        {step === 2 && <><div className="booking-step-intro"><p className="workflow-eyebrow">Step 3 of 3</p><h3 ref={stepHeadingRef} tabIndex={-1}>Check your request</h3><p>Send the request, then pay within 15 minutes to hold your time. A pending payment keeps the time reserved while its result is checked.</p></div><dl className="booking-review"><div><dt>Business</dt><dd>{bookableStores.find(store => store.id === storeId)?.name ?? 'Business'}</dd></div><div><dt>Service</dt><dd>{selectedService?.name ?? 'Service'} · {selectedService?.duration_minutes} min</dd></div><div><dt>With whom or where</dt><dd>{resources.find(resource => resource.id === resourceId)?.name ?? 'Resource'}</dd></div><div><dt>Requested time</dt><dd>{new Date(startsAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Lusaka' })} (Lusaka)</dd></div>{notes.trim() && <div><dt>Your note</dt><dd>{notes.trim()}</dd></div>}</dl>{selectedService && <p className="booking-price-summary"><span>Service price</span><strong>{money(selectedService.price, selectedService.currency)}</strong><small>You will see the payment step after sending the request.</small></p>}</>}
        {feedback && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}
        <div className="booking-step-actions">{step > 0 && <button className="booking-back-button" type="button" onClick={() => { setFeedback(null); setStep(step === 2 ? 1 : 0); }}>Back</button>}{step === 0 && <button className="workflow-primary" type="button" onClick={continueToTime}>Continue to time</button>}{step === 1 && <button className="workflow-primary" type="button" onClick={continueToReview}>Review request</button>}{step === 2 && <button className="workflow-primary" type="submit" aria-busy={working} disabled={working}>{working ? 'Requesting…' : 'Request booking'}</button>}</div>
      </form></>}
    </section>}
      {view === 'schedule' && <section className="workflow-panel booking-results" aria-labelledby="booking-list-heading"><div className="workflow-panel-heading"><h2 id="booking-list-heading">Your schedule</h2><p>Browse your visits by date. Open any booking for details and options.</p></div>
        <div className="booking-toolbar"><label htmlFor="customer-booking-search"><WorkflowIcon name="search" size={16} />Search bookings</label><input id="customer-booking-search" name="customer-booking-search" autoComplete="off" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by service or status" /><span aria-live="polite">{loading ? 'Searching…' : `${total} ${total === 1 ? 'booking' : 'bookings'}`}</span></div>
        {loading ? <div className="booking-skeleton-list" role="status" aria-label="Loading bookings"><span /><span /><span /></div> : error ? <ErrorState error={error} onRetry={retry} /> : rows.length ? <BookingAgenda listViews paginated={total > PAGE_SIZE} rows={rows} context={row => stores.find(store => store.id === row.store_id)?.name ?? 'Business'} actionLabel={row => row.status === 'requested' || row.status === 'confirmed' ? 'Cancel booking' : undefined} onAction={row => setCancelTarget(row)} busy={working} customerPayments /> : <WorkflowEmpty kind="booking" title={search ? 'No matching bookings' : 'Make time for your next visit'} description={search ? 'Try another service name or status.' : 'Find a service, choose a time and review the details before requesting.'}>{!search && <button type="button" className="workflow-primary" onClick={() => setView('new')}><WorkflowIcon name="plus" /> New booking</button>}</WorkflowEmpty>}
        {total > PAGE_SIZE && <nav className="booking-pagination" aria-label="Booking pages"><span>Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}</span><div><button type="button" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={(page + 1) * PAGE_SIZE >= total || loading} onClick={() => setPage(page + 1)}>Next</button></div></nav>}
      </section>}</div>
    <ConfirmDialog open={Boolean(cancelTarget)} title="Cancel this booking?" description={cancelTarget ? `${cancelTarget.title} on ${new Date(cancelTarget.starts_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} will be cancelled. You would need to request a new time to book again.` : undefined} confirmLabel="Cancel booking" cancelLabel="Keep booking" busy={working} onCancel={() => setCancelTarget(null)} onConfirm={() => { if (cancelTarget) void cancel(cancelTarget.id); }} />
  </main>;
}
