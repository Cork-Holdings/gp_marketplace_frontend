import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { MerchantOnboardingWizard } from '@/components/onboarding/MerchantOnboardingWizard';

export default function AdminMerchantOnboardPage() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/portal" replace />;
  return <MerchantOnboardingWizard mode="admin" />;
}
