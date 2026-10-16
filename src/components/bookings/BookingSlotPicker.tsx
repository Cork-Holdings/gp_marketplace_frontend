import { useEffect, useRef, useState } from 'react';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { bookingScheduleApi, type BookingAvailability } from '@/lib/api/services/bookingSchedule';
import { bookingDate, bookingDateLimit, bookingTime } from '@/lib/bookingTime';
import { userMessage } from '@/lib/userMessage';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import './booking-schedule.css';

type Props = { storeId: string; serviceId: string; resourceId: string; value: string; onChange: (value: string) => void; owner?: boolean };
const PAGE_SIZE = 12;

export function BookingSlotPicker({ storeId, serviceId, resourceId, value, onChange, owner = false }: Props) {
  const [date, setDate] = useState(() => value ? bookingDate(new Date(value)) : bookingDate());
  const [page, setPage] = useState(0);
  const key = `${storeId}/${serviceId}/${resourceId}/${date}`;
  const enabled = Boolean(storeId && serviceId && resourceId && date);
  const { data, loading, error, retry } = useFetchWrapper(async ({ signal }) => ({
    ...(await bookingScheduleApi.slots(storeId, serviceId, resourceId, date, owner, signal)), requestKey: key,
  }), [key, owner], { enabled });
  const result = data?.requestKey === key ? data as BookingAvailability : null;
  const slots = result?.slots ?? [];
  const pages = Math.ceil(slots.length / PAGE_SIZE);

  const selectionKey = `${storeId}/${serviceId}/${resourceId}`;
  const previousSelection = useRef(selectionKey);
  useEffect(() => {
    if (previousSelection.current !== selectionKey) { onChange(''); setPage(0); }
    previousSelection.current = selectionKey;
  }, [selectionKey, onChange]);
  useEffect(() => {
    if (result && !loading && value && !result.slots.some(slot => slot.starts_at === value)) onChange('');
  }, [result, loading, value, onChange]);

  return <fieldset className="booking-slot-picker">
    <legend><WorkflowIcon name="calendar" />Choose a date & time</legend>
    <p className="booking-timezone"><WorkflowIcon name="pin" />Lusaka time (UTC+2) · Up to 90 days ahead</p>
    <label className="booking-slot-date">Appointment date<input name="appointment-date" autoComplete="off" type="date" min={bookingDate()} max={bookingDateLimit()} value={date} onChange={event => { setDate(event.target.value); setPage(0); onChange(''); }} /></label>
    {!enabled ? <p className="booking-slot-notice">Choose a service and a bookable resource to see available times.</p>
      : loading || (!result && !error) ? <div className="booking-slot-skeleton" role="status" aria-label="Checking available times">{Array.from({ length: 8 }, (_, i) => <span key={i} />)}</div>
      : error ? <div className="booking-slot-notice"><p role="alert">{userMessage(error, 'Could not check available times. Please try again.')}</p><button type="button" onClick={() => { void retry().catch(() => {}); }}>Try again</button></div>
      : !result?.configured ? <p className="booking-slot-notice" role="status">Online hours have not been set up yet. {owner ? 'Open Services & capacity and save the branch opening hours first.' : 'Choose another provider or contact this business to arrange a time.'}</p>
      : !slots.length ? <div className="booking-slot-notice" role="status"><WorkflowIcon name="calendar" size={24} /><p>No available times on this date. Try another date or resource.</p><button type="button" onClick={() => { void retry().catch(() => {}); }}>Refresh availability</button></div>
      : <><div className="booking-slot-heading"><span aria-live="polite">{slots.length} available {slots.length === 1 ? 'time' : 'times'}</span><button type="button" className="workflow-text-action" aria-label="Refresh available times" onClick={() => { onChange(''); setPage(0); void retry().catch(() => {}); }}><WorkflowIcon name="refresh" />Refresh</button></div>
        <div className="booking-slot-grid" role="group" aria-label="Available appointment times">{slots.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(slot => <button key={slot.starts_at} type="button" aria-pressed={value === slot.starts_at} onClick={() => onChange(slot.starts_at)}><WorkflowIcon name={value === slot.starts_at ? 'check' : 'clock'} /><span>{bookingTime(slot.starts_at)}</span></button>)}</div>
        {pages > 1 && <nav className="booking-pagination" aria-label="Available time pages"><span>{page + 1} of {pages}</span><div><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>Earlier</button><button type="button" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Later</button></div></nav>}
        <p className="booking-slot-hint">{value ? `Selected: ${bookingTime(value)}. ` : 'Select a time to continue. '}Availability is checked again when you send the request.</p>
      </>}
  </fieldset>;
}
