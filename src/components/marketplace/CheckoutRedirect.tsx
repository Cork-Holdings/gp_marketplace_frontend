import { Navigate } from 'react-router-dom';
import { useCart } from '@/lib/context/useCart';
import { marketplaceHomePath, storeCheckoutPath } from '@/lib/storeRouting';

/** Legacy `/checkout` → store checkout when cart has a store, else marketplace hub. */
export function CheckoutRedirect() {
  const { store } = useCart();
  const slug = store?.slug;

  if (slug) {
    return <Navigate to={storeCheckoutPath(slug)} replace />;
  }

  return <Navigate to={marketplaceHomePath()} replace />;
}

export default CheckoutRedirect;
