/**
 * Pure money-path helpers for retail POS sales. Kept dependency-free so they
 * can be unit-tested in isolation (no DB / auth).
 */

export interface SaleLine {
  quantity: number;
  unitPrice: number;
  vatRate?: number;
}

export interface SaleTotals {
  subTotal: number;
  vatTotal: number;
  discount: number;
  grandTotal: number;
}

/**
 * Compute retail sale totals. Discount is clamped to [0, subTotal + vat] so the
 * grand total can never go negative.
 */
export function computeRetailSaleTotals(items: SaleLine[], discountAmount = 0): SaleTotals {
  const subTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vatTotal = items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.vatRate ?? 0), 0);
  const discount = Math.min(Math.max(0, discountAmount), subTotal + vatTotal);
  const grandTotal = Math.max(0, subTotal + vatTotal - discount);
  return { subTotal, vatTotal, discount, grandTotal };
}
