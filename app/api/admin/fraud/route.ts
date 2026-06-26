import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";

function normalizeBDPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+880")) return "0" + cleaned.slice(4);
  if (cleaned.startsWith("880") && cleaned.length === 13) return "0" + cleaned.slice(3);
  return cleaned;
}

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("fraud");
  if ("error" in authResult) return authResult.error;

  const tab = req.nextUrl.searchParams.get("tab") ?? "overview";

  if (tab === "blacklist") {
    const entries = await prisma.phoneBlacklist.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { shop: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ entries });
  }

  if (tab === "reports") {
    const reports = await prisma.fakeOrderReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { shop: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ reports });
  }

  const phoneShopPairs = await prisma.fakeOrderReport.groupBy({
    by: ["phone", "shopId"],
  });
  const phoneToShops = new Map<string, Set<string>>();
  for (const row of phoneShopPairs) {
    if (!phoneToShops.has(row.phone)) phoneToShops.set(row.phone, new Set());
    phoneToShops.get(row.phone)!.add(row.shopId);
  }

  const crossShopPhones = [...phoneToShops.entries()]
    .filter(([, shops]) => shops.size >= 2)
    .map(([phone, shops]) => ({ phone, shopCount: shops.size }))
    .sort((a, b) => b.shopCount - a.shopCount)
    .slice(0, 50);

  const [
    totalReports,
    totalBlacklist,
    highRiskOrders,
    flaggedOrders,
  ] = await Promise.all([
    prisma.fakeOrderReport.count(),
    prisma.phoneBlacklist.count(),
    prisma.order.count({ where: { riskScore: { gte: 80 } } }),
    prisma.order.count({ where: { fakeReported: true } }),
  ]);

  return NextResponse.json({
    totalReports,
    totalBlacklist,
    highRiskOrders,
    flaggedOrders,
    crossShopCount: crossShopPhones.length,
    crossShopPhones,
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdminRole("fraud");
  if ("error" in authResult) return authResult.error;

  const { phone, shopId, reason } = await req.json();
  if (!phone || !shopId) {
    return NextResponse.json({ error: "phone and shopId required" }, { status: 400 });
  }

  const normalized = normalizeBDPhone(String(phone).trim());
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const entry = await prisma.phoneBlacklist.upsert({
    where: { shopId_phone: { shopId, phone: normalized } },
    create: { shopId, phone: normalized, reason: reason || "Admin blocked", blockedBy: "admin" },
    update: { reason: reason || "Admin blocked", blockedBy: "admin" },
  });

  await logAdminAction(authResult.user.id, "fraud.blacklist_add", "phone", normalized, { shopId });

  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAdminRole("fraud");
  if ("error" in authResult) return authResult.error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.phoneBlacklist.delete({ where: { id } });
  await logAdminAction(authResult.user.id, "fraud.blacklist_remove", "phoneBlacklist", id);

  return NextResponse.json({ success: true });
}
