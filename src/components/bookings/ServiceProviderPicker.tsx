import { Link } from 'react-router-dom';
import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import type { ServiceProvider } from '@/types/serviceQuote';

const typeNames: Record<string, string> = {
  BARBERSHOP: 'Barbershop', SALON: 'Salon & spa', MOBILE_BARBER: 'Mobile barber',
  PLUMBER: 'Plumbing', ELECTRICIAN: 'Electrical', HOME_SERVICES: 'Home services',
};
const price = (amount: string, currency: string) =>
  new Intl.NumberFormat('en-ZM', { style: 'currency', currency }).format(Number(amount));

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  providers: ServiceProvider[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  selectedStoreId: string;
  onSelect: (provider: ServiceProvider) => void;
  loading: boolean;
  error?: string;
}

export function ServiceProviderPicker({ query, onQueryChange, providers, total, page, pageSize, onPageChange, selectedStoreId, onSelect, loading, error }: Props) {
  return <div className="booking-provider-picker">
    <label htmlFor="booking-provider-search">Find a service or business
      <span className="booking-provider-search"><WorkflowIcon name="search" /><input id="booking-provider-search" type="search" value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Try plumbing, haircut or a business name" autoComplete="off" /></span>
    </label>
    <div className="booking-picker-heading"><h3>Providers</h3><span aria-live="polite">{loading ? 'Searching…' : `${total} ${total === 1 ? 'match' : 'matches'}`}</span></div>
    {loading ? <div className="booking-skeleton-list" role="status" aria-label="Finding service providers"><span /><span /></div>
      : error ? <p className="workflow-feedback is-error" role="alert">{error}</p>
      : providers.length ? <ul className="booking-provider-list">{providers.map(provider => {
        const canBook = provider.service_count > 0 && provider.resource_count > 0;
        const selected = provider.store_id === selectedStoreId;
        return <li key={provider.store_id}>
          {canBook ? <button type="button" className="booking-provider-row" aria-pressed={selected} onClick={() => onSelect(provider)}>
            <span className="booking-provider-glyph" aria-hidden="true"><WorkflowIcon name="calendar" /></span>
            <span className="booking-provider-main"><strong>{provider.name}</strong><small>{typeNames[provider.store_type] ?? 'Service provider'} · {provider.description || `${provider.service_count} bookable services`}</small></span>
            <span className="booking-provider-meta"><strong>{provider.from_price ? `From ${price(provider.from_price, provider.currency)}` : 'See services'}</strong><small>{selected ? 'Selected' : 'Choose provider'}</small></span>
          </button> : <Link className="booking-provider-row booking-provider-link" to={provider.store_category === 'ON_SITE_SERVICE' ? `/account/quotes?store=${provider.store_id}&request=1` : `/store/${provider.slug}#shop`} aria-label={provider.store_category === 'ON_SITE_SERVICE' ? `Request an estimate from ${provider.name}` : `View ${provider.name}`}>
            <span className="booking-provider-glyph" aria-hidden="true"><WorkflowIcon name="settings" /></span>
            <span className="booking-provider-main"><strong>{provider.name}</strong><small>{typeNames[provider.store_type] ?? 'Service provider'} · {provider.description || 'View the business for details'}</small></span>
            <span className="booking-provider-meta"><strong>{provider.store_category === 'ON_SITE_SERVICE' ? 'Price after estimate' : 'Booking not set up'}</strong><small>{provider.store_category === 'ON_SITE_SERVICE' ? 'Request estimate →' : 'View business →'}</small></span>
          </Link>}
        </li>;
      })}</ul> : <p className="booking-picker-empty">{query.trim() ? 'No providers match that search. Try another service or business name.' : 'No service providers are available yet.'}</p>}
    {total > pageSize && <nav className="booking-pagination" aria-label="Provider pages"><span>Page {page + 1} of {Math.ceil(total / pageSize)}</span><div><button type="button" disabled={page === 0 || loading} onClick={() => onPageChange(page - 1)}>Previous</button><button type="button" disabled={(page + 1) * pageSize >= total || loading} onClick={() => onPageChange(page + 1)}>Next</button></div></nav>}
  </div>;
}
