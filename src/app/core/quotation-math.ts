import { QuotationItem } from './models';

export interface QuotationTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function lineAmount(item: QuotationItem): number {
  return round((item.quantity || 0) * (item.unitPrice || 0));
}

/**
 * Discount is applied to the subtotal first, then each line's tax is charged
 * on its discounted amount.
 */
export function quotationTotals(items: QuotationItem[], discountPercent: number): QuotationTotals {
  const factor = 1 - (discountPercent || 0) / 100;
  const subtotal = items.reduce((sum, i) => sum + lineAmount(i), 0);
  const tax = items.reduce((sum, i) => sum + lineAmount(i) * factor * ((i.taxRate || 0) / 100), 0);
  const discount = subtotal - subtotal * factor;
  return {
    subtotal: round(subtotal),
    discount: round(discount),
    tax: round(tax),
    total: round(subtotal - discount + tax),
  };
}
