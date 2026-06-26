import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOrganization, getPrimaryShop, requireBusinessPlan } from "@/lib/shops/access";
import { getModules } from "@/lib/modules";
import { createDefaultCoa } from "@/lib/accounting/seed-coa";
import { shopApiError } from "@/lib/shops/api-error";

/** Create a full child Shop (Phase 2 true multi-shop). */
export async function POST(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planCheck = await requireBusinessPlan(session.user.id);
  if (!planCheck.ok) return NextResponse.json({ error: "Business plan required" }, { status: 403 });

  const primaryShop = await getPrimaryShop(session.user.id);
  if (!primaryShop) return NextResponse.json({ error: "Primary shop not found" }, { status: 404 });

  const org = await ensureOrganization(session.user.id, primaryShop.id, primaryShop.name);

  const [branchCount, childCount] = await Promise.all([
    prisma.shopBranch.count({ where: { shopId: primaryShop.id } }),
    prisma.shop.count({ where: { parentShopId: primaryShop.id } }),
  ]);
  const totalLocations = 1 + branchCount + childCount;
  if (totalLocations >= planCheck.maxShops) {
    return NextResponse.json({ error: `সর্বোচ্চ ${planCheck.maxShops}টি লোকেশন` }, { status: 400 });
  }

  const { name, phone, address, category, businessType } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "শপের নাম দিন" }, { status: 400 });

  const bt = businessType ?? primaryShop.businessType;
  const sc = primaryShop.salesChannel;

  const childShop = await prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        name: name.trim(),
        phone: phone || null,
        address: address || null,
        category: category || primaryShop.category,
        businessType: bt,
        salesChannel: sc,
        activeModules: getModules(bt, sc),
        parentShopId: primaryShop.id,
        organizationId: org.id,
      },
    });

    await tx.shopMembership.create({
      data: { userId: session.user.id, shopId: shop.id, role: "owner", isDefault: false },
    });

    await createDefaultCoa(shop.id, tx);

    return shop;
  });

  return NextResponse.json(childShop, { status: 201 });
  } catch (error) {
    return shopApiError(error, "shops/child POST");
  }
}
