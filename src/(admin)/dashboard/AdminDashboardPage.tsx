import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { AdminDashboardHeader, AdminDashboardOverview } from './AdminDashboard';

export default function AdminDashboardPage() {
  const { isAdmin, user } = useAuth();
  if (!isAdmin) return <Navigate to="/portal" replace />;

  const displayName = user?.full_name ?? user?.email ?? 'Admin';

  return (
    <div className="space-y-6">
      <AdminDashboardHeader userName={displayName} />
      <AdminDashboardOverview />
    </div>
  );
}
