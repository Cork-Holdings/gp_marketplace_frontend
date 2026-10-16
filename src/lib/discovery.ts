import { recordedCurrency } from './recordedData';
import type { PurchaseFlow } from './purchaseFlow';
import { purchaseActionPath } from './purchaseFlow';
import type { Product } from '@/types/product';
import type { Store } from '@/types/store';

export type DiscoveryKind = 'all' | 'products' | 'services';
export type DiscoveryCategory = 'food' | 'fashion' | 'barbering' | 'repairs' | 'cakes' | 'carwash' | 'care' | 'wholesale' | 'other';
export const DISCOVERY_CATEGORIES: { id: DiscoveryCategory; label: string }[] = [
  { id: 'food', label: 'Food' }, { id: 'fashion', label: 'Fashion' },
  { id: 'barbering', label: 'Barbering' }, { id: 'repairs', label: 'Home repairs' },
  { id: 'cakes', label: 'Custom cakes' }, { id: 'carwash', label: 'Car wash' },
  { id: 'care', label: 'Home care' }, { id: 'wholesale', label: 'Wholesale' },
];
export interface DiscoveryOffering {
  id: string; store_id: string; name: string; description: string;
  image_url: string | null; flow: PurchaseFlow; price: string; max_price: string;
  duration_minutes: number; source: 'product' | 'service' | 'provider'; store_name: string; slug: string;
  store_category: string; store_type: string; currency: string; branch: string;
  category: DiscoveryCategory; kind: 'products' | 'services';
  booking_available: boolean;
}
export interface DiscoveryPage { offerings: DiscoveryOffering[]; total: number; limit: number; offset: number }

export function categoryForItem(product: Product, store?: Store): DiscoveryCategory {
  const type = store?.store_type ?? '';
  if (product.purchase_flow === 'wholesale' || type === 'WHOLESALER') return 'wholesale';
  if (type === 'CAKE_MAKER' || /cake/i.test(product.name)) return 'cakes';
  if (['BARBERSHOP', 'MOBILE_BARBER', 'SALON'].includes(type) || /haircut|barber|shave|beard/i.test(product.name)) return 'barbering';
  if (['PLUMBER', 'ELECTRICIAN', 'MECHANIC', 'CARPENTER', 'LOCKSMITH'].includes(type)) return 'repairs';
  if (['CAR_WASH', 'MOBILE_CAR_WASH'].includes(type)) return 'carwash';
  if (store?.store_category === 'ON_SITE_SERVICE') return 'care';
  if (store?.store_category === 'FOOD_BEVERAGE') return 'food';
  if (['BOUTIQUE', 'FASHION', 'TAILOR'].includes(type) || /shirt|dress|trouser|tote|suit/i.test(product.name)) return 'fashion';
  return 'other';
}

export function offeringPath(o: DiscoveryOffering) {
  if (o.flow === 'booking' && !o.booking_available) return `/store/${encodeURIComponent(o.slug)}#shop`;
  return purchaseActionPath(o.flow, { id: o.id, name: o.name } as Product, { id: o.store_id, slug: o.slug } as Store)
    ?? `/store/${encodeURIComponent(o.slug)}?item=${encodeURIComponent(o.name)}#shop`;
}
export function offeringAction(o: DiscoveryOffering) {
  if (o.flow === 'booking' && !o.booking_available) return 'View services';
  return { booking: 'Book', quote: 'Request estimate', custom_request: 'Customise', wholesale: 'Request bulk', checkout: 'Shop item' }[o.flow];
}
export function offeringPrice(o: DiscoveryOffering) {
  if (o.flow === 'booking' && o.source === 'provider') return 'Explore service options';
  if (o.flow === 'quote') return 'Price after assessment';
  if (o.flow === 'custom_request') return 'Made to order · Price by quote';
  if (o.flow === 'wholesale') return 'Bulk quantity · Price by quote';
  const price = recordedCurrency(o.price, o.currency);
  return `${o.flow === 'booking' && o.source === 'product' ? 'Listed ' : Number(o.max_price) > Number(o.price) ? 'From ' : ''}${price}`;
}
export function offeringContext(o: DiscoveryOffering) {
  if (o.flow === 'booking' && !o.booking_available) return 'Explore services with the business';
  if (o.flow === 'booking') return o.duration_minutes ? `${o.duration_minutes} min · Choose a time` : 'Choose a service & time';
  if (o.flow === 'quote') return o.store_category === 'ON_SITE_SERVICE' ? 'Work at your place' : 'Discuss your requirements';
  if (o.flow === 'checkout') return 'Choose options at the store';
  return o.branch || 'Discuss your requirements';
}
