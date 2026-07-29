import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { MerchantOnboardingWizard } from '@/components/onboarding/MerchantOnboardingWizard';

export default function MerchantAddBusinessPage() {
  const { isMerchant } = useAuth();
  if (!isMerchant) return <Navigate to="/portal" replace />;
  return <MerchantOnboardingWizard mode="additional" />;
}
