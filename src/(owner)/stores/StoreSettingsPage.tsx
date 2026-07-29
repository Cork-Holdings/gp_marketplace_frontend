import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { ownerApi } from '@/lib/api/services';
import { getStorefrontSettings } from '@/lib/normalizeApi';
import { FormField } from '@/components/onboarding/OnboardingFields';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import type { Store, StorefrontSettings, StoreImageKind } from '@/types/store';

const MAX_HERO = 8;

const iconMd = 'h-5 w-5 shrink-0';

function IconPhoto({ className = iconMd }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function IconDocument({ className = iconMd }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function IconUpload({ className = iconMd }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

const TABS = [
  {
    id: 'visuals' as const,
    label: 'Visual assets',
    description: 'Logo, banner, hero slides & color',
    icon: IconPhoto,
  },
  {
    id: 'copy' as const,
    label: 'Page copy',
    description: 'Headlines, sections & footer text',
    icon: IconDocument,
  },
];

type TabId = (typeof TABS)[number]['id'];

type CopyForm = {
  description: string;
  brand_color: string;
  hero_headline: string;
  hero_tagline: string;
  cta_label: string;
  featured_eyebrow: string;
  featured_title: string;
  about_title: string;
  catalog_eyebrow: string;
  catalog_title: string;
  footer_blurb: string;
};

function settingsFromStore(store: Store | null): CopyForm {
  const s = getStorefrontSettings(store) as StorefrontSettings;
  return {
    description: store?.description ?? '',
    brand_color: store?.brand_color ?? '#383D92',
    hero_headline: s.hero_headline ?? '',
    hero_tagline: s.hero_tagline ?? '',
    cta_label: s.cta_label ?? '',
    featured_eyebrow: s.featured_eyebrow ?? '',
    featured_title: s.featured_title ?? '',
    about_title: s.about_title ?? '',
    catalog_eyebrow: s.catalog_eyebrow ?? '',
    catalog_title: s.catalog_title ?? '',
    footer_blurb: s.footer_blurb ?? '',
  };
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-cream-dark bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="font-serif text-lg text-charcoal">{title}</h2>
        {description ? <p className="mt-1 text-sm text-forest-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function AssetCard({
  label,
  hint,
  previewUrl,
  aspect = 'square',
  round,
  uploading,
  onUpload,
}: {
  label: string;
  hint: string;
  previewUrl: string | null;
  aspect?: 'square' | 'wide' | 'card';
  round?: boolean;
  uploading?: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cacheBust, setCacheBust] = useState(() => Date.now());
  const prevUrl = useRef(previewUrl);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (previewUrl !== prevUrl.current) {
      prevUrl.current = previewUrl;
      setCacheBust(Date.now());
    }
  }, [previewUrl]);

  const displayUrl = previewUrl ? `${previewUrl}?v=${cacheBust}` : null;
  const aspectClass =
    aspect === 'wide' ? 'aspect-[16/7]' : aspect === 'card' ? 'aspect-[4/3]' : 'aspect-square';

  const handleFile = (file: File | null | undefined) => {
    if (file) onUpload(file);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`group relative cursor-pointer overflow-hidden border-2 border-dashed transition ${
          dragOver
            ? 'border-forest bg-sage/40'
            : displayUrl
              ? 'border-cream-dark bg-cream/20 hover:border-forest/40'
              : 'border-cream-dark bg-cream/40 hover:border-forest/30 hover:bg-sage/20'
        } ${round ? 'rounded-full' : 'rounded-2xl'} ${aspect === 'square' && round ? 'mx-auto w-32' : ''}`}
      >
        <div className={`relative ${aspectClass} ${round ? 'rounded-full' : ''}`}>
          {displayUrl ? (
            <img src={displayUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-forest-muted ring-1 ring-cream-dark">
                <IconUpload className="h-5 w-5" />
              </span>
              <span className="text-xs font-medium text-forest-muted">Drop or click to upload</span>
            </div>
          )}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-navy/50 opacity-0 transition group-hover:opacity-100 ${
              uploading ? 'opacity-100' : ''
            }`}
          >
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-charcoal shadow">
              {uploading ? 'Uploading…' : displayUrl ? 'Replace' : 'Upload'}
            </span>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <div>
        <p className="text-sm font-semibold text-charcoal">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-forest-muted">{hint}</p>
      </div>
    </div>
  );
}

function StorefrontPreview({
  store,
  form,
  heroImages,
}: {
  store: Store | null;
  form: CopyForm;
  heroImages: string[];
}) {
  const brandColor = /^#[0-9A-Fa-f]{6}$/.test(form.brand_color) ? form.brand_color : '#383D92';
  const headline = form.hero_headline.trim() || store?.name || 'Your store';
  const tagline = form.hero_tagline.trim() || form.description.trim() || 'Your tagline appears here';
  const cta = form.cta_label.trim() || 'Shop now';
  const heroBg = heroImages[0] ?? store?.banner_url ?? store?.logo_url ?? null;

  return (
    <div className="overflow-hidden rounded-2xl border border-cream-dark bg-white shadow-sm ring-1 ring-black/[0.03]">
      <div className="border-b border-cream-dark bg-cream/40 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-forest-muted">Live preview</p>
      </div>

      {/* Mini navbar */}
      <div className="flex items-center gap-2 border-b border-cream-dark px-3 py-2.5">
        {store?.logo_url ? (
          <img src={store.logo_url} alt="" className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-cream-dark" />
        )}
        <span className="truncate font-serif text-sm font-semibold text-charcoal">{store?.name ?? 'Store'}</span>
      </div>

      {/* Mini hero */}
      <div className="relative min-h-[140px] overflow-hidden">
        {heroBg ? (
          <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-forest to-sky/70" />
        )}
        <div className="absolute inset-0 bg-navy/50" />
        <div className="relative px-4 py-5">
          <h3 className="font-serif text-base font-medium leading-tight text-white">{headline}</h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/80">{tagline}</p>
          <span
            className="mt-3 inline-block rounded-full px-3 py-1 text-[10px] font-semibold text-white"
            style={{ backgroundColor: brandColor }}
          >
            {cta}
          </span>
        </div>
      </div>

      {/* Mini sections hint */}
      <div className="space-y-2 p-3">
        <div className="rounded-lg bg-cream/50 px-3 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-forest-muted">
            {form.featured_eyebrow.trim() || 'Popular picks'}
          </p>
          <p className="text-xs font-medium text-charcoal">{form.featured_title.trim() || 'Featured items'}</p>
        </div>
        <div
          className="h-1.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${brandColor}, ${brandColor}88)` }}
          aria-hidden="true"
        />
        <p className="text-[10px] text-forest-muted">
          Brand color · {form.footer_blurb.trim() ? 'Custom footer' : 'Default footer'}
        </p>
      </div>
    </div>
  );
}

