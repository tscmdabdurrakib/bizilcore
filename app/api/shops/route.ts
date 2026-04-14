import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/features";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  const plan = (sub?.plan ?? "free") as keyof typeof PLAN_LIMITS;

  if (plan !== "business") {
    return NextResponse.json({ error: "Business plan required", locked: true }, { status: 403 });
  }

  const maxShops = PLAN_LIMITS[plan].maxShops;

  const mainShop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    include: { branches: { orderBy: { createdAt: "asc" } } },
  });

  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  return NextResponse.json({
    mainShop: { id: mainShop.id, name: mainShop.name, category: mainShop.category, phone: mainShop.phone, address: mainShop.address, logoUrl: mainShop.logoUrl },
    branches: mainShop.branches,
    maxShops,
    totalShops: 1 + mainShop.branches.length,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  const plan = (sub?.plan ?? "free") as keyof typeof PLAN_LIMITS;

  if (plan !== "business") {
    return NextResponse.json({ error: "Business plan required" }, { status: 403 });
  }

  const maxShops = PLAN_LIMITS[plan].maxShops;

  const mainShop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    include: { _count: { select: { branches: true } } },
  });
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const totalShops = 1 + mainShop._count.branches;
  if (totalShops >= maxShops) {
    return NextResponse.json({ error: `আপনার Business Plan-এ সর্বোচ্চ ${maxShops}টি শপ রাখা যাবে` }, { status: 400 });
  }

  const { name, category, phone, address } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "শপের নাম দিন" }, { status: 400 });

  const branch = await prisma.shopBranch.create({
    data: {
      shopId: mainShop.id,
      name: name.trim(),
      category: category || null,
      phone: phone || null,
      address: address || null,
    },
  });

  return NextResponse.json(branch, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  if (!branchId) return NextResponse.json({ error: "branchId required" }, { status: 400 });

  const mainShop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const branch = await prisma.shopBranch.findFirst({ where: { id: branchId, shopId: mainShop.id } });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const { name, category, phone, address } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "শপের নাম দিন" }, { status: 400 });

  const updated = await prisma.shopBranch.update({
    where: { id: branchId },
    data: { name: name.trim(), category: category || null, phone: phone || null, address: address || null },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  if (!branchId) return NextResponse.json({ error: "branchId required" }, { status: 400 });

  const mainShop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const branch = await prisma.shopBranch.findFirst({ where: { id: branchId, shopId: mainShop.id } });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  await prisma.shopBranch.delete({ where: { id: branchId } });
  return NextResponse.json({ ok: true });
}
