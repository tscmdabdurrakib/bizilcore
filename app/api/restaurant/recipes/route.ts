import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const menuItemId = searchParams.get("menuItemId");

  if (menuItemId) {
    const item = await prisma.menuItem.findFirst({ where: { id: menuItemId, shopId: shop.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const recipes = await prisma.recipe.findMany({
      where: { menuItemId },
      include: { material: true },
    });
    return NextResponse.json(recipes);
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { shopId: shop.id },
    include: {
      recipes: { include: { material: { select: { id: true, name: true, unit: true } } } },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(menuItems);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();
  const { menuItemId, ingredients } = body;

  if (!menuItemId || !Array.isArray(ingredients)) {
    return NextResponse.json({ error: "menuItemId and ingredients required" }, { status: 400 });
  }

  const item = await prisma.menuItem.findFirst({ where: { id: menuItemId, shopId: shop.id } });
  if (!item) return NextResponse.json({ error: "Menu item not found" }, { status: 404 });

  const validIngredients = ingredients.filter(
    (i: { materialId: string; quantity: number }) => i.materialId && i.quantity > 0
  );

  if (validIngredients.length > 0) {
    const requestedIds = validIngredients.map((i: { materialId: string }) => i.materialId);
    const shopMaterials = await prisma.rawMaterial.findMany({
      where: { id: { in: requestedIds }, shopId: shop.id },
      select: { id: true },
    });
    const shopMaterialIds = new Set(shopMaterials.map((m) => m.id));
    const crossTenantIds = requestedIds.filter((id: string) => !shopMaterialIds.has(id));
    if (crossTenantIds.length > 0) {
      return NextResponse.json({ error: "Invalid material IDs" }, { status: 403 });
    }
  }

  await prisma.recipe.deleteMany({ where: { menuItemId } });

  if (validIngredients.length > 0) {
    await prisma.recipe.createMany({
      data: validIngredients.map((i: { materialId: string; quantity: number }) => ({
        menuItemId,
        materialId: i.materialId,
        quantity: Number(i.quantity),
      })),
      skipDuplicates: true,
    });
  }

  const updated = await prisma.recipe.findMany({
    where: { menuItemId },
    include: { material: true },
  });

  return NextResponse.json(updated);
}
