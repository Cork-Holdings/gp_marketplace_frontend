import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { usePermissions } from '@/lib/context/permissions';
import { hasAnyRole, hasPermission as checkPermission } from '@/lib/permissions';
import type { AccountType } from '@/types/auth';
import { Skeleton } from '@/components/common/Skeleton';
import {adminEquivalentPath} from '@/lib/adminWorkspace';

export interface ProtectedRouteProps {
  children: ReactNode;
  roles?: AccountType[];
  permission?: string;
  anyPermission?: string[];
}

export function ProtectedRoute({ children, roles = [], permission, anyPermission }: ProtectedRouteProps) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const { permissions, loading: permLoading } = usePermissions();
  const location = useLocation();

  if (loading || ((permission || anyPermission?.length) && permLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !hasAnyRole(hasRole, roles)) {
    const adminPath=hasRole('system_admin')?adminEquivalentPath(location.pathname):undefined;
    if(adminPath) return <Navigate to={adminPath} replace />;
    return <Navigate to="/portal" replace />;
  }

  if (permission && !checkPermission(permissions, permission)) {
    return <Navigate to="/portal" replace />;
  }

  if (anyPermission?.length && !anyPermission.some((p) => checkPermission(permissions, p))) {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}
