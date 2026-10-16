import { WorkflowArtwork } from './WorkflowVisuals';
import { WorkflowIcon } from './WorkflowIcon';
import { orderLaneIcon } from '@/lib/orderBoardIcons';

export function OrderBoardEmpty({ lanes }: { lanes: {key: string; label: string}[] }) {
  return <section className="order-board-empty" aria-labelledby="empty-order-board-title">
    <div className="order-board-empty-intro"><WorkflowArtwork kind="order" /><div><h2 id="empty-order-board-title">Ready for your next order</h2><p>Checkout orders will appear here as customers buy from your storefront. Manage appointments in Bookings and made-to-order or bulk requests in Custom orders.</p></div></div>
    <ol className="order-board-empty-stages" aria-label="Order workflow stages">{lanes.map(lane => <li key={lane.key}><WorkflowIcon name={orderLaneIcon(lane.key)} size={20} /><span>{lane.label}</span></li>)}</ol>
  </section>;
}
