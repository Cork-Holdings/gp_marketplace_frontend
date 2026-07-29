import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ownerApi, storefrontApi } from '@/lib/api/services';
import { slugify } from '@/lib/multipart';
import { DEFAULT_CURRENCY } from '@/lib/locale';
import { CURRENCY_OPTIONS } from '@/components/onboarding/onboardingConfig';
import { FileUploadField, FormField, SelectField } from '@/components/onboarding/OnboardingFields';
import { StepIndicator, OnboardingNav } from '@/components/onboarding/OnboardingLayout';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/ui/button';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { useAsync } from '@/hooks/useAsync';
import {
  FALLBACK_STORE_TYPES,
  normalizeStoreTypes,
  canCreateStore,
} from '@/lib/storeConfig';
import type { ReactNode } from 'react';

const STEPS = [
  { id: 'identity', label: 'Store identity' },
  { id: 'type', label: 'Business type' },
  { id: 'setup', label: 'Payments & brand' },
  { id: 'review', label: 'Review & launch' },
];

const INITIAL_FORM = {
  merchant_id: '',
  name: '',
  slug: '',
  branch_name: '',
  description: '',
  store_type: 'BARBERSHOP',
  ussd_code: '',
  currency: DEFAULT_CURRENCY,
};

const iconClass = 'h-5 w-5';

function IconFood() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function IconRetail() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function IconSalon() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
    </svg>
  );
}

function IconService() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconStore() {
  return (
    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
    </svg>
  );
}

