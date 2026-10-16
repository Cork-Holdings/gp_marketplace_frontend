import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { KycVerificationPanel } from './KycVerificationPanel';

export default function AdminKycPage() {
  const { isAdmin } = useAuth();
  const [params] = useSearchParams();
  if (!isAdmin) return <Navigate to="/portal" replace />;

  return (
    <div className="space-y-6">
      {!params.has('review') && <div>
        <h1 className="text-2xl font-bold text-charcoal">Merchant KYC</h1>
        <p className="mt-1 text-sm text-forest-muted">
          Verify business registration and identity documents before onboarding merchants.
        </p>
      </div>}
      <KycVerificationPanel />
    </div>
  );
}
