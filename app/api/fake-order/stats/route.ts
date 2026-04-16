import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const [blacklistCount, reportedCount, highRiskCount, blockedThisMonth] = await Promise.all([
    prisma.phoneBlacklist.count({ where: { shopId: shop.id } }),
    prisma.order.count({ where: { userId: session.user.id, fakeReported: true } }),
    prisma.order.count({ where: { userId: session.user.id, riskScore: { gte: 80 } } }),
    prisma.phoneBlacklist.count({
      where: {
        shopId: shop.id,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
  ]);

  return NextResponse.json({ blacklistCount, reportedCount, highRiskCount, blockedThisMonth });
}
