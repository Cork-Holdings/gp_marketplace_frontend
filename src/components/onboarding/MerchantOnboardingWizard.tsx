import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, adminApi, merchantApi } from '@/lib/api/services';
import { buildFormData, slugify } from '@/lib/multipart';
import { useAuth } from '@/lib/context/useAuth';
import { ErrorState } from '../common/ErrorState';
import {
  OnboardingLayout,
  OnboardingNav,
  AuthPageLink,
} from './OnboardingLayout';
import {
  BusinessTypeCards,
  FileUploadField,
  FormField,
  SelectField,
} from './OnboardingFields';
import { PasswordField } from '../shared/PasswordField';
import {
  INITIAL_MERCHANT_FORM,
  USER_FILE_FIELDS,
  KYC_FILE_FIELDS,
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  STORE_CATEGORIES,
  getSelfRegisterSteps,
  getAdminOnboardSteps,
  getAdditionalBusinessSteps,
} from './onboardingConfig';
import { DEFAULT_PHONE_PLACEHOLDER } from '@/lib/locale';

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-cream-dark py-2 text-sm">
      <span className="text-forest-muted">{label}</span>
      <span className="font-medium text-charcoal text-right">{value || '—'}</span>
    </div>
  );
}

export function MerchantOnboardingWizard({ mode = 'self' }) {
  const navigate = useNavigate();
  const { loginFromResponse, isAuthenticated } = useAuth();

  const steps = useMemo(() => {
    if (mode === 'admin') return getAdminOnboardSteps();
    if (mode === 'additional') return getAdditionalBusinessSteps();
    return getSelfRegisterSteps();
  }, [mode]);

  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState(INITIAL_MERCHANT_FORM);
  const [userFiles, setUserFiles] = useState({});
  const [kycFiles, setKycFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const currentStep = steps[stepIndex]?.id;
  const isFormal = form.business_type === 'formal';

  const setField = (key) => (value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'trading_name' || key === 'legal_name') {
        if (!f.store_slug || f.store_slug === slugify(f.trading_name || f.legal_name)) {
          next.store_slug = slugify(value);
        }
        if (!f.store_name) next.store_name = value;
      }
      return next;
    });
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const buildMerchantPayload = () => {
    const fields = {
      business_type: form.business_type,
      legal_name: form.legal_name,
      trading_name: form.trading_name,
      registration_number: form.registration_number,
      tax_id: form.tax_id,
      country_code: form.country_code,
    };

    if (mode !== 'additional') {
      Object.assign(fields, {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone,
      });
    }

    const files = { ...userFiles, ...kycFiles };
    return buildFormData(fields, files);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let result;
      if (mode === 'self') {
        result = await authApi.registerMerchant(buildMerchantPayload());
        await loginFromResponse(result);
        navigate('/portal/owner', { replace: true });
      } else if (mode === 'admin') {
        result = await adminApi.registerMerchant(buildMerchantPayload());
        const merchantId = result.merchant?.id ?? result.id;
        const ownerId = result.user?.id ?? result.owner_id ?? result.admin_user_id;
        await adminApi.createStore({
          merchant_id: merchantId,
          owner_id: ownerId,
          name: form.store_name,
          slug: form.store_slug || slugify(form.store_name),
          ussd_code: form.store_ussd_code,
          currency: form.store_currency,
          store_category: form.store_category,
          description: form.store_description,
        });
        navigate('/portal/admin/stores', { replace: true });
      } else {
        result = await merchantApi.onboardBusiness(buildMerchantPayload());
        navigate('/portal/owner', { replace: true });
      }
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (currentStep === 'review') {
      handleSubmit();
      return;
    }
    goNext();
  };

  const titles = {
    self: {
      title: 'Join Geepay Marketplace',
      subtitle: 'Register your business, upload verification documents, and start selling across Zambia.',
    },
    admin: {
      title: 'Onboard a Merchant',
      subtitle: 'Create the business administrator, verify KYC documents, and attach their first store.',
    },
    additional: {
      title: 'Add Another Business',
      subtitle: 'Register a second merchant entity under your account with fresh KYC documents.',
    },
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'type':
        return (
          <div className="space-y-4">
            <p className="text-sm text-forest-muted">Choose how your business is registered.</p>
            <BusinessTypeCards value={form.business_type} onChange={setField('business_type')} />
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-4">
            <FormField label="Full name" id="full_name" required value={form.full_name} onChange={setField('full_name')} />
            <FormField label="Email" id="email" type="email" required value={form.email} onChange={setField('email')} />
            <FormField label="Phone" id="phone" type="tel" value={form.phone} onChange={setField('phone')} placeholder={DEFAULT_PHONE_PLACEHOLDER} />
            <PasswordField label="Password" id="password" required value={form.password} onChange={setField('password')} hint="Minimum 8 characters" />
          </div>
        );

      case 'business':
        return (
          <div className="space-y-4">
            <FormField label="Legal business name" id="legal_name" required value={form.legal_name} onChange={setField('legal_name')} />
            <FormField label="Trading name" id="trading_name" value={form.trading_name} onChange={setField('trading_name')} hint="Name customers will see" />
            {isFormal && (
              <>
                <FormField label="Registration number" id="registration_number" value={form.registration_number} onChange={setField('registration_number')} />
                <FormField label="Tax ID" id="tax_id" value={form.tax_id} onChange={setField('tax_id')} />
              </>
            )}
            <SelectField label="Country" id="country_code" value={form.country_code} onChange={setField('country_code')} options={COUNTRY_OPTIONS} />
          </div>
        );

      case 'identity':
        return (
          <div className="space-y-4">
            <p className="text-sm text-forest-muted">Upload clear photos or scans of identity documents.</p>
            {USER_FILE_FIELDS.map((f) => (
              <FileUploadField
                key={f.key}
                id={f.key}
                label={f.label}
                hint={f.hint}
                optional={f.optional}
                value={userFiles[f.key]}
                onChange={(file) => setUserFiles((prev) => ({ ...prev, [f.key]: file }))}
              />
            ))}
          </div>
        );

      case 'kyc':
        return (
          <div className="space-y-4">
            <p className="text-sm text-forest-muted">
              {isFormal
                ? 'Formal businesses require company registration and owner ID verification.'
                : 'Upload owner ID verification. Company registration is optional for informal traders.'}
            </p>
            {KYC_FILE_FIELDS.filter((f) => !f.formalOnly || isFormal).map((f) => (
              <FileUploadField
                key={f.key}
                id={f.key}
                label={f.label}
                hint={f.hint}
                optional={f.optional || (!isFormal && f.key === 'company_registration')}
                value={kycFiles[f.key]}
                onChange={(file) => setKycFiles((prev) => ({ ...prev, [f.key]: file }))}
              />
            ))}
          </div>
        );

      case 'store':
        return (
          <div className="space-y-4">
            <FormField label="Store name" id="store_name" required value={form.store_name} onChange={setField('store_name')} />
            <FormField label="URL slug" id="store_slug" required value={form.store_slug} onChange={setField('store_slug')} hint={`/store/${form.store_slug || 'your-store'}`} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="USSD code" id="store_ussd_code" value={form.store_ussd_code} onChange={setField('store_ussd_code')} />
              <SelectField
                label="Currency"
                id="store_currency"
                value={form.store_currency}
                onChange={setField('store_currency')}
                options={CURRENCY_OPTIONS}
              />
            </div>
            <SelectField label="Store category" id="store_category" value={form.store_category} onChange={setField('store_category')} options={STORE_CATEGORIES} />
            <FormField label="Description" id="store_description" value={form.store_description} onChange={setField('store_description')} />
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-cream-dark bg-cream/40 p-4">
              <ReviewRow label="Business type" value={form.business_type} />
              {mode !== 'additional' && (
                <>
                  <ReviewRow label="Administrator" value={form.full_name} />
                  <ReviewRow label="Email" value={form.email} />
                </>
              )}
              <ReviewRow label="Legal name" value={form.legal_name} />
              <ReviewRow label="Trading name" value={form.trading_name} />
              <ReviewRow label="Country" value={form.country_code} />
              {mode === 'admin' && <ReviewRow label="Store" value={form.store_name} />}
              <ReviewRow
                label="Documents"
                value={`${Object.keys(userFiles).length + Object.keys(kycFiles).length} file(s) attached`}
              />
            </div>
            {error && <ErrorState error={error} />}
          </div>
        );

      default:
        return null;
    }
  };

  const meta = titles[mode] ?? titles.self;

  return (
    <OnboardingLayout
      title={meta.title}
      subtitle={meta.subtitle}
      steps={steps}
      currentStep={currentStep}
      footer={
        <div className="space-y-4">
          {error && currentStep !== 'review' && <ErrorState error={error} />}
          <OnboardingNav
            onBack={stepIndex > 0 ? goBack : undefined}
            onNext={handleContinue}
            nextLabel={currentStep === 'review' ? (mode === 'admin' ? 'Create merchant & store' : 'Submit application') : 'Continue'}
            submitting={submitting}
          />
          {mode === 'self' && (
            <AuthPageLink to="/login">Already have an account? Sign in</AuthPageLink>
          )}
          {mode === 'additional' && isAuthenticated && (
            <AuthPageLink to="/portal/owner">Back to merchant portal</AuthPageLink>
          )}
        </div>
      }
    >
      {renderStep()}
    </OnboardingLayout>
  );
}

export default MerchantOnboardingWizard;
