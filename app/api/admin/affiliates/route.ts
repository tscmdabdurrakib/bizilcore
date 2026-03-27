import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  if (!user?.isAdmin) return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // all, pending, approved, rejected

  const affiliates = await prisma.affiliate.findMany({
    where: status && status !== "all" ? { status } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true, subscription: { select: { plan: true } } } },
      payouts: { orderBy: { createdAt: "desc" } },
      _count: { select: { clicks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totals = {
    totalAffiliates: affiliates.length,
    pending: affiliates.filter(a => a.status === "pending").length,
    approved: affiliates.filter(a => a.status === "approved").length,
    totalEarnings: affiliates.reduce((sum, a) => sum + a.totalEarnings, 0),
    pendingPayouts: affiliates.reduce((sum, a) => sum + a.pendingPayout, 0),
    totalSignups: affiliates.reduce((sum, a) => sum + a.totalSignups, 0),
  };

  return NextResponse.json({ affiliates, totals });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, affiliateId, reason, commissionRate, payoutId } = body;

  if (!affiliateId) return NextResponse.json({ error: "affiliateId required" }, { status: 400 });

  if (action === "approve") {
    const updated = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: { status: "approved", approvedAt: new Date(), rejectedReason: null },
    });
    return NextResponse.json(updated);
  }

  if (action === "reject") {
    const updated = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: { status: "rejected", rejectedReason: reason || "Rejected by admin" },
    });
    return NextResponse.json(updated);
  }

  if (action === "setCommission") {
    if (typeof commissionRate !== "number") return NextResponse.json({ error: "commissionRate required" }, { status: 400 });
    const updated = await prisma.affiliate.update({
      where: { id: affiliateId },
      data: { commissionRate },
    });
    return NextResponse.json(updated);
  }

  if (action === "markPaid") {
    if (!payoutId) return NextResponse.json({ error: "payoutId required" }, { status: 400 });

    const payout = await prisma.affiliatePayout.update({
      where: { id: payoutId },
      data: { status: "paid", paidAt: new Date() },
    });

    await prisma.affiliate.update({
      where: { id: affiliateId },
      data: { pendingPayout: { decrement: payout.amount } },
    });

    return NextResponse.json(payout);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
