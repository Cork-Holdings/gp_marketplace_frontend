import { Navigate } from 'react-router-dom';

import { useAuth } from '@/lib/context/useAuth';

import {

  MerchantDashboardHeader,

  MerchantDashboardOverview,

} from './MerchantDashboard';



export default function OwnerDashboardPage() {

  const { isStoreOwner, user } = useAuth();



  if (!isStoreOwner) return <Navigate to="/portal" replace />;



  const displayName = user?.full_name ?? user?.email ?? 'Merchant';



  return (

    <div className="space-y-6">

      <MerchantDashboardHeader userName={displayName} />

      <MerchantDashboardOverview />

    </div>

  );

}

