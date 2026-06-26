import { PO_STATUS_CONFIG } from "./types";

export function getPOStatusLabel(status: string): string {
  return PO_STATUS_CONFIG[status]?.label ?? status;
}

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

export function daysUntil(dateStr: string): number {
  return Math.round((parseLocalDate(dateStr).getTime() - todayMidnight().getTime()) / 86400000);
}

export function isPOOverdue(expectedDate: string | null, status: string): boolean {
  if (!expectedDate) return false;
  if (status === "received" || status === "cancelled") return false;
  return daysUntil(expectedDate) < 0;
}

export function buildPOMessage(po: {
  poNumber: string;
  total: number;
  expectedDate: Date | null;
  notes: string | null;
  createdAt: Date;
  items: { name: string; quantity: number; subtotal: number }[];
  supplier: { name: string } | null;
  shop: { name: string };
}): string {
  const itemsText = po.items
    .map((item) => `• ${item.name} × ${item.quantity} = ৳${item.subtotal.toLocaleString("bn-BD")}`)
    .join("\n");

  const expectedText = po.expectedDate
    ? `\n🗓️ প্রত্যাশিত ডেলিভারি: ${new Date(po.expectedDate).toLocaleDateString("bn-BD")}`
    : "";

  const notesText = po.notes ? `\n📝 ${po.notes}` : "";

  return `📦 ক্রয় অর্ডার: ${po.poNumber}
📅 তারিখ: ${new Date(po.createdAt).toLocaleDateString("bn-BD")}
${po.supplier ? `🏢 সরবরাহকারী: ${po.supplier.name}` : ""}

পণ্যসমূহ:
${itemsText}
━━━━━━━━━━━━━━━
💰 মোট: ৳${po.total.toLocaleString("bn-BD")}${expectedText}${notesText}

— ${po.shop.name}`;
}
