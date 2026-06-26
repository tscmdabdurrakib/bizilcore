import { prisma } from "@/lib/prisma";
import { computeComboAvailableStock } from "@/lib/store/combos";

export interface ValidatedStoreItem {
  itemType: "product" | "combo";
  productId?: string;
  comboId?: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

const COMBO_ITEM_INCLUDE = {
  product: { select: { id: true, name: true, sellPrice: true, stockQty: true } },
  variant: { select: { id: true, name: true, price: true, stockQty: true } },
} as const;

export async function validateStoreOrderItems(
  shopId: string,
  rawItems: { productId?: string; comboId?: string; variantId?: string; quantity: number }[],
): Promise<{ items: ValidatedStoreItem[]; subtotal: number }> {
  let subtotal = 0;
  const items: ValidatedStoreItem[] = [];

  for (const item of rawItems) {
    if (item.comboId) {
      const combo = await prisma.comboProduct.findFirst({
        where: { id: item.comboId, shopId, isActive: true, storeVisible: true },
        include: { items: { include: COMBO_ITEM_INCLUDE } },
      });
      if (!combo) throw new Error("কম্বো প্যাক পাওয়া যায়নি।");
      const stock = computeComboAvailableStock(combo.items);
      if (stock <= 0) throw new Error(`"${combo.name}" স্টক শেষ।`);
      if (item.quantity > stock) throw new Error(`"${combo.name}" এ মাত্র ${stock}টি আছে।`);
      const lineSubtotal = combo.sellPrice * item.quantity;
      subtotal += lineSubtotal;
      items.push({
        itemType: "combo",
        comboId: combo.id,
        productName: combo.name,
        quantity: item.quantity,
        unitPrice: combo.sellPrice,
        subtotal: lineSubtotal,
      });
      continue;
    }

    if (!item.productId) throw new Error("অবৈধ কার্ট আইটেম।");

    const product = await prisma.product.findFirst({
      where: { id: item.productId, shopId, storeVisible: true },
      select: {
        id: true, name: true, sellPrice: true, stockQty: true, hasVariants: true,
        variants: { select: { id: true, name: true, price: true, stockQty: true } },
      },
    });
    if (!product) throw new Error("পণ্য পাওয়া যায়নি।");

    let unitPrice = product.sellPrice;
    let variantName: string | undefined;
    let availableStock = product.stockQty;

    if (product.hasVariants && product.variants.length > 0) {
      if (!item.variantId) throw new Error(`"${product.name}" এর জন্য ভ্যারিয়েন্ট বেছে নেওয়া প্রয়োজন।`);
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) throw new Error(`"${product.name}" এর নির্বাচিত ভ্যারিয়েন্ট পাওয়া যায়নি।`);
      if (variant.price != null) unitPrice = variant.price;
      variantName = variant.name;
      availableStock = variant.stockQty;
    } else if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (variant) {
        if (variant.price != null) unitPrice = variant.price;
        variantName = variant.name;
        availableStock = variant.stockQty;
      }
    }

    const now = new Date();
    const flashPrice = await prisma.flashSaleProduct.findFirst({
      where: {
        productId: product.id,
        flashSale: { shopId, isActive: true, startAt: { lte: now }, endAt: { gte: now } },
      },
      select: { salePrice: true },
    });
    if (flashPrice) unitPrice = flashPrice.salePrice;

    if (availableStock <= 0) {
      throw new Error(`"${product.name}"${variantName ? ` (${variantName})` : ""} স্টক শেষ।`);
    }
    if (item.quantity > availableStock) {
      throw new Error(`"${product.name}"${variantName ? ` (${variantName})` : ""} এ মাত্র ${availableStock}টি আছে।`);
    }

    const lineSubtotal = unitPrice * item.quantity;
    subtotal += lineSubtotal;
    items.push({
      itemType: "product",
      productId: product.id,
      variantId: item.variantId,
      productName: product.name,
      variantName,
      quantity: item.quantity,
      unitPrice,
      subtotal: lineSubtotal,
    });
  }

  return { items, subtotal };
}

export async function applyGiftCard(shopId: string, code: string | undefined, orderTotal: number) {
  if (!code?.trim()) return { giftCardAmount: 0, giftCardCode: undefined as string | undefined };
  const card = await prisma.giftCard.findFirst({
    where: { shopId, code: code.trim().toUpperCase(), isActive: true },
  });
  if (!card || (card.expiresAt && card.expiresAt < new Date()) || card.balance <= 0) {
    throw new Error("গিফট কার্ড অবৈধ বা ব্যালেন্স নেই।");
  }
  const giftCardAmount = Math.min(card.balance, orderTotal);
  return { giftCardAmount, giftCardCode: card.code, giftCardId: card.id };
}

export async function applyLoyaltyDiscount(
  shopId: string,
  storeCustomerId: string | undefined,
  loyaltyPointsUsed: number,
  redeemRate: number,
  maxSubtotal: number,
) {
  if (!storeCustomerId || loyaltyPointsUsed <= 0) return { loyaltyDiscount: 0, pointsUsed: 0 };
  const customer = await prisma.storeCustomer.findFirst({
    where: { id: storeCustomerId, shopId },
    select: { loyaltyPoints: true },
  });
  if (!customer) return { loyaltyDiscount: 0, pointsUsed: 0 };
  const maxPoints = Math.min(customer.loyaltyPoints, Math.floor(maxSubtotal / redeemRate));
  const pointsUsed = Math.min(loyaltyPointsUsed, maxPoints);
  const loyaltyDiscount = pointsUsed * redeemRate;
  return { loyaltyDiscount, pointsUsed };
}
