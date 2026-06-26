import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { autoMarkOverdueInvoices, getShopForUser } from "@/lib/invoices/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  await autoMarkOverdueInvoices(shop.id);

  const [totalCount, paidAgg, pendingAgg, overdueAgg, overdueCount] = await Promise.all([
    prisma.invoice.count({ where: { shopId: shop.id } }),
    prisma.invoice.aggregate({
      where: { shopId: shop.id, status: "paid" },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { shopId: shop.id, status: { in: ["sent", "partial", "overdue"] } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { shopId: shop.id, status: "overdue" },
      _sum: { total: true },
    }),
    prisma.invoice.count({ where: { shopId: shop.id, status: "overdue" } }),
  ]);

  return NextResponse.json({
    totalCount,
    totalPaid: paidAgg._sum.total ?? 0,
    totalPending: pendingAgg._sum.total ?? 0,
    totalOverdue: overdueAgg._sum.total ?? 0,
    overdueCount,
  });
}
