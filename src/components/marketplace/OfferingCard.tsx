import { Link } from 'react-router-dom';
import type { DiscoveryOffering } from '@/lib/discovery';
import { offeringAction, offeringContext, offeringPath, offeringPrice } from '@/lib/discovery';
import { CatalogueImage } from './CatalogueImage';
import { DiscoveryIcon } from './DiscoveryIcon';
export function OfferingCard({ offering: o, eager = false }: { offering: DiscoveryOffering; eager?: boolean }) {
  const path = offeringPath(o);
  return <article className="discovery-offering">
    <Link className={`discovery-offering-image discovery-art-${o.category}`} to={path} aria-label={`Explore ${o.name} from ${o.store_name}`}>
      <CatalogueImage imageUrl={o.image_url} alt={o.name} category={o.category} eager={eager} labelClassName="discovery-illustration-label" />
    </Link>
    <div className="discovery-offering-copy"><p className="discovery-offering-kind">{o.kind === 'services' ? 'Service' : o.source === 'provider' ? o.flow === 'wholesale' ? 'Wholesale' : 'Made to order' : 'Product'}</p><h3><Link to={path}>{o.name}</Link></h3><Link to={`/store/${encodeURIComponent(o.slug)}`} className="discovery-seller">{o.store_name}</Link><p className="discovery-offering-price">{offeringPrice(o)}</p><p className="discovery-offering-context">{offeringContext(o)}</p><Link className="discovery-offering-action" to={path} aria-label={`${offeringAction(o)}: ${o.name} from ${o.store_name}`}>{offeringAction(o)}<DiscoveryIcon name="arrow" size={16} /></Link></div>
  </article>;
}
