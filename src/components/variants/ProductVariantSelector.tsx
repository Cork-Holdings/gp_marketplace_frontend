import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  inferAttributeSchema,
  findMatchingVariant,
  computeVariantPrice,
  ATTRIBUTE_TYPES,
} from '@/lib/validations/variantSchema';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_CURRENCY } from '@/lib/locale';

/**
 * Customer-facing variant selector — renders dynamic controls from product schema.
 * Emits the matched selection on mount so Add to cart is not stuck disabled
 * for simple products that only have a default variant.
 */
export function ProductVariantSelector({ product, onChange, className = '' }) {
  const schema = useMemo(() => inferAttributeSchema(product), [product]);
  const variants = product?.variants ?? [];

  const [attributes, setAttributes] = useState(() => {
    const initial = {};
    schema.forEach((attr) => {
      if (attr.options?.length) initial[attr.key] = attr.options[0];
    });
    return initial;
  });

  const matchedVariant = useMemo(
    () => findMatchingVariant(variants, attributes),
    [variants, attributes],
  );

  const unitPrice = useMemo(
    () => computeVariantPrice(product?.price, matchedVariant),
    [product?.price, matchedVariant],
  );

  // Keep parent selection in sync (including initial default match).
  useEffect(() => {
    onChange?.({
      attributes,
      variant: matchedVariant,
      variantId: matchedVariant?.id ?? null,
      unitPrice,
    });
  }, [attributes, matchedVariant, unitPrice, onChange]);

  const handleChange = useCallback((key, value) => {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Nothing choosable — parent still receives the default variant via the effect above.
  if (!schema.length) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {schema.map((attr) => (
        <div key={attr.key}>
          <label className="mb-1.5 block text-xs font-medium text-forest-muted">
            {attr.label}
            {attr.unit && <span className="text-forest-muted/70"> ({attr.unit})</span>}
          </label>

          {attr.type === ATTRIBUTE_TYPES.SELECT && attr.options?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {attr.options.map((opt) => {
                const active = attributes[attr.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange(attr.key, opt)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? 'border-forest bg-forest text-cream'
                        : 'border-cream-dark bg-white text-charcoal hover:border-forest-muted'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : attr.type === ATTRIBUTE_TYPES.NUMBER || attr.type === ATTRIBUTE_TYPES.DIMENSION ? (
            <input
              type="number"
              min="0"
              step={attr.type === ATTRIBUTE_TYPES.DIMENSION ? '0.1' : '1'}
              value={attributes[attr.key] ?? ''}
              onChange={(e) => handleChange(attr.key, e.target.value)}
              className="w-full rounded-lg border border-cream-dark px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
          ) : (
            <input
              type="text"
              value={attributes[attr.key] ?? ''}
              onChange={(e) => handleChange(attr.key, e.target.value)}
              className="w-full rounded-lg border border-cream-dark px-3 py-2 text-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
          )}
        </div>
      ))}

      <div className="flex items-center justify-between rounded-lg bg-cream/60 px-3 py-2">
        <span className="text-xs text-forest-muted">Selected price</span>
        <span className="font-semibold text-charcoal">
          {formatCurrency(unitPrice, product?.currency ?? DEFAULT_CURRENCY)}
        </span>
      </div>

      {schema.length > 0 && !matchedVariant && (
        <p className="text-xs text-amber-700">This combination is not available.</p>
      )}
    </div>
  );
}

export default ProductVariantSelector;
