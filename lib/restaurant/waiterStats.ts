import { prisma } from "@/lib/prisma";

export interface WaiterStat {
  id: string;
  name: string;
  jobTitle: string | null;
  totalOrders: number;
  totalRevenue: number;
  totalTips: number;
  avgOrderValue: number;
  tablesServed: number;
}

/**
 * Shared helper used by both /api/restaurant/waiters (POS assignment list)
 * and /api/restaurant/reports/waiters (analytics tab).
 *
 * @param shopId  - the shop to query
 * @param dateFrom - optional ISO date string for range start (inclusive)
 * @param dateTo   - optional ISO date string for range end (inclusive)
 * @param role     - optional case-insensitive substring to filter by jobTitle
 *                   (e.g. "waiter" filters to staff whose title contains "waiter")
 */
export async function getWaiterStats(
  shopId: string,
  dateFrom?: string | null,
  dateTo?: string | null,
  role?: string | null,
): Promise<WaiterStat[]> {
  const staffWhere: Record<string, unknown> = { shopId, isActive: true };
  if (role) {
    staffWhere.jobTitle = { contains: role, mode: "insensitive" };
  }

  let orderDateFilter: Record<string, Date> | undefined;
  if (dateFrom || dateTo) {
    orderDateFilter = {};
    if (dateFrom) orderDateFilter.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      orderDateFilter.lt = end;
    }
  }

  const staff = await prisma.staffMember.findMany({
    where: staffWhere,
    select: {
      id: true,
      jobTitle: true,
      user: { select: { name: true } },
      assignedOrders: {
        where: {
          status: "paid",
          ...(orderDateFilter ? { createdAt: orderDateFilter } : {}),
        },
        select: { id: true, totalAmount: true, tipAmount: true, tableId: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return staff.map(w => {
    const orders        = w.assignedOrders;
    const totalOrders   = orders.length;
    const totalRevenue  = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalTips     = orders.reduce((s, o) => s + (o.tipAmount ?? 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const tablesServed  = new Set(orders.filter(o => o.tableId).map(o => o.tableId)).size;
    return { id: w.id, name: w.user.name, jobTitle: w.jobTitle, totalOrders, totalRevenue, totalTips, avgOrderValue, tablesServed };
  });
}

/** Parse and validate a date query param. Returns null if blank, throws with message if invalid. */
export function parseDateParam(value: string | null, paramName: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) throw new Error(`Invalid date for parameter "${paramName}": ${value}`);
  return value;
}
