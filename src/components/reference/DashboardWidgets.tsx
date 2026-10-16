import { Link } from 'react-router-dom';
import { ReferenceIcon } from './ReferenceIcon';
import { Photo } from './ReferenceUI';
import type { Product } from '@/types/product';
import { orderSummary } from '@/lib/orderSummary';

export function OrderSummaryRows({ counts, loading, restricted = false }: { counts?: Record<string, number>; loading?: boolean; restricted?: boolean }) {
  const summary = orderSummary(counts);
  if (!summary) return <p className="reference-note" role="status">{restricted ? 'Your role cannot view order summaries.' : loading ? 'Loading orders…' : 'Order summary unavailable. Use View All to open the orders page.'}</p>;
  return <div className="reference-status-list"><p className="reference-small">{summary.total} orders · All time</p>{summary.rows.length ? summary.rows.map(row => <div className="reference-status-row" key={row.status}><span className="reference-tile tone-blue"><ReferenceIcon name={row.status === 'completed' ? 'check' : row.status === 'cancelled' ? 'close' : 'bag'} size={15}/></span><span>{row.label}</span><strong>{row.count}</strong></div>) : <p className="reference-note">No orders yet. New orders will appear here.</p>}</div>;
}

export function StockRows({ products }: { products: Product[] }) {
  const rows = products.filter(product => !product.variants?.length && Number.isFinite(product.stock_quantity) && product.stock_quantity <= 10).slice(0, 3);
  if (!rows.length) return <div className="reference-pending"><ReferenceIcon name="layers" size={25}/><p>No listed items at 10 units or below</p><small>Check variants and availability in Inventory.</small></div>;
  return <div className="reference-stock-list">{rows.map(product => <Link className="reference-stock-row" key={product.id} to="/portal/owner/inventory"><Photo src={product.image_url} className="reference-stock-photo"/><div><strong>{product.name}</strong><small>{product.stock_quantity} left in stock</small></div><ReferenceIcon name="arrow" size={12}/></Link>)}</div>;
}

export type ActivityRow = { title: string; detail: string; age: string; icon: string; tone: string; to?: string };
export function ActivityRows({ rows }: { rows: ActivityRow[] }) {
  return <div className="reference-activity">{rows.map((item,index) => {
    const content = <><span className={`reference-tile tone-${item.tone}`}><ReferenceIcon name={item.icon} size={15}/></span><div><strong>{item.title}</strong><p>{item.detail}</p></div><span>{item.age}</span></>;
    return item.to ? <Link className="reference-activity-row" key={`${item.title}-${index}`} to={item.to}>{content}</Link> : <div key={`${item.title}-${index}`} className="reference-activity-row">{content}</div>;
  })}</div>;
}
