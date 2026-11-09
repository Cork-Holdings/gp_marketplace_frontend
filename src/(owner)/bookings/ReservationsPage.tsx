import { RecordListTable } from '@/components/common/RecordListTable';
import { userMessage } from '@/lib/userMessage';
import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { ownerApi, rolesApi } from '@/lib/api/services';
import { ErrorState } from '@/components/common/ErrorState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BookingAgenda } from '@/components/bookings/BookingAgenda';
import { BookingSlotPicker } from '@/components/bookings/BookingSlotPicker';
import { BookingHoursEditor } from '@/components/bookings/BookingHoursEditor';
import { EmployeeDayCalendar } from '@/components/bookings/EmployeeDayCalendar';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { notifyActivityChanged } from '@/hooks/useActivityCounts';
import type { BookableService, MerchantResource, Reservation, ReservationKind, ReservationStatus } from '@/types/serviceQuote';
import './booking-setup.css';

const next: Partial<Record<ReservationStatus, { status: ReservationStatus; label: string }>> = {
  requested: { status: 'confirmed', label: 'Confirm' }, confirmed: { status: 'checked_in', label: 'Check in' },
  checked_in: { status: 'in_progress', label: 'Start' }, in_progress: { status: 'completed', label: 'Complete' },
};
const PAGE_SIZE = 6;
const SERVICE_PAGE_SIZE = 5;
const setupSections = [
  { value: 'services', label: 'Services', description: 'Prices and appointment lengths', icon: 'document' },
  { value: 'resources', label: 'Resources', description: 'Staff, spaces and capacity', icon: 'briefcase' },
  { value: 'hours', label: 'Opening hours', description: 'Days and times customers can book', icon: 'clock' },
] as const;
type SetupSection = typeof setupSections[number]['value'];
const money = (amount: string, currency = 'ZMW') => new Intl.NumberFormat('en-ZM', { style: 'currency', currency }).format(Number(amount));

