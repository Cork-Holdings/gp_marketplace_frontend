import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ATTRIBUTE_TYPES } from '@/lib/validations/variantSchema';
import { ErrorState } from '@/components/common/ErrorState';
import { defaultPurchaseFlow, type PurchaseFlow } from '@/lib/purchaseFlow';
import { CataloguePhotoField } from './CataloguePhotoField';

const DEFAULT_ATTR = { key: '', label: '', type: ATTRIBUTE_TYPES.SELECT, options: [''] };

/**
 * Merchant product creation — dynamic variant / attribute builder.
 * SKU is optional (empty is stored as null on the backend).
 */
export function ProductVariantForm({
  onSubmit,
  submitting,
  category,
  storeType,
  embedded = false,
  error = null,
  initial = null,
}) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [purchaseFlow, setPurchaseFlow] = useState(() => defaultPurchaseFlow(category, storeType));
  const [variantMode, setVariantMode] = useState('simple');
  const [attributes, setAttributes] = useState([]);
  const [variants, setVariants] = useState([{ sku: '', price: '', stock_quantity: '', attributes: {} }]);

  const isService = category === 'ON_PREMISE_SERVICE' || category === 'ON_SITE_SERVICE';
  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    if (!initial) return;
    setName(initial.name ?? '');
    setSku(initial.sku ?? '');
    setPrice(initial.price != null ? String(initial.price) : '');
    setPurchaseFlow(initial.purchase_flow ?? defaultPurchaseFlow(category, storeType));
    setVariantMode(initial.variant_mode === 'custom' ? 'matrix' : 'simple');
    setImageFile(null);
    setRemoveImage(false);
  }, [initial, category, storeType]);

  const addAttribute = () => setAttributes((a) => [...a, { ...DEFAULT_ATTR, key: `attr_${a.length + 1}` }]);

  const addVariant = () =>
    setVariants((v) => [...v, { sku: '', price: '', stock_quantity: isService ? '100' : '0', attributes: {} }]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) {
      onSubmit?.({
        name,
        sku: sku.trim(),
        price,
        purchase_flow: purchaseFlow,
        ...(removeImage && !imageFile ? { image_url: '' } : {}),
      }, imageFile);
      return;
    }

    const payload = {
      name,
      purchase_flow: purchaseFlow,
      sku: sku.trim(),
      variant_mode: variantMode,
      variants: variants.map((v) => ({
        sku: v.sku || sku.trim() || 'default',
        price: v.price || price,
        stock_quantity: isService ? 100 : parseInt(v.stock_quantity, 10) || 0,
        attributes: v.attributes,
      })),
      attribute_schema: attributes.map((a) => ({
        key: a.key,
        label: a.label || a.key,
        type: a.type,
        options: a.options.filter(Boolean),
      })),
    };
    if (variantMode === 'simple' && !variants.length) {
      payload.variants = [
        {
          sku: sku.trim() || 'default',
          price,
          stock_quantity: isService ? 100 : 0,
          attributes: {},
        },
      ];
    }
    onSubmit?.(payload, imageFile);
  };

  return (
    <form onSubmit={handleSubmit} className={embedded ? 'space-y-4' : 'dashboard-card space-y-4'}>
      {!embedded && (
        <h3 className="font-semibold text-charcoal">{isEdit ? 'Edit' : 'Create'} Product {isService ? '(Service)' : ''}</h3>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="purchase-flow" className="mb-1 block text-xs font-medium text-forest-muted">What happens when a customer selects this item?</label>
          <select id="purchase-flow" value={purchaseFlow} onChange={(e) => setPurchaseFlow(e.target.value as PurchaseFlow)} className="field-input">
            <option value="checkout">Add to cart · ready to sell now</option>
            <option value="booking">Book an appointment · choose a time</option>
            <option value="quote">Arrange an assessment · price after review</option>
            <option value="custom_request">Request customization · agree a price first</option>
            <option value="wholesale">Request bulk quantity · agree a price first</option>
          </select>
          <p className="mt-1 text-xs text-forest-muted">Customers only see the next step that fits this item. Appointment services need a priced service and available resource in Bookings.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-forest-muted">Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="field-input" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-forest-muted">SKU (optional)</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} className="field-input" placeholder="Optional" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-forest-muted">Base Price</label>
          <input required type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="field-input" />
        </div>
        {!isEdit && (
          <div>
            <label className="mb-1 block text-xs font-medium text-forest-muted">Variant Mode</label>
            <select value={variantMode} onChange={(e) => setVariantMode(e.target.value)} className="field-input">
              <option value="simple">Simple</option>
              <option value="matrix">Attribute Matrix</option>
            </select>
          </div>
        )}
      </div>

      {!isEdit && variantMode === 'matrix' && (
        <div className="space-y-3 rounded-xl border border-cream-dark bg-cream/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-charcoal">Attribute Dimensions</p>
            <Button type="button" variant="secondary" size="sm" onClick={addAttribute}>
              + Attribute
            </Button>
          </div>
          {attributes.map((attr, i) => (
            <div key={attr.key} className="grid gap-2 sm:grid-cols-3">
              <input
                placeholder="Key (e.g. size)"
                value={attr.key}
                onChange={(e) => {
                  const next = [...attributes];
                  next[i] = { ...attr, key: e.target.value };
                  setAttributes(next);
                }}
                className="field-input"
              />
              <input
                placeholder="Label"
                value={attr.label}
                onChange={(e) => {
                  const next = [...attributes];
                  next[i] = { ...attr, label: e.target.value };
                  setAttributes(next);
                }}
                className="field-input"
              />
              <input
                placeholder="Options (comma-separated)"
                value={attr.options.join(', ')}
                onChange={(e) => {
                  const next = [...attributes];
                  next[i] = { ...attr, options: e.target.value.split(',').map((s) => s.trim()) };
                  setAttributes(next);
                }}
                className="field-input sm:col-span-1"
              />
            </div>
          ))}
        </div>
      )}

      {!isEdit && variantMode === 'matrix' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-charcoal">Variant Rows</p>
            <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
              + Variant
            </Button>
          </div>
          {variants.map((v, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-cream-dark p-3 sm:grid-cols-4">
              <input placeholder="SKU" value={v.sku} onChange={(e) => {
                const next = [...variants]; next[i] = { ...v, sku: e.target.value }; setVariants(next);
              }} className="field-input" />
              <input placeholder="Price" type="number" value={v.price} onChange={(e) => {
                const next = [...variants]; next[i] = { ...v, price: e.target.value }; setVariants(next);
              }} className="field-input" />
              {!isService && (
                <input placeholder="Stock" type="number" value={v.stock_quantity} onChange={(e) => {
                  const next = [...variants]; next[i] = { ...v, stock_quantity: e.target.value }; setVariants(next);
                }} className="field-input" />
              )}
              <input placeholder="Attributes JSON e.g. size:L" value={JSON.stringify(v.attributes)} onChange={(e) => {
                try {
                  const next = [...variants]; next[i] = { ...v, attributes: JSON.parse(e.target.value) }; setVariants(next);
                } catch { /* invalid json */ }
              }} className="field-input" />
            </div>
          ))}
        </div>
      )}

      <CataloguePhotoField file={imageFile} existingUrl={initial?.image_url} removed={removeImage} disabled={submitting} onChange={setImageFile} onRemove={() => setRemoveImage(true)} />

      {error && <ErrorState error={error} />}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Save'}
      </Button>
    </form>
  );
}

export default ProductVariantForm;
