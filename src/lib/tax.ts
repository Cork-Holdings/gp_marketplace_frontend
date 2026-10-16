import type { CartTotals } from '@/lib/context/CartContext';

/**
 * Tax-inclusive pricing: listed item prices are what the customer pays.
 * Tax is extracted from the gross item total (not added on top).
 * e.g. K100 at 16% → total K100, tax K13.79, ex-tax subtotal K86.21.
 */
export function computeInclusiveTaxTotals(
  grossTotal: number,
  taxRate: number,
  delivery = 0,
  itemCount = 0,
): CartTotals {
  const tax =
    taxRate > 0 && grossTotal > 0
      ? Math.round(grossTotal * taxRate / (1 + taxRate) * 100) / 100
      : 0;
  const subtotal = Math.round((grossTotal - tax) * 100) / 100;
  const total = Math.round((grossTotal + delivery) * 100) / 100;
  return { subtotal, tax, delivery, total, itemCount };
}
