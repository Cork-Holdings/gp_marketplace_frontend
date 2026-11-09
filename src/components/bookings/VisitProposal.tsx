import { visitWindow } from '@/lib/bookingTime';
import type { ServiceQuote } from '@/types/serviceQuote';

export function VisitProposal({quote}:{quote:ServiceQuote}) {
  if (!quote.scheduled_at && !quote.requested_at) return null;
  const changed=Boolean(quote.requested_at && quote.scheduled_at && Date.parse(quote.requested_at)!==Date.parse(quote.scheduled_at));
  const requestOnly=quote.status==='draft' && !quote.lines?.length;
  return <section className="my-4 rounded-xl bg-cream/60 p-4" aria-label="Visit arrangement">
    <h3 className="font-semibold">{requestOnly ? 'Requested arrival' : quote.status==='accepted' ? 'Agreed visit window' : 'Proposed visit window'}</h3>
    <p className="mt-1 text-sm font-medium">{visitWindow(quote.scheduled_at ?? quote.requested_at,requestOnly ? undefined : quote.scheduled_end_at)}</p>
    {changed && <p className="mt-2 text-sm text-forest-muted">Originally requested: {visitWindow(quote.requested_at)}</p>}
    {quote.status==='sent' && <p className="mt-2 text-sm text-forest-muted">Review this time before accepting the estimate.{changed ? ' The provider has suggested a different arrival time.' : ''}</p>}
    {!quote.scheduling_resource_id && <p className="mt-2 text-sm text-forest-muted">A team member still needs to be assigned. This time-only proposal does not reserve employee availability.</p>}
  </section>;
}
