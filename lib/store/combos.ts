import { prisma } from "@/lib/prisma";

export function computeComboAvailableStock(
  items: { quantity: number; product: { stockQty: number }; variant: { stockQty: number } | null }[],
) {
  if (items.length === 0) return 0;
  return Math.floor(
    Math.min(...items.map((ci) => (ci.variant ? ci.variant.stockQty : ci.product.stockQty) / ci.quantity)),
  );
}

export function computeComboOriginalPrice(
  items: { quantity: number; product: { sellPrice: number }; variant: { price: number | null } | null }[],
) {
  return items.reduce((sum, ci) => {
    const price = ci.variant?.price ?? ci.product.sellPrice;
    return sum + price * ci.quantity;
  }, 0);
}

export async function getStoreCombos(shopId: string) {
  const combos = await prisma.comboProduct.findMany({
    where: { shopId, isActive: true, storeVisible: true },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sellPrice: true, stockQty: true, imageUrl: true } },
          variant: { select: { id: true, name: true, price: true, stockQty: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return combos.map((c) => {
    const originalPrice = computeComboOriginalPrice(c.items);
    return {
      id: c.id,
      name: c.name,
      description: c.description,
      sellPrice: c.sellPrice,
      imageUrl: c.imageUrl,
      originalPrice,
      savings: Math.max(0, originalPrice - c.sellPrice),
      availableStock: computeComboAvailableStock(c.items),
      items: c.items.map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        variantId: i.variantId,
        variantName: i.variant?.name ?? null,
        quantity: i.quantity,
      })),
    };
  });
}
