import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrimaryShop, requireBusinessPlan } from "@/lib/shops/access";
import { shopApiError } from "@/lib/shops/api-error";

const COUNTED = ["confirmed", "shipped", "delivered"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ branchId: string }> }) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planCheck = await requireBusinessPlan(session.user.id);
  if (!planCheck.ok) return NextResponse.json({ error: "Business plan required" }, { status: 403 });

  const mainShop = await getPrimaryShop(session.user.id);
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { branchId } = await params;
  const days = Math.min(parseInt(new URL(req.url).searchParams.get("days") ?? "30"), 365);

  const branch = await prisma.shopBranch.findFirst({
    where: { id: branchId, shopId: mainShop.id },
    select: { id: true, name: true },
  });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const since = new Date(Date.now() - days * 86400000);

  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
      branchId,
      createdAt: { gte: since },
      status: { in: COUNTED },
    },
    select: {
      id: true,
      totalAmount: true,
      paidAmount: true,
      status: true,
      createdAt: true,
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const agg = await prisma.order.aggregate({
    where: {
      userId: session.user.id,
      branchId,
      createdAt: { gte: since },
      status: { in: COUNTED },
    },
    _count: true,
    _sum: { totalAmount: true, paidAmount: true },
  });

  const allOrdersCount = await prisma.order.count({
    where: { userId: session.user.id, branchId, createdAt: { gte: since } },
  });

  return NextResponse.json({
    branch,
    days,
    summary: {
      validOrders: agg._count,
      totalOrders: allOrdersCount,
      revenue: agg._sum.totalAmount ?? 0,
      collected: agg._sum.paidAmount ?? 0,
    },
    recentOrders: orders.map(o => ({
      id: o.id,
      shortId: o.id.slice(-6).toUpperCase(),
      totalAmount: o.totalAmount,
      paidAmount: o.paidAmount,
      status: o.status,
      customerName: o.customer?.name ?? "—",
      createdAt: o.createdAt.toISOString(),
    })),
  });
  } catch (error) {
    return shopApiError(error, "shops/branches/[branchId]/sales GET");
  }
}
