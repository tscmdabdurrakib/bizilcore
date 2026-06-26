import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureOrganization, getPrimaryShop, requireBusinessPlan } from "@/lib/shops/access";
import { getModules } from "@/lib/modules";
import { shopApiError } from "@/lib/shops/api-error";

/** Migrate ShopBranch record(s) to full child Shop entities. */
export async function POST(req: Request) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planCheck = await requireBusinessPlan(session.user.id);
  if (!planCheck.ok) return NextResponse.json({ error: "Business plan required" }, { status: 403 });

  const primaryShop = await getPrimaryShop(session.user.id);
  if (!primaryShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  let branchId: string | undefined;
  try {
    const body = await req.json();
    branchId = body?.branchId;
  } catch { /* bulk migrate */ }

  const org = await ensureOrganization(session.user.id, primaryShop.id, primaryShop.name);

  const branches = await prisma.shopBranch.findMany({
    where: {
      shopId: primaryShop.id,
      linkedShopId: null,
      ...(branchId ? { id: branchId } : {}),
    },
    include: { branchStocks: { include: { product: true } } },
  });

  if (branchId && branches.length === 0) {
    return NextResponse.json({ error: "Branch already migrated বা পাওয়া যায়নি" }, { status: 404 });
  }

  const migrated: string[] = [];
  const errors: Array<{ branchId: string; branchName: string; error: string }> = [];

  for (const branch of branches) {
    try {
      const childShop = await prisma.$transaction(async (tx) => {
        const shop = await tx.shop.create({
          data: {
            name: branch.name,
            phone: branch.phone,
            address: branch.address,
            category: branch.category,
            logoUrl: branch.logoUrl,
            businessType: primaryShop.businessType,
            salesChannel: primaryShop.salesChannel,
            activeModules: getModules(primaryShop.businessType, primaryShop.salesChannel),
            parentShopId: primaryShop.id,
            organizationId: org.id,
          },
        });

        await tx.shopMembership.create({
          data: { userId: session.user.id, shopId: shop.id, role: "owner" },
        });

        for (const bs of branch.branchStocks) {
          if (bs.quantity <= 0) continue;
          const existing = await tx.product.findFirst({
            where: { shopId: shop.id, sku: bs.product.sku ?? undefined, name: bs.product.name },
          });
          if (existing) {
            await tx.product.update({
              where: { id: existing.id },
              data: { stockQty: { increment: bs.quantity } },
            });
          } else {
            await tx.product.create({
              data: {
                shopId: shop.id,
                name: bs.product.name,
                sku: bs.product.sku,
                buyPrice: bs.product.buyPrice,
                sellPrice: bs.product.sellPrice,
                stockQty: bs.quantity,
                lowStockAt: bs.product.lowStockAt,
                category: bs.product.category,
                imageUrl: bs.product.imageUrl,
              },
            });
          }
        }

        await tx.shopBranch.update({
          where: { id: branch.id },
          data: { linkedShopId: shop.id },
        });

        return shop;
      });

      migrated.push(childShop.id);
    } catch (err) {
      errors.push({
        branchId: branch.id,
        branchName: branch.name,
        error: err instanceof Error ? err.message : "Migration failed",
      });
    }
  }

  if (migrated.length === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: "কোনো শাখা migrate করা যায়নি", errors },
      { status: 500 },
    );
  }

  return NextResponse.json({ migrated: migrated.length, shopIds: migrated, errors });
  } catch (error) {
    return shopApiError(error, "shops/migrate-branches POST");
  }
}
