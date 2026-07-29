import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { CreateStoreForm, StoreListAdmin } from '../dashboard/AdminPanels';

export default function AdminStoresPage() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/portal" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">All Stores</h1>
        <p className="mt-1 text-sm text-forest-muted">
          Manage marketplace storefronts attached to merchant businesses.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CreateStoreForm />
        <div>
          <h2 className="mb-3 font-semibold text-charcoal">Platform Stores</h2>
          <StoreListAdmin />
        </div>
      </div>
    </div>
  );
}
