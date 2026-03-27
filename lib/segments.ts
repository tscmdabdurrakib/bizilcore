import { prisma } from "@/lib/prisma";

export type SegmentKey = "vip" | "new" | "active" | "at_risk" | "dormant" | "none";

export interface SegmentMember {
  id: string;
  name: string;
  phone: string | null;
  totalOrders: number;
  totalSpend: number;
  lastOrderAt: string | null;
}

export interface SegmentCard {
  key: SegmentKey;
  label: string;
  description: string;
  color: string;
  bg: string;
  count: number;
  phoneCount: number;
  customers: SegmentMember[];
}

const DAYS_MS = (n: number) => n * 24 * 60 * 60 * 1000;

export function classifySegment(
  orderCount: number,
  totalSpend: number,
  firstOrder: Date | null,
  lastOrder: Date | null,
  now: Date
): SegmentKey {
  if (orderCount === 0) return "none";

  const days30 = new Date(now.getTime() - DAYS_MS(30));
  const days45 = new Date(now.getTime() - DAYS_MS(45));
  const days90 = new Date(now.getTime() - DAYS_MS(90));

  if (orderCount >= 5 || totalSpend > 10000) return "vip";
  if (firstOrder && firstOrder >= days30) return "new";
  if (lastOrder && lastOrder >= days30) return "active";
  if (lastOrder && lastOrder < days45 && lastOrder >= days90) return "at_risk";
  if (!lastOrder || lastOrder < days90) return "dormant";

  return "none";
}

export const SEGMENT_META: Record<Exclude<SegmentKey, "none">, { label: string; description: string; color: string; bg: string }> = {
  vip: {
    label: "VIP",
    description: "৫+ অর্ডার বা ৳১০,০০০+ ক্রয়",
    color: "#B45309",
    bg: "#FEF3C7",
  },
  new: {
    label: "নতুন",
    description: "৩০ দিনের মধ্যে প্রথম অর্ডার",
    color: "#1D4ED8",
    bg: "#DBEAFE",
  },
  active: {
    label: "সক্রিয়",
    description: "শেষ ৩০ দিনে অর্ডার করেছেন",
    color: "#15803D",
    bg: "#DCFCE7",
  },
  at_risk: {
    label: "ঝুঁকিতে",
    description: "৪৫–৯০ দিন ধরে অর্ডার নেই",
    color: "#C2410C",
    bg: "#FFF0E8",
  },
  dormant: {
    label: "নিষ্ক্রিয়",
    description: "৯০+ দিন ধরে নিষ্ক্রিয়",
    color: "#6B7280",
    bg: "#F3F4F6",
  },
};

export async function computeSegments(shopId: string): Promise<SegmentCard[]> {
  const customers = await prisma.customer.findMany({
    where: { shopId },
    select: {
      id: true,
      name: true,
      phone: true,
      orders: {
        select: { totalAmount: true, createdAt: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const now = new Date();
  const buckets: Record<Exclude<SegmentKey, "none">, SegmentMember[]> = {
    vip: [],
    new: [],
    active: [],
    at_risk: [],
    dormant: [],
  };

  for (const c of customers) {
    const completed = c.orders.filter(o => o.status !== "cancelled");
    const orderCount = completed.length;
    const totalSpend = completed.reduce((s, o) => s + o.totalAmount, 0);
    const lastOrder = completed[0]?.createdAt ?? null;
    const firstOrder = completed[completed.length - 1]?.createdAt ?? null;

    const key = classifySegment(orderCount, totalSpend, firstOrder, lastOrder, now);
    if (key === "none") continue;

    buckets[key].push({
      id: c.id,
      name: c.name,
      phone: c.phone,
      totalOrders: orderCount,
      totalSpend,
      lastOrderAt: lastOrder ? lastOrder.toISOString() : null,
    });
  }

  return (Object.keys(SEGMENT_META) as Exclude<SegmentKey, "none">[]).map(key => ({
    key,
    ...SEGMENT_META[key],
    count: buckets[key].length,
    phoneCount: buckets[key].filter(m => m.phone).length,
    customers: buckets[key],
  }));
}

export async function computeSegmentRecipients(shopId: string, segmentKey: SegmentKey): Promise<SegmentMember[]> {
  const segments = await computeSegments(shopId);
  return segments.find(s => s.key === segmentKey)?.customers ?? [];
}

export async function computeCustomerSegment(shopId: string, customerId: string): Promise<SegmentKey> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId },
    select: {
      orders: {
        select: { totalAmount: true, createdAt: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!customer) return "none";

  const completed = customer.orders.filter(o => o.status !== "cancelled");
  const orderCount = completed.length;
  const totalSpend = completed.reduce((s, o) => s + o.totalAmount, 0);
  const lastOrder = completed[0]?.createdAt ?? null;
  const firstOrder = completed[completed.length - 1]?.createdAt ?? null;

  return classifySegment(orderCount, totalSpend, firstOrder, lastOrder, new Date());
}
