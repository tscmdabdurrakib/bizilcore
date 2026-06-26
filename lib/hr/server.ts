import { prisma } from "@/lib/prisma";
import { isWithinLimit, type PlanName } from "@/lib/features";

export async function getShopForOwner(userId: string) {
  return prisma.shop.findUnique({ where: { userId } });
}

export async function getOwnerPlan(userId: string): Promise<PlanName> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { plan: true, status: true, endDate: true },
  });
  if (!sub) return "free";
  if (sub.endDate && sub.endDate < new Date() && sub.plan !== "free") return "free";
  return (sub.plan as PlanName) ?? "free";
}

export async function assertStaffLimit(shopId: string, userId: string) {
  const plan = await getOwnerPlan(userId);
  const count = await prisma.staffMember.count({
    where: { shopId, isActive: true },
  });
  if (!isWithinLimit(plan, "staff", count)) {
    return { ok: false as const, error: "আপনার প্ল্যানে আর staff যোগ করা যাবে না। Pro-তে ৩ জন, Business-এ unlimited।" };
  }
  return { ok: true as const };
}

/** Combine date (YYYY-MM-DD) with time (HH:mm) into a Date */
export function combineDateTime(dateStr: string, timeStr: string | null | undefined): Date | null {
  if (!timeStr?.trim()) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date(dateStr);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Parse checkIn/checkOut — accepts ISO datetime or HH:mm with date context */
export function parseAttendanceTime(
  value: string | null | undefined,
  dateStr: string,
): Date | null {
  if (!value?.trim()) return null;
  if (value.includes("T") || value.includes("-") && value.length > 10) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return combineDateTime(dateStr, value);
}

export function eachDateInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endD = new Date(end);
  endD.setHours(0, 0, 0, 0);
  while (cur <= endD) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function countWorkingDaysInMonth(year: number, month: number): number {
  const days = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= days; d++) {
    const day = new Date(year, month - 1, d).getDay();
    if (day !== 5) count++; // exclude Friday as default off-day
  }
  return count || days;
}
