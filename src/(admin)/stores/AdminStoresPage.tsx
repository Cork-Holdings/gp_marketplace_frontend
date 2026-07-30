import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { StoreListAdmin } from '../dashboard/AdminPanels';
import { Button } from '@/components/ui/button';

export default function AdminStoresPage() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/portal" replace />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">All Stores</h1>
          <p className="mt-1 text-sm text-forest-muted">
            Manage marketplace storefronts attached to merchant businesses.
          </p>
        </div>
        <Button asChild>
          <Link to="/portal/admin/stores/new">+ Add store</Link>
        </Button>
      </header>

      <StoreListAdmin />
    </div>
  );
}
