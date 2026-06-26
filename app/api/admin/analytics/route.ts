import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("analytics");
  if ("error" in authResult) return authResult.error;

  const metric = req.nextUrl.searchParams.get("metric") ?? "signups";
  const granularity = req.nextUrl.searchParams.get("granularity") ?? "day";
  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");

  const to = toParam ? new Date(toParam) : new Date();
  const from = fromParam
    ? new Date(fromParam)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  const trunc = granularity === "month" ? "month" : granularity === "week" ? "week" : "day";

  let rows: { period: Date; count: bigint; total?: number }[];

  if (metric === "signups") {
    rows = await prisma.$queryRaw`
      SELECT date_trunc(${trunc}, "createdAt") AS period, COUNT(*)::bigint AS count
      FROM "User"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY period ORDER BY period ASC
    `;
  } else if (metric === "orders") {
    rows = await prisma.$queryRaw`
      SELECT date_trunc(${trunc}, "createdAt") AS period, COUNT(*)::bigint AS count
      FROM "Order"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
      GROUP BY period ORDER BY period ASC
    `;
  } else {
    rows = await prisma.$queryRaw`
      SELECT date_trunc(${trunc}, "createdAt") AS period, COUNT(*)::bigint AS count, COALESCE(SUM(amount), 0)::float AS total
      FROM "Payment"
      WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
        AND status IN ('completed', 'approved')
      GROUP BY period ORDER BY period ASC
    `;
  }

  const data = rows.map((r) => ({
    period: r.period.toISOString(),
    count: Number(r.count),
    total: r.total !== undefined ? Number(r.total) : undefined,
  }));

  return NextResponse.json({ metric, granularity, from: from.toISOString(), to: to.toISOString(), data });
}
