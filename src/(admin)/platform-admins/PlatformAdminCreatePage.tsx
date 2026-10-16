import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api/services';
import { OnboardingLayout, OnboardingNav, AuthPageLink } from '@/components/onboarding/OnboardingLayout';
import { FormField, SelectField } from '@/components/onboarding/OnboardingFields';
import { PasswordField } from '@/components/shared/PasswordField';
import { ADMIN_ROLES } from '@/components/onboarding/onboardingConfig';
import { ErrorState } from '@/components/common/ErrorState';
import { internationalPhone, validPhone, PHONE_ERROR } from '@/lib/phone';

const STEPS = [
  { id: 'profile', label: 'Admin profile' },
  { id: 'role', label: 'Platform role' },
  { id: 'review', label: 'Create account' },
];

export default function PlatformAdminCreatePage() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    admin_role: 'operations',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currentStep = STEPS[stepIndex].id;
  const setField = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.createPlatformAdmin({ ...form, phone: form.phone ? internationalPhone(form.phone) : '' });
      navigate('/portal/admin', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (form.phone && !validPhone(form.phone)) { setError(new Error(PHONE_ERROR)); return; }
    if (currentStep === 'review') {
      handleSubmit();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  return (
    <OnboardingLayout
      title="Create Platform Admin"
      subtitle="Add operations, finance, or support staff to the Geepay admin hierarchy."
      steps={STEPS}
      currentStep={currentStep}
      footer={
        <div className="space-y-4">
          {error && <ErrorState error={error} />}
          <OnboardingNav
            onBack={stepIndex > 0 ? () => setStepIndex((i) => i - 1) : undefined}
            onNext={handleContinue}
            nextLabel={currentStep === 'review' ? 'Create admin' : 'Continue'}
            submitting={submitting}
          />
          <AuthPageLink to="/portal/admin">Back to admin dashboard</AuthPageLink>
        </div>
      }
    >
      {currentStep === 'profile' && (
        <div className="space-y-4">
          <FormField label="Full name" id="full_name" required value={form.full_name} onChange={setField('full_name')} />
          <FormField label="Email" id="email" type="email" required value={form.email} onChange={setField('email')} />
          <FormField label="Phone" id="phone" type="tel" value={form.phone} onChange={setField('phone')} />
          <PasswordField label="Password" id="password" required value={form.password} onChange={setField('password')} autoComplete="new-password" />
        </div>
      )}
      {currentStep === 'role' && (
        <div className="space-y-4">
          <SelectField label="Admin role" id="admin_role" value={form.admin_role} onChange={setField('admin_role')} options={ADMIN_ROLES} />
          <p className="rounded-xl bg-cream/60 p-3 text-xs text-forest-muted">
            Super admins can create operations, finance, support, and viewer roles. Each role has scoped access to platform management features.
          </p>
        </div>
      )}
      {currentStep === 'review' && (
        <div className="rounded-xl border border-cream-dark bg-cream/40 p-4 text-sm">
          <p><span className="text-forest-muted">Name:</span> <strong>{form.full_name}</strong></p>
          <p className="mt-2"><span className="text-forest-muted">Email:</span> <strong>{form.email}</strong></p>
          <p className="mt-2"><span className="text-forest-muted">Role:</span> <strong>{form.admin_role}</strong></p>
        </div>
      )}
    </OnboardingLayout>
  );
}
