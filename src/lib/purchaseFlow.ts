import type { Product } from '@/types/product';
import type { Store } from '@/types/store';

export type PurchaseFlow = NonNullable<Product['purchase_flow']>;

export function defaultPurchaseFlow(category?: string, storeType?: string): PurchaseFlow {
  if (storeType === 'WHOLESALER') return 'wholesale';
  if (storeType === 'CAKE_MAKER') return 'custom_request';
  if (category === 'ON_PREMISE_SERVICE') return 'booking';
  if (category === 'ON_SITE_SERVICE') return 'quote';
  return 'checkout';
}

export function purchaseFlowFor(product: Product, store?: Store | null): PurchaseFlow {
  return product.purchase_flow || defaultPurchaseFlow(store?.store_category, store?.store_type);
}

export function purchaseActionLabel(flow: PurchaseFlow): string {
  switch (flow) {
    case 'booking': return 'Book service';
    case 'quote': return 'Request estimate';
    case 'custom_request': return 'Request custom order';
    case 'wholesale': return 'Request bulk order';
    default: return 'Add to cart';
  }
}

export function purchaseActionPath(flow: PurchaseFlow, product: Product, store: Store): string | null {
  const params = new URLSearchParams({ store: store.id, item: product.name });
  switch (flow) {
    case 'booking': return `/account/bookings?${params}`;
    case 'quote': return `/account/quotes?${params}&request=1`;
    case 'custom_request': return `/account/custom-orders?${params}&kind=made_to_order`;
    case 'wholesale': return `/account/custom-orders?${params}&kind=wholesale`;
    default: return null;
  }
}
