import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';

export default function PortalHomePage() {
  const { isAdmin, isStoreOwner, isCustomer } = useAuth();

  if (isAdmin) return <Navigate to="/portal/admin" replace />;
  if (isStoreOwner) return <Navigate to="/portal/owner" replace />;
  if (isCustomer) return <Navigate to="/account/ledger" replace />;
  return <Navigate to="/login" replace />;
}
