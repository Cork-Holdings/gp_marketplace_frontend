import { Outlet } from 'react-router-dom';
import { CartProvider } from '@/lib/context/cart';

/** Public storefront shell — cart context scoped to customer shopping. */
export function PublicStorefrontLayout() {
  return (
    <CartProvider>
      <Outlet />
    </CartProvider>
  );
}

export default PublicStorefrontLayout;
