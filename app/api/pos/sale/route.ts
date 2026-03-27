import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

interface SaleItem {
  productId: string;
  variantId?: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
}

export async function POST(req: NextRequest) {
  const { shop, session } = await requireShop();

  if (shop.businessType !== "retail") {
    return NextResponse.json({ error: "এই API শুধুমাত্র রিটেল শপের জন্য।" }, { status: 403 });
  }

  const body = await req.json();

  const { items, customerId, paymentMethod, discountAmount, note } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "কার্টে কোনো পণ্য নেই।" }, { status: 400 });
  }

  const typedItems = items as SaleItem[];

  for (const item of typedItems) {
    if (!item.productId || typeof item.productId !== "string") {
      return NextResponse.json({ error: "পণ্য আইডি অবৈধ।" }, { status: 400 });
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return NextResponse.json({ error: `পরিমাণ অবশ্যই ধনাত্মক পূর্ণসংখ্যা হতে হবে।` }, { status: 400 });
    }
    if (typeof item.unitPrice !== "number" || item.unitPrice < 0) {
      return NextResponse.json({ error: "মূল্য শূন্য বা ধনাত্মক হতে হবে।" }, { status: 400 });
    }
  }

  if (customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, shopId: true } });
    if (!customer || customer.shopId !== shop.id) {
      return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি।" }, { status: 400 });
    }
  }

  const productIds = typedItems.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId: shop.id },
    include: { variants: true },
  });

  if (products.length !== [...new Set(productIds)].length) {
    return NextResponse.json({ error: "এক বা একাধিক পণ্য পাওয়া যায়নি বা অন্য শপের।" }, { status: 400 });
  }

  for (const item of typedItems) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;

    if (item.variantId) {
      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) {
        return NextResponse.json({ error: `ভেরিয়েন্ট পাওয়া যায়নি।` }, { status: 400 });
      }
      if (variant.stockQty < item.quantity) {
        return NextResponse.json({ error: `"${product.name}" (${variant.name})-এর পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${variant.stockQty}` }, { status: 400 });
      }
    } else {
      if (product.stockQty < item.quantity) {
        return NextResponse.json({ error: `"${product.name}"-এর পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${product.stockQty}` }, { status: 400 });
      }
    }
  }

  const subTotal = typedItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vatTotal = typedItems.reduce((s, i) => s + i.quantity * i.unitPrice * (i.vatRate ?? 0), 0);
  const discount = Number(discountAmount ?? 0);
  const grandTotal = subTotal + vatTotal - discount;

  const result = await prisma.$transaction(async (tx) => {
    for (const item of typedItems) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQty: { decrement: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }
    }

    const transaction = await tx.transaction.create({
      data: {
        userId: session.user.id,
        type: "income",
        amount: grandTotal,
        category: "pos_sale",
        note: note ?? null,
        taxAmount: vatTotal,
        taxRate: vatTotal > 0 ? vatTotal / subTotal : 0,
        date: new Date(),
      },
    });

    return transaction;
  });

  return NextResponse.json({
    transactionId: result.id,
    grandTotal,
    subTotal,
    vatTotal,
    discount,
  }, { status: 201 });
}
