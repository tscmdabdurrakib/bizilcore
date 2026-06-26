import { INVOICE_STATUS_CONFIG } from "./types";

export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return new Date(0);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

export function todayMidnight(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

export function isPastDue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return parseLocalDate(dueDate) < todayMidnight();
}

export function daysUntilDue(dueDate: string): number {
  return Math.round((parseLocalDate(dueDate).getTime() - todayMidnight().getTime()) / (1000 * 60 * 60 * 24));
}

export function calcInvoiceTotals(
  items: { quantity: number; unitPrice: number }[],
  discount: number,
  taxRate: number
) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discountAmount = Math.max(0, discount);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * (Math.max(0, taxRate) / 100);
  const total = taxable + taxAmount;
  return { subtotal, discount: discountAmount, taxAmount, total };
}

export function getStatusLabel(status: string): string {
  return INVOICE_STATUS_CONFIG[status]?.label ?? status;
}

export function getPublicInvoiceUrl(token: string | null | undefined): string {
  if (!token) return "";
  if (typeof window !== "undefined") {
    return `${window.location.origin}/inv/${token}`;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";
  return `${base}/inv/${token}`;
}

export function paymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    cash: "নগদ",
    bkash: "bKash",
    nagad: "Nagad",
    bank: "ব্যাংক",
    card: "কার্ড",
    other: "অন্যান্য",
  };
  return map[method] ?? method;
}
