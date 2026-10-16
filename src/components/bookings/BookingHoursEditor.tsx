import { useEffect, useState } from 'react';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { bookingScheduleApi, type BookingHour, type BookingSchedule } from '@/lib/api/services/bookingSchedule';
import { userMessage } from '@/lib/userMessage';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import './booking-schedule.css';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const blank = (): BookingHour[] => days.map((_, weekday) => ({ weekday, closed: true, opens_at: '09:00', closes_at: '17:00' }));

export function BookingHoursEditor({ storeId }: { storeId: string }) {
  const { data, loading, error, retry } = useFetchWrapper(() => bookingScheduleApi.get(storeId, true), [storeId]);
  const [hours, setHours] = useState<BookingHour[]>(blank);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  useEffect(() => { setHours(blank()); setFeedback(null); }, [storeId]);
  useEffect(() => { if (data) { const saved = data as BookingSchedule; setHours(blank().map(h => saved.hours.find(day => day.weekday === h.weekday) ?? h)); } }, [data]);
  function update(day: number, patch: Partial<BookingHour>) { setFeedback(null); setHours(current => current.map(h => h.weekday === day ? { ...h, ...patch } : h)); }
  async function save(event: React.FormEvent) {
    event.preventDefault(); setFeedback(null);
    const invalidDay = hours.find(h => !h.closed && (!h.opens_at || !h.closes_at || h.closes_at <= h.opens_at));
    if (invalidDay) { setFeedback({ text: 'Choose a closing time later than the opening time for each open day. Overnight hours are not supported yet.', error: true }); event.currentTarget.querySelector<HTMLInputElement>(`[name="closes-${invalidDay.weekday}"]`)?.focus(); return; }
    setSaving(true);
    try { await bookingScheduleApi.save(storeId, hours); await retry(); setFeedback({ text: hours.every(h => h.closed) ? 'Opening hours saved. Online appointments are closed on all days.' : 'Opening hours saved. Customers can now choose times within these hours.', error: false }); }
    catch (err) { setFeedback({ text: userMessage(err, 'Could not save opening hours. Your changes are still here; please try again.'), error: true }); }
    finally { setSaving(false); }
  }
  return <section className="workflow-panel" aria-labelledby="booking-hours-heading"><div className="workflow-panel-heading"><h2 id="booking-hours-heading"><WorkflowIcon name="clock" />Opening hours</h2><p>One weekly schedule for this branch’s bookable resources. Times are in Lusaka (UTC+2). Existing appointments stay unchanged.</p></div>
    {error ? <div className="workflow-form"><p role="alert">{userMessage(error, 'Could not load opening hours.')}</p><button type="button" onClick={() => { void retry().catch(() => {}); }}>Try again</button></div> : <form className="workflow-form booking-hours-form" onSubmit={save} aria-busy={loading || saving}>
      <p className="booking-slot-hint">{loading ? 'Loading opening hours…' : data?.configured ? 'Only open days and times are offered to customers. Changes affect new appointments.' : 'Online booking stays closed until you save your hours. Turn on the days you work; leave the others closed.'}</p>
      <div className="booking-hours-days">{[1, 2, 3, 4, 5, 6, 0].map(day => { const h = hours.find(h => h.weekday === day)!; return <fieldset key={day} className="booking-hours-day" disabled={loading || saving}><legend className="sr-only">{days[day]} opening hours</legend><label className="booking-hours-toggle"><input type="checkbox" name={`open-${day}`} checked={!h.closed} onChange={e => update(day, { closed: !e.target.checked, ...(e.target.checked && h.opens_at === h.closes_at ? { opens_at: '09:00', closes_at: '17:00' } : {}) })} />{days[day]}<small>{h.closed ? 'Closed' : 'Open'}</small></label>{!h.closed && <div className="booking-hours-times"><label>Opens<input type="time" name={`opens-${day}`} required autoComplete="off" value={h.opens_at} onChange={e => update(day, { opens_at: e.target.value })} /></label><span aria-hidden="true">–</span><label>Closes<input type="time" name={`closes-${day}`} required autoComplete="off" value={h.closes_at} onChange={e => update(day, { closes_at: e.target.value })} /></label></div>}</fieldset>; })}</div>
      {feedback && <p className={feedback.error ? 'workflow-feedback is-error' : 'workflow-feedback'} role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p>}
      <div className="booking-hours-actions"><p>Times start every 15 minutes from opening. Each service must finish before closing. Split shifts and date-specific closures are not supported yet.</p><button className="workflow-primary" type="submit" disabled={loading || saving}>{saving ? 'Saving…' : 'Save opening hours'}</button></div>
    </form>}
  </section>;
}
