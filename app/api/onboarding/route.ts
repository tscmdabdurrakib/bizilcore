import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { getModules, isValidBusinessType, isValidSalesChannel } from "@/lib/modules";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "step1") {
    const { shopName, phone, category, gender, businessType, salesChannel } = body;

    const resolvedType    = businessType && isValidBusinessType(businessType) ? businessType : "fcommerce";
    const resolvedChannel = salesChannel && isValidSalesChannel(salesChannel) ? salesChannel : "both";
    const activeModules   = getModules(resolvedType, resolvedChannel);

    const existingShop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
    const slug = existingShop?.slug ?? await generateUniqueSlug(shopName || "shop", prisma);

    await prisma.shop.upsert({
      where: { userId: session.user.id },
      update: {
        name: shopName || undefined,
        phone: phone || undefined,
        category: category || undefined,
        businessType: resolvedType,
        salesChannel: resolvedChannel,
        activeModules,
        slug: existingShop?.slug ? undefined : slug,
      },
      create: {
        userId: session.user.id,
        name: shopName || "আমার শপ",
        phone: phone || undefined,
        category: category || undefined,
        businessType: resolvedType,
        salesChannel: resolvedChannel,
        activeModules,
        slug,
      },
    });

    if (gender) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { gender },
      });
    }

    return NextResponse.json({ success: true });
  }

  if (action === "step2") {
    const { products = [] } = body;

    const existingShop2 = await prisma.shop.findUnique({ where: { userId: session.user.id } });
    const slug2 = existingShop2?.slug ?? await generateUniqueSlug("shop", prisma);

    const shop = await prisma.shop.upsert({
      where: { userId: session.user.id },
      update: existingShop2?.slug ? {} : { slug: slug2 },
      create: {
        userId: session.user.id,
        name: "আমার শপ",
        businessType: "fcommerce",
        activeModules: getModules("fcommerce"),
        slug: slug2,
      },
    });

    const validProducts = products.filter(
      (p: { name: string }) => p.name?.trim()
    );

    if (validProducts.length > 0) {
      await prisma.product.createMany({
        data: validProducts.map((p: { name: string; sellPrice: string; stockQty: string }) => ({
          name: p.name.trim(),
          sellPrice: parseFloat(p.sellPrice) || 0,
          buyPrice: 0,
          stockQty: parseInt(p.stockQty) || 0,
          shopId: shop.id,
        })),
      });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboarded: true },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
