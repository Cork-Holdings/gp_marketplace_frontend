import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { FileUploadField } from '@/components/onboarding/OnboardingFields';
import type { Product } from '@/types/product';

/** High stock so checkout reservation still works; restaurants use availability, not inventory. */
const FOOD_DEFAULT_STOCK = 99999;

/**
 * Fast create/edit form for restaurant menu items.
 * Skips retail SKU/stock/variant chrome; supports category + availability.
 */
export function FoodItemForm({
  onSubmit,
  submitting = false,
  embedded = false,
  error = null,
  categories = [],
  initial = null,
  submitLabel,
}: {
  onSubmit: (payload: unknown, imageFile?: File | null) => void;
  submitting?: boolean;
  embedded?: boolean;
  error?: unknown;
  categories?: Array<{ id: string; name: string }>;
  initial?: Product | null;
  submitLabel?: string;
}) {
  const isEdit = Boolean(initial?.id);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!initial) {
      setName('');
      setDescription('');
      setPrice('');
      setSku('');
      setImageUrl('');
      setImageFile(null);
      setCategoryId('');
      setIsActive(true);
      setShowAdvanced(false);
      return;
    }
    setName(initial.name ?? '');
    setDescription(initial.description ?? '');
    setPrice(initial.price != null ? String(initial.price) : '');
    setSku(initial.sku ?? '');
    setImageUrl(initial.image_url ?? '');
    setImageFile(null);
    setCategoryId(initial.menu_category_id ?? '');
    setIsActive(initial.is_active !== false);
    setShowAdvanced(Boolean(initial.sku));
  }, [initial]);

  const previewUrl = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    return imageUrl || null;
  }, [imageFile, imageUrl]);

  useEffect(() => {
    if (!imageFile || !previewUrl?.startsWith('blob:')) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile, previewUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPrice = price.trim();
    if (!trimmedName || !trimmedPrice) return;

    const payload = {
      name: trimmedName,
      description: description.trim() || null,
      price: trimmedPrice,
      sku: sku.trim(),
      image_url: imageUrl.trim() || null,
      is_active: isActive,
      variant_mode: 'simple',
      menu_category_id: categoryId || null,
      clear_menu_category: isEdit && !categoryId,
      stock_quantity: FOOD_DEFAULT_STOCK,
      variants: [
        {
          sku: sku.trim() || 'default',
          price: trimmedPrice,
          stock_quantity: FOOD_DEFAULT_STOCK,
          attributes: {},
        },
      ],
    };

    if (isEdit) {
      const { variants: _v, stock_quantity: _s, variant_mode: _m, ...updatePayload } = payload;
      onSubmit?.(updatePayload, imageFile);
      return;
    }

    onSubmit?.(payload, imageFile);
  };

  return (
    <form onSubmit={handleSubmit} className={embedded ? 'space-y-5' : 'dashboard-card space-y-5'}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_140px]">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-forest-muted">Basics</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-forest-muted">Item name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grilled chicken burger"
                  className="field-input"
                  autoFocus
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-forest-muted">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short guest-facing description"
                  rows={2}
                  className="field-input resize-y"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-forest-muted">Price</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="field-input"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-forest-muted">Menu category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="field-input"
                >
                  <option value="">Unassigned</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="mt-1 text-[11px] text-forest-muted">
                    No sections yet —{' '}
                    <Link to="/portal/owner/menu" className="font-semibold text-forest hover:underline">
                      create categories
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-cream-dark pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-forest-muted">Availability</p>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-cream-dark bg-cream/30 px-3 py-2.5">
              <input
                id="food-item-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-cream-dark text-forest focus:ring-forest"
              />
              <span className="text-sm text-charcoal">Available on menu</span>
              <span className="ml-auto text-xs text-forest-muted">
                {isActive ? 'Guests can order' : "Hidden (86'd)"}
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-forest-muted">Photo</p>
          <div className="overflow-hidden rounded-xl border border-cream-dark bg-cream/40">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-forest/80 to-forest-muted text-cream/60">
                <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
          </div>
          <FileUploadField
            id="food-item-image"
            label="Upload image"
            optional
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            hint="JPEG, PNG or WebP · max 5 MB"
            value={imageFile}
            onChange={setImageFile}
          />
        </div>
      </div>

      <div className="border-t border-cream-dark pt-3">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs font-medium text-forest hover:underline"
        >
          {showAdvanced ? 'Hide advanced' : 'Advanced (SKU)'}
        </button>
        {showAdvanced && (
          <div className="mt-2">
            <label className="mb-1 block text-xs font-medium text-forest-muted">SKU (optional)</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Leave blank for most menu items"
              className="field-input"
            />
          </div>
        )}
      </div>

      {error && <ErrorState error={error} />}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Saving…' : submitLabel ?? (isEdit ? 'Save changes' : 'Add item')}
      </Button>
    </form>
  );
}

export default FoodItemForm;