function IconCheck({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function storeTypeIcon(type: { default_category?: string | null }): ReactNode {
  switch (type.default_category) {
    case 'FOOD_BEVERAGE':
      return <IconFood />;
    case 'PHYSICAL_GOODS':
      return <IconRetail />;
    case 'ON_PREMISE_SERVICE':
      return <IconSalon />;
    case 'ON_SITE_SERVICE':
      return <IconService />;
    default:
      return <IconStore />;
  }
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-cream-dark py-2.5 text-sm last:border-0">
      <span className="text-forest-muted">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-charcoal">{value?.trim() || '—'}</span>
    </div>
  );
}

function StorePreviewCard({
  form,
  storeTypes,
  imagePreview,
}: {
  form: typeof INITIAL_FORM;
  storeTypes: Array<{ value: string; label: string; default_category?: string | null }>;
  imagePreview: string | null;
}) {
  const typeLabel = storeTypes.find((t) => t.value === form.store_type)?.label ?? form.store_type;

  return (
    <div className="overflow-hidden rounded-2xl border border-cream-dark bg-white shadow-sm ring-1 ring-black/[0.03]">
      <div className="relative h-28 bg-gradient-to-br from-navy via-forest to-sky/80">
        <div className="auth-brand-glow pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
        {imagePreview ? (
          <img
            src={imagePreview}
            alt=""
            className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-90"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-cream/70">Preview</p>
          <p className="font-serif text-lg font-medium text-white">{form.name.trim() || 'Your store name'}</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cream-dark bg-cream/60">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-forest">{storeTypeIcon(storeTypes.find((t) => t.value === form.store_type) ?? {})}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-charcoal">{form.name.trim() || 'Store name'}</p>
            <p className="text-xs text-forest-muted">{form.branch_name.trim() || 'Branch'}</p>
            <span className="mt-1 inline-block rounded-full bg-sage/80 px-2 py-0.5 text-[10px] font-medium text-forest">
              {typeLabel}
            </span>
          </div>
        </div>
        {form.description.trim() ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-forest-muted">{form.description.trim()}</p>
        ) : (
          <p className="text-xs italic text-forest-muted/70">Add a short description customers will see on your storefront.</p>
        )}
        <div className="rounded-xl bg-cream/50 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-forest-muted">Storefront URL</p>
          <p className="truncate font-mono text-xs text-forest">
            geepay.com/store/{form.slug.trim() || 'your-store'}
          </p>
        </div>
      </div>
    </div>
  );
}

function StoreTypeCards({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: string; label: string; default_category?: string | null }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {options.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`group relative flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
              active
                ? 'border-forest bg-sage/30 ring-2 ring-forest/15'
                : 'border-cream-dark bg-white hover:border-forest/30 hover:bg-cream/30'
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition ${
                active ? 'bg-forest text-white' : 'bg-cream text-charcoal group-hover:bg-sage/50'
              }`}
              aria-hidden="true"
            >
              {storeTypeIcon(t)}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-charcoal">{t.label}</p>
              <p className="mt-0.5 text-xs text-forest-muted">
                {t.default_category === 'FOOD_BEVERAGE' && 'Menu, tables & kitchen'}
                {t.default_category === 'PHYSICAL_GOODS' && 'Catalog & delivery'}
                {t.default_category === 'ON_PREMISE_SERVICE' && 'Bookings & walk-ins'}
                {t.default_category === 'ON_SITE_SERVICE' && 'Jobs & call-outs'}
                {!t.default_category && 'General storefront'}
              </p>
            </div>
            {active && (
              <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-forest text-white">
                <IconCheck />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function CreateStoreForm({ onSuccess, compact = false }) {
  const { memberships, refreshStores, memberRole } = useMarketplace();
  const { data: typesData } = useAsync(() => storefrontApi.listStoreTypes().catch(() => null), []);
  const storeTypes = normalizeStoreTypes(typesData).length
    ? normalizeStoreTypes(typesData)
    : FALLBACK_STORE_TYPES;

  const [form, setForm] = useState(INITIAL_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const eligibleMemberships = memberships.filter((m) => canCreateStore(m.role));
  const currentStep = STEPS[stepIndex]?.id ?? STEPS[0].id;

  const imagePreview = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    if (!imageFile || !imagePreview?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imageFile, imagePreview]);

  useEffect(() => {
    const defaultMerchant =
      eligibleMemberships[0]?.merchant_id ?? memberships[0]?.merchant_id ?? '';
    if (defaultMerchant && !form.merchant_id) {
      setForm((f) => ({ ...f, merchant_id: defaultMerchant }));
    }
  }, [memberships, eligibleMemberships, form.merchant_id]);

  const setField = (key: keyof typeof INITIAL_FORM) => (value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name') {
        const base = slugify(value);
        if (!f.slug || f.slug === slugify(f.name)) {
          next.slug = base ? `${base}-${Date.now().toString(36).slice(-4)}` : '';
        }
        if (!f.branch_name) next.branch_name = value;
      }
      return next;
    });
    setError(null);
  };

  const selectedBusiness =
    eligibleMemberships.find((m) => m.merchant_id === form.merchant_id)?.trading_name ??
    eligibleMemberships.find((m) => m.merchant_id === form.merchant_id)?.legal_name;

  const canAdvance = useMemo(() => {
    switch (currentStep) {
      case 'identity':
        return Boolean(form.name.trim() && form.slug.trim());
      case 'type':
        return Boolean(form.store_type);
      case 'setup':
        return Boolean(form.ussd_code.trim());
      case 'review':
        return true;
      default:
        return false;
    }
  }, [currentStep, form]);

  const goNext = () => {
    if (!canAdvance) return;
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    setError(null);
  };

  const goBack = () => {
    setStepIndex((i) => Math.max(i - 1, 0));
    setError(null);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        merchant_id: form.merchant_id,
        name: form.name.trim(),
        slug: form.slug.trim(),
        branch_name: form.branch_name.trim() || form.name.trim(),
        description: form.description.trim(),
        store_type: form.store_type,
        ussd_code: form.ussd_code.trim(),
        currency: form.currency,
      };
      const store = await ownerApi.createStore(payload);
      if (imageFile && store?.id) {
        await ownerApi.uploadStoreImage(store.id, imageFile, 'logo').catch(() => null);
        await ownerApi.uploadStoreImage(store.id, imageFile, 'card').catch(() => null);
      }
      await refreshStores();
      setForm(INITIAL_FORM);
      setImageFile(null);
      setStepIndex(0);
      onSuccess?.(store);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreateStore(memberRole) && memberships.length > 0) {
    return (
      <div className="rounded-2xl border border-cream-dark bg-cream/40 p-6 text-center">
        <p className="text-sm font-medium text-charcoal">Insufficient permissions</p>
        <p className="mt-1 text-sm text-forest-muted">
          Your role ({memberRole ?? 'viewer'}) cannot create stores. Ask your business owner for manager access.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        <FormField label="Store name" id="name" required value={form.name} onChange={setField('name')} />
        <FormField label="URL slug" id="slug" required value={form.slug} onChange={setField('slug')} />
        <SelectField
          label="Business type"
          id="store_type"
          value={form.store_type}
          onChange={setField('store_type')}
          options={storeTypes.map((t) => ({ value: t.value, label: t.label }))}
        />
        <FormField label="USSD code" id="ussd_code" required value={form.ussd_code} onChange={setField('ussd_code')} />
        {error ? <ErrorState error={error as Error} title="Could not create store" /> : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create store'}
        </Button>
      </form>
    );
  }

  const stepContent = () => {
    switch (currentStep) {
      case 'identity':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif text-xl text-charcoal">Name your storefront</h2>
              <p className="mt-1 text-sm text-forest-muted">
                This is what customers see on Geepay and your public store page.
              </p>
            </div>

            {eligibleMemberships.length > 1 && (
              <SelectField
                label="Business"
                id="merchant_id"
                required
                value={form.merchant_id}
                onChange={setField('merchant_id')}
                options={eligibleMemberships.map((m) => ({
                  value: m.merchant_id,
                  label: m.trading_name ?? m.legal_name ?? m.merchant_id,
                }))}
              />
            )}

            <FormField
              label="Store name"
              id="name"
              required
              value={form.name}
              onChange={setField('name')}
              placeholder="Mulenga Barbershop — Kabulonga"
              hint="Use the name customers already know you by."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="Branch label"
                id="branch_name"
                value={form.branch_name}
                onChange={setField('branch_name')}
                placeholder="Kabulonga"
                hint="Optional — helps you tell branches apart."
              />
              <FormField
                label="URL slug"
                id="slug"
                required
                value={form.slug}
                onChange={setField('slug')}
                hint="Lowercase, unique across Geepay."
              />
            </div>

            <div className="rounded-xl border border-forest/10 bg-sage/20 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-forest-muted">Your storefront link</p>
              <p className="mt-1 font-mono text-sm text-forest">
                geepay.com/store/<span className="font-semibold">{form.slug.trim() || 'your-store'}</span>
              </p>
            </div>
          </div>
        );

      case 'type':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif text-xl text-charcoal">What kind of business is this?</h2>
              <p className="mt-1 text-sm text-forest-muted">
                We tailor menus, checkout, and staff tools to your category.
              </p>
            </div>
            <StoreTypeCards options={storeTypes} value={form.store_type} onChange={setField('store_type')} />
          </div>
        );

      case 'setup':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif text-xl text-charcoal">Payments & first impression</h2>
              <p className="mt-1 text-sm text-forest-muted">
                USSD lets customers pay via mobile money. Add a logo to stand out on the marketplace.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label="USSD code"
                id="ussd_code"
                required
                value={form.ussd_code}
                onChange={setField('ussd_code')}
                placeholder="115"
                hint="Short code for *USSD# checkout"
              />
              <SelectField
                label="Currency"
                id="currency"
                value={form.currency}
                onChange={setField('currency')}
                options={CURRENCY_OPTIONS}
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-charcoal">
                Store description
              </label>
              <textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setField('description')(e.target.value)}
                placeholder="Tell customers what makes this branch special…"
                className="field-input min-h-[5rem] resize-y"
              />
              <p className="mt-1 text-xs text-forest-muted">Shown in your About section on the storefront.</p>
            </div>

            <FileUploadField
              id="store_image"
              label="Logo / cover image"
              optional
              accept="image/jpeg,image/png,image/webp"
              hint="JPEG, PNG or WebP · max 5 MB"
              value={imageFile}
              onChange={setImageFile}
            />
          </div>
        );

      case 'review':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif text-xl text-charcoal">Ready to launch?</h2>
              <p className="mt-1 text-sm text-forest-muted">
                Double-check the details below. You can customize branding and copy after creation.
              </p>
            </div>

            <div className="rounded-2xl border border-cream-dark bg-cream/30 px-4 py-1">
              {eligibleMemberships.length > 1 && (
                <ReviewRow label="Business" value={selectedBusiness ?? form.merchant_id} />
              )}
              <ReviewRow label="Store name" value={form.name} />
              <ReviewRow label="Branch" value={form.branch_name || form.name} />
              <ReviewRow label="Slug" value={form.slug} />
              <ReviewRow
                label="Type"
                value={storeTypes.find((t) => t.value === form.store_type)?.label}
              />
              <ReviewRow label="USSD" value={form.ussd_code} />
              <ReviewRow label="Currency" value={form.currency} />
              <ReviewRow label="Description" value={form.description || 'None yet'} />
              <ReviewRow label="Logo" value={imageFile ? imageFile.name : 'Skipped — add later in Branding'} />
            </div>

            <p className="rounded-xl border border-sky/20 bg-info-light/50 px-4 py-3 text-xs leading-relaxed text-info-fg">
              After launch, head to <strong>Branding</strong> to upload hero slides, set your brand color, and edit page copy.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isLastStep) handleSubmit();
          else goNext();
        }}
        className="rounded-2xl border border-cream-dark bg-white p-6 shadow-sm sm:p-8 lg:p-10"
      >
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        <div className="mt-8">{stepContent()}</div>

        {error ? (
          <div className="mt-6">
            <ErrorState error={error as Error} title="Could not create store" />
          </div>
        ) : null}

        <div className="mt-8 border-t border-cream-dark pt-6">
          <OnboardingNav
            onBack={stepIndex > 0 ? goBack : undefined}
            onNext={isLastStep ? handleSubmit : goNext}
            nextLabel={isLastStep ? (submitting ? 'Launching…' : 'Launch store') : 'Continue'}
            submitting={submitting}
            nextDisabled={!canAdvance}
          />
        </div>

        <p className="mt-4 text-center text-xs text-forest-muted">
          <Link to="/portal/owner/stores" className="font-medium text-forest hover:underline">
            Cancel and go back
          </Link>
        </p>
      </form>

      <aside className="xl:sticky xl:top-24">
        <StorePreviewCard form={form} storeTypes={storeTypes} imagePreview={imagePreview} />
        <ul className="mt-4 space-y-2 text-xs text-forest-muted">
          <li className="flex gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage text-forest">
              <IconCheck className="h-2.5 w-2.5" />
            </span>
            Slug and USSD must be unique platform-wide
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage text-forest">
              <IconCheck className="h-2.5 w-2.5" />
            </span>
            Store goes live immediately after launch
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage text-forest">
              <IconCheck className="h-2.5 w-2.5" />
            </span>
            Customize branding anytime from the portal
          </li>
        </ul>
      </aside>
    </div>
  );
}

export default CreateStoreForm;