export default function ReservationsPage() {
  const [params, setParams] = useSearchParams();
  const detailId = params.get('detail') ?? '';
  const { isStoreOwner } = useAuth();
  const { selectedStoreId: storeId, selectedStore } = useMarketplace();
  const {data:teamData}=useFetchWrapper(()=>selectedStore?.merchant_id ? rolesApi.listMembers(selectedStore.merchant_id) : Promise.resolve({members:[]}),[selectedStore?.merchant_id],{enabled:Boolean(selectedStore?.merchant_id)});
  type TeamMember={user_id:string;display_name?:string;member_role?:string;is_active:boolean;store_ids?:string[];user?:{full_name?:string}};
  const team:TeamMember[]=(teamData?.members ?? []).filter((m:TeamMember)=>m.is_active && m.member_role!=='viewer' && (!m.store_ids?.length || m.store_ids.includes(storeId ?? '')));
  const [employeeId,setEmployeeId]=useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const view = params.get('view') === 'setup' ? 'setup' : params.get('view') === 'new' ? 'new' : 'schedule';
  const setupSection: SetupSection = params.get('section') === 'resources' ? 'resources' : params.get('section') === 'hours' ? 'hours' : 'services';
  function setView(value: 'schedule' | 'new' | 'setup') {
    setParams(current => { const updated = new URLSearchParams(current); updated.set('view', value); return updated; }, { replace: true });
  }
  function openSetup(section: SetupSection) {
    setParams(current => { const updated = new URLSearchParams(current); updated.set('view', 'setup'); updated.set('section', section); return updated; }, { replace: true });
  }
  function navigateSetup(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = setupSections.findIndex(section => section.value === setupSection);
    const index = event.key === 'Home' ? 0 : event.key === 'End' ? setupSections.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + setupSections.length) % setupSections.length;
    openSetup(setupSections[index].value);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index]?.focus();
  }
  const [completeTarget, setCompleteTarget] = useState<Reservation | null>(null);
  const [serviceQuery, setServiceQuery] = useState('');
  const [servicePage, setServicePage] = useState(0);
  useEffect(() => { const timer = window.setTimeout(() => { setPage(0); setSearch(query.trim()); }, 300); return () => window.clearTimeout(timer); }, [query]);
  useEffect(() => { setPage(0); }, [storeId]);
  const { data, loading, error, retry } = useFetchWrapper(() => storeId ? ownerApi.listReservations(storeId, { limit: PAGE_SIZE, offset: page * PAGE_SIZE, search, ...(detailId ? { id: detailId } : {}) }) : Promise.resolve({ reservations: [], total: 0 }), [storeId, page, search, detailId], { enabled: Boolean(storeId) });
  const { data: resourceData, loading: resourcesLoading, error: resourcesError, retry: reloadResources } = useFetchWrapper(() => storeId ? ownerApi.listResources(storeId) : Promise.resolve({ resources: [] }), [storeId], { enabled: Boolean(storeId) });
  const { data: serviceData, loading: servicesLoading, error: servicesError, retry: reloadServices } = useFetchWrapper(() => storeId ? ownerApi.listBookableServices(storeId) : Promise.resolve({ services: [] }), [storeId], { enabled: Boolean(storeId) });
  const rows: Reservation[] = data?.reservations ?? [];
  const total = Number(data?.total ?? 0);
  const resources: MerchantResource[] = resourceData?.resources ?? [];
  const services: BookableService[] = serviceData?.services ?? [];
  const activeResources = resources.filter(resource => resource.is_active);
  const activeServices = services.filter(service => service.is_active);
  const matchingServices = services.filter(service => service.name.toLowerCase().includes(serviceQuery.trim().toLowerCase()));
  const visibleServices = matchingServices.slice(servicePage * SERVICE_PAGE_SIZE, (servicePage + 1) * SERVICE_PAGE_SIZE);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('1');
  const [kind, setKind] = useState<ReservationKind>('appointment');
  const [customerEmail, setCustomerEmail] = useState('');
  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [servicePrice, setServicePrice] = useState('');
  const [resourceId, setResourceId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [duration, setDuration] = useState('30');
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  useEffect(() => { setServiceId(''); setResourceId(''); }, [storeId]);
  useEffect(() => { if (!serviceId && activeServices.length === 1) setServiceId(activeServices[0].id); }, [activeServices, serviceId]);
  useEffect(() => { if (!resourceId && activeResources.length === 1) setResourceId(activeResources[0].id); }, [activeResources, resourceId]);
  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  async function createResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!storeId) return; setWorking(true); setFeedback(null);
    try { await ownerApi.createResource(storeId, { name: name.trim(), resource_type: employeeId ? 'employee' : 'appointment', capacity: employeeId ? 1 : Number(capacity), employee_user_id:employeeId || undefined }); setName(''); setCapacity('1'); setEmployeeId(''); await reloadResources(); setFeedback({ text: 'Bookable resource added.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not add the resource.'), error: true }); }
    finally { setWorking(false); }
  }
  async function createService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!storeId) return; setWorking(true); setFeedback(null);
    try { await ownerApi.createBookableService(storeId, { name: serviceName.trim(), duration_minutes: Number(serviceDuration), price: servicePrice }); setServiceName(''); setServicePrice(''); await reloadServices(); setFeedback({ text: 'Priced service added.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not add the service.'), error: true }); }
    finally { setWorking(false); }
  }
  async function createBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!storeId) return; setWorking(true); setFeedback(null);
    try {
      const start = new Date(startsAt);
      if (!Number.isFinite(start.getTime()) || start.getTime() < Date.now()) throw new Error('Choose a future date and time.');
      await ownerApi.createReservation(storeId, { customer_email: customerEmail.trim(), kind,
        ...(kind === 'appointment' ? { resource_id: resourceId, service_id: serviceId } : { title: title.trim(), ends_at: new Date(start.getTime() + Number(duration) * 60000).toISOString() }),
        starts_at: start.toISOString() });
      setCustomerEmail(''); setTitle(''); setStartsAt(''); await retry(); notifyActivityChanged(); setView('schedule');
      setFeedback({ text: 'Booking created and ready for confirmation.', error: false });
    } catch (err) { setFeedback({ text: userMessage(err, 'Could not create the booking.'), error: true }); }
    finally { setWorking(false); }
  }
  async function advance(row: Reservation) {
    if (!storeId || !next[row.status]) return; setWorking(true); setFeedback(null);
    try { await ownerApi.updateReservationStatus(storeId, row.id, next[row.status]!.status); await retry(); notifyActivityChanged(); setCompleteTarget(null); setFeedback({ text: 'Booking updated.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not update the booking.'), error: true }); }
    finally { setWorking(false); }
  }
  async function toggleResource(resource: MerchantResource) {
    if (!storeId) return; setWorking(true); setFeedback(null);
    try { await ownerApi.setResourceActive(storeId, resource.id, !resource.is_active); await reloadResources(); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not update this resource.'), error: true }); }
    finally { setWorking(false); }
  }
  async function toggleService(service: BookableService) {
    if (!storeId) return; setWorking(true); setFeedback(null);
    try { await ownerApi.setBookableServiceActive(storeId, service.id, !service.is_active); await reloadServices(); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not update this service.'), error: true }); }
    finally { setWorking(false); }
  }

  return <section className="workflow-page" aria-label="Bookings workspace"><header className="workflow-header"><p className="workflow-eyebrow">Operations</p><h1>Bookings</h1><p>Manage appointment capacity, customer requests and check-ins for this business.</p></header>
    {feedback && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'}>{feedback.text}</p>}
    <div className="booking-view-switch owner-booking-navigation" role="group" aria-label="Booking view"><button type="button" aria-pressed={view === 'schedule'} onClick={() => setView('schedule')}><WorkflowIcon name="calendar" />Schedule</button><button type="button" aria-pressed={view === 'new'} onClick={() => setView('new')}><WorkflowIcon name="plus" />Add booking</button><button type="button" aria-pressed={view === 'setup'} onClick={() => setView('setup')}><WorkflowIcon name="settings" />Booking setup</button></div>
    {view==='schedule' && storeId && !detailId && <EmployeeDayCalendar key={storeId} storeId={storeId} />}
    <div className="workflow-layout booking-single-layout">{view === 'new' && <section className="workflow-panel" aria-labelledby="new-booking-heading"><div className="workflow-panel-heading"><h2 id="new-booking-heading">Add a booking</h2><p>Use the customer’s account email. We look up their details.</p></div>
      <form className="workflow-form" onSubmit={createBooking}>
        {kind === 'appointment' && servicesError && <ErrorState error={servicesError} onRetry={reloadServices} />}
        {kind === 'appointment' && resourcesError && <ErrorState error={resourcesError} onRetry={reloadResources} />}
        {kind === 'appointment' && !resourcesLoading && !servicesLoading && !resourcesError && !servicesError && (!activeServices.length || !activeResources.length) && <div className="booking-setup-prerequisites"><strong>Finish appointment setup first</strong><p>Appointments need a priced service, a bookable resource and opening hours.</p><div>{!activeServices.length && <button type="button" className="workflow-text-action" onClick={() => openSetup('services')}>Add a service</button>}{!activeResources.length && <button type="button" className="workflow-text-action" onClick={() => openSetup('resources')}>Add a resource</button>}<button type="button" className="workflow-text-action" onClick={() => openSetup('hours')}>Set opening hours</button></div></div>}
        <label>Customer email<input required type="email" autoComplete="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@example.com" /></label>
        <label>Booking type<select value={kind} onChange={e => { setKind(e.target.value as ReservationKind); setStartsAt(''); }}><option value="appointment">Appointment</option><option value="walk_in">Walk-in</option><option value="remote_session">Remote session</option><option value="rental">Rental</option><option value="membership_visit">Member visit</option></select></label>
        {kind === 'appointment' && <label>Priced service<select required value={serviceId} onChange={e => setServiceId(e.target.value)}><option value="">Choose a service</option>{activeServices.map(service => <option key={service.id} value={service.id}>{service.name} · {service.duration_minutes} min · {money(service.price, service.currency)}</option>)}</select></label>}
        {kind === 'appointment' && <label>Bookable resource<select required value={resourceId} onChange={e => setResourceId(e.target.value)}><option value="">Choose an available option</option>{activeResources.map(resource => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select></label>}
        {kind !== 'appointment' && <label>Purpose<input required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Equipment rental" /></label>}
        <div className="workflow-fields">{kind === 'appointment' ? <BookingSlotPicker storeId={storeId ?? ''} serviceId={serviceId} resourceId={resourceId} value={startsAt} onChange={setStartsAt} owner /> : <label>Date and time<input required type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} /></label>}{kind !== 'appointment' && <label>Length<select value={duration} onChange={e => setDuration(e.target.value)}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">1 hour</option><option value="90">1½ hours</option><option value="120">2 hours</option></select></label>}</div>
        <button className="workflow-primary" type="submit" aria-busy={working} disabled={working || !storeId || (kind === 'appointment' && (!serviceId || !resourceId || !startsAt || resourcesLoading || servicesLoading || Boolean(resourcesError || servicesError)))}>{working ? 'Creating…' : 'Create booking'}</button>
      </form></section>}
      {view === 'schedule' && <section className="workflow-panel booking-results" aria-labelledby="booking-queue-heading"><div className="workflow-panel-heading"><h2 id="booking-queue-heading">Booking schedule</h2><p>See visits by date, then open one to confirm or update it.</p></div>
        <div className="booking-toolbar"><label htmlFor="owner-booking-search">Search bookings</label><input id="owner-booking-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by service or status" /><span aria-live="polite">{loading ? 'Searching…' : `${total} ${total === 1 ? 'booking' : 'bookings'}`}</span></div>
        {loading ? <div className="booking-skeleton-list" role="status" aria-label="Loading bookings"><span /><span /><span /></div> : error ? <ErrorState error={error} onRetry={retry} /> : rows.length ? <BookingAgenda listViews paginated={total > PAGE_SIZE} rows={rows} context={row => resources.find(resource => resource.id === row.resource_id)?.name ?? row.kind.replaceAll('_', ' ')} resource={row => resources.find(resource => resource.id === row.resource_id)?.name} actionLabel={row => next[row.status] ? `${next[row.status]!.label} booking` : undefined} onAction={row => { if (next[row.status]?.status === 'completed') setCompleteTarget(row); else void advance(row); }} busy={working} /> : <p className="workflow-empty">{search ? 'No bookings match that search. Try a service name or status.' : 'No bookings for this business yet.'}</p>}
        {total > PAGE_SIZE && <nav className="booking-pagination" aria-label="Booking pages"><span>Page {page + 1} of {Math.ceil(total / PAGE_SIZE)}</span><div><button type="button" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>Previous</button><button type="button" disabled={(page + 1) * PAGE_SIZE >= total || loading} onClick={() => setPage(page + 1)}>Next</button></div></nav>}
      </section>}</div>
    {view === 'setup' && <div className="owner-booking-setup"><header className="booking-setup-heading"><h2>Booking setup</h2><p>Set what customers can book, who or what is available, and your working hours.</p></header>
      <div className="booking-setup-tabs" role="tablist" aria-label="Booking setup sections" onKeyDown={navigateSetup}>{setupSections.map(section => <button key={section.value} type="button" role="tab" id={`booking-setup-tab-${section.value}`} aria-selected={setupSection === section.value} aria-controls={`booking-setup-panel-${section.value}`} tabIndex={setupSection === section.value ? 0 : -1} onClick={() => openSetup(section.value)}><WorkflowIcon name={section.icon} /><span><strong>{section.label}</strong><small>{section.description}</small></span>{section.value !== 'hours' && <span className="booking-setup-count" aria-label={`${section.value === 'services' ? services.length : resources.length} ${section.label.toLowerCase()}`}>{section.value === 'services' ? servicesLoading ? '…' : services.length : resourcesLoading ? '…' : resources.length}</span>}</button>)}</div>
      <div id="booking-setup-panel-services" role="tabpanel" aria-labelledby="booking-setup-tab-services" hidden={setupSection !== 'services'}><section className="workflow-panel" aria-labelledby="service-heading"><div className="workflow-panel-heading"><h2 id="service-heading">Priced services</h2><p>Set the price and length of each appointment. Customers pay before you confirm their booking.</p></div>
      <details className="booking-setup-add" key={`service-${storeId}-${Boolean(services.length)}`} open={!services.length}><summary><WorkflowIcon name="plus" />Add service</summary><form className="workflow-form workflow-inline-form workflow-service-form" onSubmit={createService}><label>Service name<input name="service_name" autoComplete="off" required maxLength={160} value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="e.g. Consultation" /></label><label>Duration (minutes)<input name="service_duration" autoComplete="off" required type="number" min="15" max="240" value={serviceDuration} onChange={e => setServiceDuration(e.target.value)} /></label><label>Price (ZMW)<input name="service_price" autoComplete="off" inputMode="decimal" required type="number" min="0.01" step="0.01" value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="150.00" /></label><button className="workflow-primary" type="submit" disabled={working || !storeId || servicesLoading || Boolean(servicesError)} aria-busy={working}>{working ? 'Saving…' : 'Add service'}</button></form></details>
      <div className="booking-toolbar"><label htmlFor="service-search">Find a service</label><input id="service-search" type="search" value={serviceQuery} onChange={e => { setServiceQuery(e.target.value); setServicePage(0); }} placeholder="Search services" /><span>{matchingServices.length} {matchingServices.length === 1 ? 'service' : 'services'}</span></div>
      {servicesLoading ? <p className="workflow-empty" role="status">Loading services…</p> : servicesError ? <ErrorState error={servicesError} onRetry={reloadServices} /> : visibleServices.length > 0 ? <div className="booking-setup-table" role="region" aria-label="Priced services" tabIndex={0}><RecordListTable><thead><tr><th scope="col">Service</th><th scope="col">Duration</th><th scope="col">Price</th><th scope="col">Availability</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{visibleServices.map(service => <tr key={service.id}><th scope="row">{service.name}</th><td>{service.duration_minutes} min</td><td>{money(service.price, service.currency)}</td><td>{service.is_active ? 'Available online' : 'Paused'}</td><td><button type="button" className="workflow-text-action" disabled={working} onClick={() => toggleService(service)} aria-label={`${service.is_active ? 'Pause' : 'Enable'} ${service.name}`}>{service.is_active ? 'Pause' : 'Enable'}</button></td></tr>)}</tbody></RecordListTable></div> : <p className="workflow-empty">{serviceQuery ? 'No services match that search.' : 'No priced services yet. Use Add service to set your first appointment price.'}</p>}
      {matchingServices.length > SERVICE_PAGE_SIZE && <nav className="booking-pagination" aria-label="Service pages"><span>Page {servicePage + 1} of {Math.ceil(matchingServices.length / SERVICE_PAGE_SIZE)}</span><div><button type="button" disabled={servicePage === 0} onClick={() => setServicePage(servicePage - 1)}>Previous</button><button type="button" disabled={(servicePage + 1) * SERVICE_PAGE_SIZE >= matchingServices.length} onClick={() => setServicePage(servicePage + 1)}>Next</button></div></nav>}
    </section></div>
    <div id="booking-setup-panel-resources" role="tabpanel" aria-labelledby="booking-setup-tab-resources" hidden={setupSection !== 'resources'}><section className="workflow-panel" aria-labelledby="resource-heading"><div className="workflow-panel-heading"><h2 id="resource-heading">Bookable resources</h2><p>Add the staff, chairs, bays or rooms used for appointments. Capacity is the number of bookings a resource can handle at the same time.</p></div>
      <details className="booking-setup-add" key={`resource-${storeId}-${Boolean(resources.length)}`} open={!resources.length}><summary><WorkflowIcon name="plus" />Add resource</summary>
        <form className="workflow-form" onSubmit={createResource}>
          <label>Resource name<input name="resource_name" autoComplete="off" required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Daniel — service visits" /></label>
          <label>Employee (optional)<select value={employeeId} onChange={e=>{setEmployeeId(e.target.value);if(e.target.value)setCapacity('1');}}><option value="">Shared space or capacity; no employee</option>{team.map(m=><option key={m.user_id} value={m.user_id}>{m.display_name || m.user?.full_name || 'Team member'}</option>)}</select></label>
          <p className="workflow-help">Link a staff member so appointments and field visits share that employee’s availability. Employee resources accept one booking at a time.</p>
          <label>Bookings at a time<input name="resource_capacity" autoComplete="off" required type="number" min="1" max="100" disabled={Boolean(employeeId)} value={employeeId?'1':capacity} onChange={e=>setCapacity(e.target.value)} /></label>
          <button className="workflow-primary" type="submit" disabled={working || !storeId || resourcesLoading || Boolean(resourcesError)} aria-busy={working}>{working?'Saving…':'Add resource'}</button>
        </form>
      </details>
      {resourcesLoading ? <p className="workflow-empty" role="status">Loading resources…</p> : resourcesError ? <ErrorState error={resourcesError} onRetry={reloadResources} /> : !resources.length && <p className="workflow-empty">No resources yet. Add the staff or space customers can reserve.</p>}
      {!resourcesLoading && !resourcesError && resources.length > 0 && <ul className="workflow-list">{resources.map(resource => <li key={resource.id} className="workflow-list-item"><div><strong>{resource.name}</strong><span>Capacity {resource.capacity} · {resource.is_active ? 'Available online' : 'Paused'}</span></div><button type="button" className="workflow-text-action" disabled={working} onClick={() => toggleResource(resource)} aria-label={`${resource.is_active ? 'Pause' : 'Enable'} ${resource.name}`}>{resource.is_active ? 'Pause' : 'Enable'}</button></li>)}</ul>}
    </section></div>
    <div id="booking-setup-panel-hours" role="tabpanel" aria-labelledby="booking-setup-tab-hours" hidden={setupSection !== 'hours'}>{storeId && <BookingHoursEditor key={storeId} storeId={storeId} />}</div>
    </div>}
    <ConfirmDialog open={Boolean(completeTarget)} title="Complete this booking?" description={completeTarget ? `${completeTarget.title} will be marked complete. This cannot be undone from the booking screen.` : undefined} confirmLabel="Complete booking" cancelLabel="Keep in progress" tone="primary" busy={working} onCancel={() => setCompleteTarget(null)} onConfirm={() => { if (completeTarget) void advance(completeTarget); }} />
  </section>;
}
