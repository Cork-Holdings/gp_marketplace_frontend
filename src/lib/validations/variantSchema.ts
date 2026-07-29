/**
 * Dynamic product attribute / variant schema helpers.
 * Maps backend variant attributes to UI control types.
 */

export const ATTRIBUTE_TYPES = {
  SELECT: 'select',
  TEXT: 'text',
  NUMBER: 'number',
  DIMENSION: 'dimension',
};

/** Infer attribute schema from product variants when explicit schema absent. */
export function inferAttributeSchema(product: any) {
  // Backend uses attributes_schema; some clients send attribute_schema.
  if (product?.attributes_schema?.length) return product.attributes_schema;
  if (product?.attribute_schema?.length) return product.attribute_schema;

  const variants = product?.variants ?? [];
  if (!variants.length) return [];

  const keys = new Set<string>();
  variants.forEach((v: any) => {
    Object.keys(v.attributes ?? {}).forEach((k) => keys.add(k));
  });

  return [...keys].map((key) => {
    const values = [
      ...new Set(
        variants
          .map((v) => v.attributes?.[key])
          .filter((val) => val !== undefined && val !== null && val !== ''),
      ),
    ];
    const type =
      key.match(/size|waist|length|volume|weight|portion/i) && values.length > 1
        ? ATTRIBUTE_TYPES.SELECT
        : values.length > 1
          ? ATTRIBUTE_TYPES.SELECT
          : ATTRIBUTE_TYPES.TEXT;

    return {
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      type,
      options: values,
      unit: key.match(/length|waist/i) ? 'cm' : key.match(/volume/i) ? 'ml' : undefined,
    };
  });
}

export function findMatchingVariant(variants: any[], selectedAttributes: Record<string, unknown>) {
  if (!variants?.length) return null;
  if (!selectedAttributes || !Object.keys(selectedAttributes).length) {
    return variants.find((v) => !v.attributes || !Object.keys(v.attributes).length) ?? variants[0];
  }
  return (
    variants.find((v) =>
      Object.entries(selectedAttributes).every(
        ([key, val]) => String(v.attributes?.[key] ?? '') === String(val),
      ),
    ) ?? null
  );
}

export function computeVariantPrice(basePrice: unknown, variant: any) {
  const price = parseFloat(variant?.price ?? basePrice ?? 0);
  const adjustment = parseFloat(variant?.price_adjustment ?? 0);
  return price + adjustment;
}

export function cartLineKey(
  productId: unknown,
  variantId: unknown,
  attributes: Record<string, unknown> | undefined,
  modifierKey = '',
) {
  const attrKey = attributes
    ? Object.entries(attributes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${v}`)
        .join('|')
    : '';
  return `${productId}:${variantId ?? 'base'}:${attrKey}:${modifierKey}`;
}
