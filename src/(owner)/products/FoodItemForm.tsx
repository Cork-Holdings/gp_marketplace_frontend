import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/common/ErrorState';
import { CataloguePhotoField } from '@/components/variants/CataloguePhotoField';
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
  const [removeImage, setRemoveImage] = useState(false);
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
      setRemoveImage(false);
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
    setRemoveImage(false);
    setImageFile(null);
    setCategoryId(initial.menu_category_id ?? '');
    setIsActive(initial.is_active !== false);
    setShowAdvanced(Boolean(initial.sku));
  }, [initial]);

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
      ...(removeImage && !imageFile ? { image_url: '' } : {}),
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
      const updatePayload = { name: payload.name, description: payload.description, price: payload.price, sku: payload.sku, is_active: payload.is_active, menu_category_id: payload.menu_category_id, clear_menu_category: payload.clear_menu_category, ...(removeImage && !imageFile ? { image_url: '' } : {}) };
      onSubmit?.(updatePayload, imageFile);
      return;
    }

    onSubmit?.(payload, imageFile);
  };

  return (
    <form onSubmit={handleSubmit} className={embedded ? 'space-y-5' : 'dashboard-card space-y-5'}>
      <div>
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

      </div>

      <CataloguePhotoField file={imageFile} existingUrl={initial?.image_url} removed={removeImage} disabled={submitting} onChange={setImageFile} onRemove={() => setRemoveImage(true)} />

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
