import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireBusinessPlan, getPrimaryShop, resolveActiveShop } from "@/lib/shops/access";
import { shopApiError } from "@/lib/shops/api-error";

async function branchStockStats(branchIds: string[]) {
  if (branchIds.length === 0) return new Map<string, { productCount: number; totalStockQty: number; lowStockCount: number }>();

  const rows = await prisma.branchStock.findMany({
    where: { branchId: { in: branchIds }, quantity: { gt: 0 } },
    include: { product: { select: { lowStockAt: true } } },
  });

  const map = new Map<string, { productCount: number; totalStockQty: number; lowStockCount: number }>();
  for (const id of branchIds) map.set(id, { productCount: 0, totalStockQty: 0, lowStockCount: 0 });

  for (const row of rows) {
    const cur = map.get(row.branchId)!;
    cur.productCount += 1;
    cur.totalStockQty += row.quantity;
    if (row.quantity <= (row.product.lowStockAt ?? 5)) cur.lowStockCount += 1;
    map.set(row.branchId, cur);
  }
  return map;
}

export async function GET() {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planCheck = await requireBusinessPlan(session.user.id);
  if (!planCheck.ok) {
    return NextResponse.json({ error: "Business plan required", locked: true }, { status: 403 });
  }

  const [mainShop, transferCount, productCount, customerCount] = await Promise.all([
    prisma.shop.findUnique({
      where: { userId: session.user.id },
      include: {
        branches: { orderBy: { createdAt: "asc" } },
        _count: { select: { products: true, customers: true } },
      },
    }),
    prisma.stockMovement.count({
      where: { userId: session.user.id, type: "branch_transfer" },
    }),
    prisma.product.count({ where: { shop: { userId: session.user.id } } }),
    prisma.customer.count({ where: { shop: { userId: session.user.id } } }),
  ]);

  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const stockStats = await branchStockStats(mainShop.branches.map(b => b.id));
  const { accessibleShops } = await resolveActiveShop(session.user.id);

  return NextResponse.json({
    mainShop: {
      id: mainShop.id,
      name: mainShop.name,
      category: mainShop.category,
      phone: mainShop.phone,
      address: mainShop.address,
      logoUrl: mainShop.logoUrl,
      productCount: mainShop._count.products,
      customerCount: mainShop._count.customers,
    },
    branches: mainShop.branches.map(b => {
      const stats = stockStats.get(b.id) ?? { productCount: 0, totalStockQty: 0, lowStockCount: 0 };
      return {
        id: b.id,
        name: b.name,
        category: b.category,
        phone: b.phone,
        address: b.address,
        logoUrl: b.logoUrl,
        note: b.note,
        isActive: b.isActive,
        linkedShopId: b.linkedShopId,
        createdAt: b.createdAt.toISOString(),
        productCount: stats.productCount,
        totalStockQty: stats.totalStockQty,
        lowStockCount: stats.lowStockCount,
      };
    }),
    maxShops: planCheck.maxShops,
    totalShops: 1 + mainShop.branches.length,
    transferCount,
    productCount,
    customerCount,
    childShops: accessibleShops.filter(s => !s.isPrimary),
  });
  } catch (error) {
    return shopApiError(error, "shops GET");
  }
}

export async function POST(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planCheck = await requireBusinessPlan(session.user.id);
  if (!planCheck.ok) return NextResponse.json({ error: "Business plan required" }, { status: 403 });

  const mainShop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    include: { _count: { select: { branches: true } } },
  });
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  if (1 + mainShop._count.branches >= planCheck.maxShops) {
    return NextResponse.json({ error: `সর্বোচ্চ ${planCheck.maxShops}টি লোকেশন রাখা যাবে` }, { status: 400 });
  }

  const { name, category, phone, address, note, logoUrl } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "শপের নাম দিন" }, { status: 400 });

  const branch = await prisma.shopBranch.create({
    data: {
      shopId: mainShop.id,
      name: name.trim(),
      category: category || null,
      phone: phone || null,
      address: address || null,
      note: note || null,
      logoUrl: logoUrl || null,
    },
  });

  return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    return shopApiError(error, "shops POST");
  }
}

export async function PATCH(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  if (!branchId) return NextResponse.json({ error: "branchId required" }, { status: 400 });

  const mainShop = await getPrimaryShop(session.user.id);
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const branch = await prisma.shopBranch.findFirst({ where: { id: branchId, shopId: mainShop.id } });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  const body = await req.json();
  const { name, category, phone, address, note, logoUrl, isActive } = body;

  if (isActive !== undefined && name === undefined) {
    const updated = await prisma.shopBranch.update({
      where: { id: branchId },
      data: { isActive: !!isActive },
    });
    return NextResponse.json(updated);
  }

  if (!name?.trim()) return NextResponse.json({ error: "শপের নাম দিন" }, { status: 400 });

  const updated = await prisma.shopBranch.update({
    where: { id: branchId },
    data: {
      name: name.trim(),
      category: category || null,
      phone: phone || null,
      address: address || null,
      note: note || null,
      ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
      ...(isActive !== undefined ? { isActive: !!isActive } : {}),
    },
  });

  return NextResponse.json(updated);
  } catch (error) {
    return shopApiError(error, "shops PATCH");
  }
}

export async function DELETE(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  if (!branchId) return NextResponse.json({ error: "branchId required" }, { status: 400 });

  const mainShop = await getPrimaryShop(session.user.id);
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const branch = await prisma.shopBranch.findFirst({ where: { id: branchId, shopId: mainShop.id } });
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.branchStock.deleteMany({ where: { branchId } }),
    prisma.shopBranch.delete({ where: { id: branchId } }),
  ]);

  return NextResponse.json({ ok: true });
  } catch (error) {
    return shopApiError(error, "shops DELETE");
  }
}