function BrandColorPicker({
  value,
  swatch,
  onChange,
}: {
  value: string;
  swatch: string;
  onChange: (v: string) => void;
}) {
  const colorRef = useRef<HTMLInputElement>(null);
  const presets = ['#383D92', '#080C30', '#00AFEB', '#10B981', '#EF4444'];

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        type="button"
        onClick={() => colorRef.current?.click()}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-2 border-white shadow-md ring-1 ring-cream-dark transition hover:scale-105"
        style={{ backgroundColor: swatch }}
        aria-label="Pick brand color"
      />
      <input
        ref={colorRef}
        type="color"
        value={swatch}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="sr-only"
        tabIndex={-1}
      />
      <div className="min-w-[10rem] flex-1">
        <FormField
          id="brand_color"
          label="Hex value"
          type="text"
          value={value}
          onChange={onChange}
          placeholder="#383D92"
        />
      </div>
      <div className="flex gap-2">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            title={c}
            onClick={() => onChange(c)}
            className={`h-8 w-8 rounded-full border-2 transition hover:scale-110 ${
              value.toUpperCase() === c ? 'border-charcoal' : 'border-white ring-1 ring-cream-dark'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

function CopySection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-cream-dark bg-cream/20">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-charcoal">{title}</span>
        <span className="text-forest-muted">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-4 border-t border-cream-dark px-4 pb-4 pt-4">{children}</div>}
    </div>
  );
}

export default function StoreSettingsPage() {
  const { isStoreOwner } = useAuth();
  const { selectedStore, selectedStoreId, refreshStores, loading: storesLoading } = useMarketplace();

  const [tab, setTab] = useState<TabId>('visuals');
  const [form, setForm] = useState<CopyForm>(() => settingsFromStore(selectedStore));
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadKind, setUploadKind] = useState<StoreImageKind | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(settingsFromStore(selectedStore));
    const settings = getStorefrontSettings(selectedStore) as StorefrontSettings;
    setHeroImages(Array.isArray(settings.hero_images) ? [...settings.hero_images] : []);
    setError(null);
    setSuccess(null);
    setDirty(false);
  }, [
    selectedStore?.id,
    selectedStore?.updated_at,
    selectedStore?.logo_url,
    selectedStore?.banner_url,
    selectedStore?.image_url,
  ]);

  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  if (!storesLoading && !selectedStoreId) {
    return (
      <EmptyState
        title="No store selected"
        description="Add a store first, then customize its branding and storefront copy."
        actionLabel="+ Add store"
        actionTo="/portal/owner/stores/new"
      />
    );
  }

  const setField = (key: keyof CopyForm) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(null);
    setDirty(true);
  };

  const applyStoreResponse = async (freshStore: Store | null | undefined) => {
    if (freshStore) {
      setForm(settingsFromStore(freshStore));
      const settings = getStorefrontSettings(freshStore) as StorefrontSettings;
      setHeroImages(Array.isArray(settings.hero_images) ? [...settings.hero_images] : []);
    }
    await refreshStores();
  };

  const handleUpload = async (kind: StoreImageKind, file: File) => {
    if (!selectedStoreId) return;
    setUploadKind(kind);
    setError(null);
    setSuccess(null);
    try {
      const res = await ownerApi.uploadStoreImage(selectedStoreId, file, kind);
      await applyStoreResponse(res?.store ?? null);
      setSuccess(
        kind === 'hero' ? 'Hero slide added.' : `${kind.charAt(0).toUpperCase()}${kind.slice(1)} updated.`,
      );
    } catch (err) {
      setError(err);
    } finally {
      setUploadKind(null);
    }
  };

  const removeHeroImage = async (url: string) => {
    if (!selectedStoreId) return;
    const next = heroImages.filter((u) => u !== url);
    setHeroImages(next);
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const store = await ownerApi.updateStore(selectedStoreId, {
        storefront_settings: { hero_images: next },
      });
      await applyStoreResponse(store);
      setSuccess('Hero slide removed.');
    } catch (err) {
      setError(err);
      await refreshStores();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCopy = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!selectedStoreId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const store = await ownerApi.updateStore(selectedStoreId, {
        description: form.description.trim(),
        brand_color: form.brand_color.trim() || null,
        storefront_settings: {
          hero_headline: form.hero_headline,
          hero_tagline: form.hero_tagline,
          cta_label: form.cta_label,
          featured_eyebrow: form.featured_eyebrow,
          featured_title: form.featured_title,
          about_title: form.about_title,
          catalog_eyebrow: form.catalog_eyebrow,
          catalog_title: form.catalog_title,
          footer_blurb: form.footer_blurb,
          hero_images: heroImages,
        },
      });
      await applyStoreResponse(store);
      setSuccess('Branding saved — changes are live on your storefront.');
      setDirty(false);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const storefrontHref = selectedStore?.slug ? `/store/${selectedStore.slug}` : null;
  const brandSwatch = /^#[0-9A-Fa-f]{6}$/.test(form.brand_color) ? form.brand_color : '#383D92';

  return (
    <div className="w-full space-y-6 pb-24 lg:pb-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-navy px-6 py-8 text-cream sm:px-10">
        <div className="auth-brand-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cream/60">Store branding</p>
            <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight">
              {selectedStore?.name ?? 'Your store'}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-cream/75">
              Upload your logo, hero images, and write the copy customers see on your public storefront.
            </p>
          </div>
          {storefrontHref && (
            <a
              href={storefrontHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-cream ring-1 ring-white/20 transition hover:bg-white/20"
            >
              Preview storefront →
            </a>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error ? <ErrorState error={error as Error} title="Could not save changes" /> : null}
      {success ? (
        <p
          className="rounded-xl border border-sage bg-sage/40 px-4 py-3 text-sm text-forest"
          role="status"
        >
          {success}
        </p>
      ) : null}

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Branding sections"
        className="grid grid-cols-2 gap-2 rounded-2xl border border-cream-dark bg-white p-1.5 shadow-sm"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition ${
                active
                  ? 'bg-navy text-cream shadow-md'
                  : 'text-forest-muted hover:bg-cream hover:text-charcoal'
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  active ? 'bg-white/15 text-cream' : 'bg-cream text-forest'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-semibold ${active ? 'text-cream' : 'text-charcoal'}`}>
                  {t.label}
                </span>
                <span className={`mt-0.5 block text-xs ${active ? 'text-cream/70' : 'text-forest-muted'}`}>
                  {t.description}
                </span>
              </span>
              {active && (
                <span
                  className="absolute bottom-1.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-sky sm:hidden"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-6">
          {tab === 'visuals' && (
            <>
              <SectionCard
                title="Brand images"
                description="Each slot is independent — uploading one won't replace the others. JPEG, PNG or WebP · max 5 MB."
              >
                <div className="grid gap-6 sm:grid-cols-3">
                  <AssetCard
                    label="Logo"
                    hint="Circular mark in the storefront navbar."
                    previewUrl={selectedStore?.logo_url ?? null}
                    round
                    aspect="square"
                    uploading={uploadKind === 'logo'}
                    onUpload={(file) => handleUpload('logo', file)}
                  />
                  <AssetCard
                    label="Banner"
                    hint="Wide image behind your About section."
                    previewUrl={selectedStore?.banner_url ?? null}
                    aspect="wide"
                    uploading={uploadKind === 'banner'}
                    onUpload={(file) => handleUpload('banner', file)}
                  />
                  <AssetCard
                    label="Marketplace card"
                    hint="Thumbnail on the Geepay home page."
                    previewUrl={selectedStore?.image_url ?? null}
                    aspect="card"
                    uploading={uploadKind === 'card'}
                    onUpload={(file) => handleUpload('card', file)}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="Hero carousel"
                description={`Up to ${MAX_HERO} slides. Leave empty to use your banner or platform defaults.`}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {heroImages.map((url) => (
                    <div
                      key={url}
                      className="group relative overflow-hidden rounded-xl border border-cream-dark"
                    >
                      <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => removeHeroImage(url)}
                        className="absolute inset-0 flex items-center justify-center bg-navy/60 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                      >
                        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-red-700 shadow">
                          Remove
                        </span>
                      </button>
                    </div>
                  ))}

                  {heroImages.length < MAX_HERO && (
                    <button
                      type="button"
                      disabled={uploadKind === 'hero'}
                      onClick={() => heroInputRef.current?.click()}
                      className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-cream-dark bg-cream/30 text-forest-muted transition hover:border-forest/40 hover:bg-sage/20 hover:text-forest"
                    >
                      <span className="text-2xl">+</span>
                      <span className="text-xs font-medium">
                        {uploadKind === 'hero' ? 'Uploading…' : 'Add slide'}
                      </span>
                    </button>
                  )}
                </div>
                <input
                  ref={heroInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload('hero', file);
                    e.target.value = '';
                  }}
                />
              </SectionCard>

              <SectionCard title="Brand color" description="Used for buttons, accents, and checkout highlights.">
                <BrandColorPicker
                  value={form.brand_color}
                  swatch={brandSwatch}
                  onChange={setField('brand_color')}
                />
              </SectionCard>
            </>
          )}

          {tab === 'copy' && (
            <form onSubmit={handleSaveCopy} className="space-y-4">
              <SectionCard
                title="Storefront copy"
                description="Leave any field blank to use the default wording for your store type."
              >
                <div className="space-y-4">
                  <CopySection title="About & description">
                    <div>
                      <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-charcoal">
                        About text
                      </label>
                      <textarea
                        id="description"
                        rows={3}
                        value={form.description}
                        onChange={(e) => setField('description')(e.target.value)}
                        placeholder="Tell customers who you are and what you offer…"
                        className="field-input min-h-[5rem] resize-y"
                      />
                    </div>
                    <FormField
                      id="about_title"
                      label="About section label"
                      value={form.about_title}
                      onChange={setField('about_title')}
                      placeholder="About"
                    />
                  </CopySection>

                  <CopySection title="Hero section">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        id="hero_headline"
                        label="Headline"
                        value={form.hero_headline}
                        onChange={setField('hero_headline')}
                        placeholder={selectedStore?.name ?? 'Your store name'}
                        hint="Defaults to store name."
                      />
                      <FormField
                        id="cta_label"
                        label="Button label"
                        value={form.cta_label}
                        onChange={setField('cta_label')}
                        placeholder="Shop now"
                      />
                    </div>
                    <div>
                      <label htmlFor="hero_tagline" className="mb-1.5 block text-sm font-medium text-charcoal">
                        Tagline
                      </label>
                      <textarea
                        id="hero_tagline"
                        rows={2}
                        value={form.hero_tagline}
                        onChange={(e) => setField('hero_tagline')(e.target.value)}
                        placeholder="A short line under the headline"
                        className="field-input resize-y"
                      />
                    </div>
                  </CopySection>

                  <CopySection title="Featured & catalog sections" defaultOpen={false}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        id="featured_eyebrow"
                        label="Featured eyebrow"
                        value={form.featured_eyebrow}
                        onChange={setField('featured_eyebrow')}
                        placeholder="Popular picks"
                      />
                      <FormField
                        id="featured_title"
                        label="Featured title"
                        value={form.featured_title}
                        onChange={setField('featured_title')}
                        placeholder="Featured items"
                      />
                      <FormField
                        id="catalog_eyebrow"
                        label="Catalog eyebrow"
                        value={form.catalog_eyebrow}
                        onChange={setField('catalog_eyebrow')}
                        placeholder="Full Collection"
                      />
                      <FormField
                        id="catalog_title"
                        label="Catalog title"
                        value={form.catalog_title}
                        onChange={setField('catalog_title')}
                        placeholder="Shop All Products"
                      />
                    </div>
                  </CopySection>

                  <CopySection title="Footer" defaultOpen={false}>
                    <FormField
                      id="footer_blurb"
                      label="Footer blurb"
                      value={form.footer_blurb}
                      onChange={setField('footer_blurb')}
                      placeholder="Pay securely with Mobile Money via Geepay."
                    />
                  </CopySection>
                </div>
              </SectionCard>
            </form>
          )}
        </div>

        {/* Sticky preview */}
        <aside className="space-y-4 xl:sticky xl:top-24">
          <StorefrontPreview store={selectedStore} form={form} heroImages={heroImages} />
          <div className="hidden rounded-xl border border-cream-dark bg-cream/30 p-4 text-xs text-forest-muted xl:block">
            <p className="font-semibold text-charcoal">Tips</p>
            <ul className="mt-2 space-y-1.5">
              <li>· Logo, banner, and card are separate uploads</li>
              <li>· Hero slides override the default carousel</li>
              <li>· Blank copy fields use smart defaults</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cream-dark bg-white/95 px-4 py-3 backdrop-blur-sm md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="flex w-full items-center justify-between gap-3">
          <p className="hidden text-sm text-forest-muted sm:block">
            {dirty ? 'Unsaved copy changes' : 'Images save on upload · copy saves below'}
          </p>
          <div className="flex w-full items-center justify-end gap-3 md:w-auto">
            {storefrontHref && (
              <a
                href={storefrontHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden text-sm font-medium text-forest-muted hover:text-forest hover:underline sm:inline"
              >
                Open storefront
              </a>
            )}
            <Button
              type="button"
              disabled={saving || !selectedStoreId || (tab === 'visuals' && !dirty)}
              onClick={() => handleSaveCopy()}
            >
              {saving ? 'Saving…' : dirty ? 'Save changes' : 'Save copy & theme'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
