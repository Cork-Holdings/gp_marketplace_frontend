import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Reservation } from '@/types/serviceQuote';
import { WorkflowPaymentPanel } from '@/components/common/WorkflowPaymentPanel';
import { PaymentReceipts } from '@/components/payments/PaymentReceipts';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import { CustomerWorkflowList } from '@/components/common/CustomerWorkflowList';
import { workflowDate, workflowGroup } from '@/lib/workflowView';

const money = (amount: string, currency = 'ZMW') => new Intl.NumberFormat('en-ZM', { style: 'currency', currency }).format(Number(amount));
const dateKey = (value: string) => new Date(value).toLocaleDateString('en-CA');

type Props = {
  rows: Reservation[];
  context: (row: Reservation) => string;
  resource?: (row: Reservation) => string | undefined;
  actionLabel?: (row: Reservation) => string | undefined;
  onAction?: (row: Reservation) => void;
  busy?: boolean;
  customerPayments?: boolean;
  listViews?: boolean;
  paginated?: boolean;
};

/** A compact day-by-day view; details and actions stay one click away. */
export function BookingAgenda({ rows, context, resource, actionLabel, onAction, busy, customerPayments = false, listViews = false, paginated = false }: Props) {
  const [params, setParams] = useSearchParams();
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  const selectedId = params.get('detail') ?? localSelectedId;
  const setSelectedId = (id: string | null) => {
    setLocalSelectedId(id);
    if (params.has('detail')) setParams(current => {
      const next = new URLSearchParams(current);
      if (id) next.set('detail', id); else next.delete('detail');
      return next;
    }, { replace: true });
  };
  const selected = rows.find(row => row.id === selectedId) ?? null;
  const groups = useMemo(() => {
    const byDay = new Map<string, Reservation[]>();
    rows.forEach(row => {
      const key = dateKey(row.starts_at);
      byDay.set(key, [...(byDay.get(key) ?? []), row]);
    });
    return [...byDay.entries()].map(([key, items]) => ({ key, items: [...items].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()) }));
  }, [rows]);
  const today = dateKey(new Date().toISOString());

  return <>
    {listViews ? <CustomerWorkflowList label="bookings" contextHeading={customerPayments ? 'Business' : 'Resource'} dateHeading="Scheduled" valueHeading="Service price" paginated={paginated} onOpen={setSelectedId}
      items={rows.map(row => ({
        id: row.id, title: row.title, context: context(row), date: workflowDate(row.starts_at, true), status: row.status,
        value: row.price_amount ? money(row.price_amount, row.price_currency ?? 'ZMW') : 'Not recorded',
        group: workflowGroup(row.status, !customerPayments && row.status === 'requested'), actionLabel: 'View booking', description: row.notes,
        facts: [
          { label: customerPayments ? 'Business' : 'Resource', value: context(row) },
          { label: 'Starts', value: workflowDate(row.starts_at, true) },
          { label: 'Ends', value: workflowDate(row.ends_at, true) },
          { label: 'Booking type', value: row.kind.replaceAll('_', ' ') },
        ],
      }))} empty={<p className="workflow-empty">No bookings to display.</p>} /> : <div className="booking-agenda" aria-label="Booking schedule">
      {groups.map(({ key, items }) => {
        const day = new Date(items[0].starts_at);
        return <section className="booking-day" data-today={key === today} key={key} aria-label={day.toLocaleDateString(undefined, { dateStyle: 'full' })}>
          <header className="booking-day-header"><span className="booking-day-date" aria-hidden="true"><b>{day.toLocaleDateString(undefined, { day: '2-digit' })}</b><small>{day.toLocaleDateString(undefined, { month: 'short' })}</small></span><div><h3>{key === today ? 'Today' : day.toLocaleDateString(undefined, { weekday: 'long' })}</h3><p>{day.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} · {items.length} {items.length === 1 ? 'booking' : 'bookings'}</p></div></header>
          <ul className="booking-day-items">{items.map(row => <li key={row.id}><button type="button" className="booking-agenda-item" onClick={() => setSelectedId(row.id)} aria-label={`View ${row.title}, ${new Date(row.starts_at).toLocaleString()}, ${row.status.replaceAll('_', ' ')}`}><span className="booking-agenda-time"><WorkflowIcon name="clock" size={16} />{new Date(row.starts_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span><span className="booking-agenda-summary"><strong>{row.title}</strong><small><WorkflowIcon name="store" size={14} />{context(row)}</small></span><span className="booking-agenda-meta"><StatusBadge status={row.status} />{row.price_amount && <small>{money(row.price_amount, row.price_currency ?? 'ZMW')}</small>}</span><svg aria-hidden="true" className="booking-agenda-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg></button></li>)}</ul>
        </section>;
      })}
    </div>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelectedId(null); }}>
      {selected && <DialogContent size="md" className="booking-detail-dialog max-h-[calc(100dvh-2rem)] !w-[calc(100vw-2rem)] overflow-hidden" aria-describedby="booking-detail-description">
        <DialogHeader><DialogTitle>{selected.title}</DialogTitle><button type="button" className="booking-modal-close" onClick={() => setSelectedId(null)} aria-label="Close booking details">✕</button></DialogHeader>
        <DialogBody className="booking-detail-body"><p id="booking-detail-description" className="booking-detail-lead">{context(selected)}</p><dl className="booking-detail-list"><div><dt>Status</dt><dd><StatusBadge status={selected.status} /></dd></div><div><dt>Date</dt><dd>{new Date(selected.starts_at).toLocaleDateString(undefined, { dateStyle: 'full' })}</dd></div><div><dt>Time</dt><dd>{new Date(selected.starts_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}–{new Date(selected.ends_at).toLocaleTimeString(undefined, { timeStyle: 'short' })}</dd></div>{resource?.(selected) && <div><dt>With whom or where</dt><dd>{resource(selected)}</dd></div>}<div><dt>Service price</dt><dd>{selected.price_amount ? money(selected.price_amount, selected.price_currency ?? 'ZMW') : 'Not recorded'}</dd></div>{selected.notes && <div><dt>Note</dt><dd>{selected.notes}</dd></div>}</dl>{selected.status === 'expired' && <p role="status" className="booking-preselection">The 15-minute payment hold ended without a confirmed or pending payment. Please choose an available time and make a new booking.</p>}{customerPayments && selected.status === 'requested' && <p className="booking-preselection">Unpaid bookings hold the time for 15 minutes. If a payment is pending, your time stays reserved while its result is checked.</p>}</DialogBody>
        <DialogFooter className="booking-detail-footer">{customerPayments && selected.price_amount && (['requested','confirmed'].includes(selected.status) ? <WorkflowPaymentPanel kind="reservation" sourceId={selected.id} stage="full" label="Pay for this booking" compact /> : <PaymentReceipts key={selected.id} kind="reservation" sourceId={selected.id} compact/>)}<div className="booking-detail-footer-actions"><button type="button" className="booking-back-button" onClick={() => setSelectedId(null)}>Close</button>{onAction && actionLabel?.(selected) && <button type="button" className={customerPayments ? 'booking-cancel-button' : 'workflow-primary'} disabled={busy} onClick={() => { const row = selected; setSelectedId(null); onAction(row); }}>{actionLabel(selected)}</button>}</div></DialogFooter>
      </DialogContent>}
    </Dialog>
  </>;
}
