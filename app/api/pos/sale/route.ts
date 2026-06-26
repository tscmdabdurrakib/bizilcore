import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { captureError } from "@/lib/observability";
import { trackForUser } from "@/lib/activity/trackFromSession";
import { computeRetailSaleTotals } from "@/lib/pos/totals";
import { createDefaultCoa } from "@/lib/accounting/seed-coa";
import { createSaleJournalFromOrder } from "@/lib/accounting/journal-from-order";
import { revalidateProducts, revalidateCustomers } from "@/lib/cache/revalidate";

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
  const { items, customerId, paymentMethod, discountAmount, note, idempotencyKey, branchId: rawBranchId } = body;

  // ── Idempotency: return the cached result if this sale was already processed ──
  if (idempotencyKey && typeof idempotencyKey === "string") {
    const existing = await prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
    if (existing?.response) {
      return NextResponse.json(existing.response, { status: 201 });
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "কার্টে কোনো পণ্য নেই।" }, { status: 400 });
  }

  const typedItems = items as SaleItem[];

  let branchId: string | null = null;
  if (rawBranchId && typeof rawBranchId === "string") {
    const branch = await prisma.shopBranch.findFirst({
      where: { id: rawBranchId, shopId: shop.id, isActive: true },
    });
    if (!branch) return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
    branchId = branch.id;
  }

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

  const isDue = paymentMethod === "due";
  if (customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, shopId: true } });
    if (!customer || customer.shopId !== shop.id) {
      return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি।" }, { status: 400 });
    }
  } else if (isDue) {
    return NextResponse.json({ error: "বাকি বিক্রয়ের জন্য কাস্টমার নির্বাচন করুন।" }, { status: 400 });
  }

  const productIds = typedItems.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId: shop.id },
    include: { variants: true },
  });

  if (products.length !== [...new Set(productIds)].length) {
    return NextResponse.json({ error: "এক বা একাধিক পণ্য পাওয়া যায়নি বা অন্য শপের।" }, { status: 400 });
  }

  // Pre-validate stock (the transaction re-checks atomically with a guard).
  if (branchId) {
    const stocks = await prisma.branchStock.findMany({
      where: { branchId, productId: { in: productIds } },
    });
    const stockMap = new Map(stocks.map(s => [s.productId, s.quantity]));
    for (const item of typedItems) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;
      const avail = stockMap.get(item.productId) ?? 0;
      if (avail < item.quantity) {
        return NextResponse.json({
          error: `"${product.name}"-এর branch-এ পর্যাপ্ত স্টক নেই। বর্তমান: ${avail}`,
        }, { status: 400 });
      }
    }
  } else {
  for (const item of typedItems) {
    const product = products.find(p => p.id === item.productId);
    if (!product) continue;
    if (item.variantId) {
      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) return NextResponse.json({ error: `ভেরিয়েন্ট পাওয়া যায়নি।` }, { status: 400 });
      if (variant.stockQty < item.quantity) {
        return NextResponse.json({ error: `"${product.name}" (${variant.name})-এর পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${variant.stockQty}` }, { status: 400 });
      }
    } else if (product.stockQty < item.quantity) {
      return NextResponse.json({ error: `"${product.name}"-এর পর্যাপ্ত স্টক নেই। বর্তমান স্টক: ${product.stockQty}` }, { status: 400 });
    }
  }
  }

  const { subTotal, vatTotal, discount, grandTotal } = computeRetailSaleTotals(
    typedItems,
    Number(discountAmount ?? 0),
  );

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (branchId) {
        const { deductOrderStock } = await import("@/lib/shops/order-stock");
        await deductOrderStock(
          tx,
          branchId,
          typedItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
          [],
          {}
        );
      } else {
      // Atomic, guarded stock decrement — prevents negative stock under races.
      for (const item of typedItems) {
        if (item.variantId) {
          const dec = await tx.productVariant.updateMany({
            where: { id: item.variantId, stockQty: { gte: item.quantity } },
            data: { stockQty: { decrement: item.quantity } },
          });
          if (dec.count === 0) throw new SaleError(`"${item.productName}"-এর স্টক শেষ হয়ে গেছে।`);
        } else {
          const dec = await tx.product.updateMany({
            where: { id: item.productId, shopId: shop.id, stockQty: { gte: item.quantity } },
            data: { stockQty: { decrement: item.quantity } },
          });
          if (dec.count === 0) throw new SaleError(`"${item.productName}"-এর স্টক শেষ হয়ে গেছে।`);
        }
      }
      }

      for (const item of typedItems) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            userId: session.user.id,
            type: "out",
            quantity: item.quantity,
            reason: `pos_sale${paymentMethod ? `:${paymentMethod}` : ""}`,
            branchId,
          },
        });
      }

      // Persist the sale as an Order so it shows in history/reports.
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          customerId: customerId ?? null,
          branchId,
          source: "pos",
          status: isDue ? "pending" : "delivered",
          totalAmount: grandTotal,
          paidAmount: isDue ? 0 : grandTotal,
          dueAmount: isDue ? grandTotal : 0,
          paymentMethod: paymentMethod ?? "cash",
          vatAmount: vatTotal,
          note: note ?? null,
          items: {
            create: typedItems.map(i => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.quantity * i.unitPrice,
            })),
          },
        },
        include: {
          items: { include: { product: { select: { buyPrice: true } } } },
        },
      });

      if (!isDue && grandTotal > 0) {
        await createSaleJournalFromOrder(
          tx,
          shop.id,
          session.user.id,
          order,
          {
            vatEnabled: shop.vatEnabled ?? false,
            vatRate: shop.vatRate ?? 15,
            vatMethod: shop.vatMethod ?? "inclusive",
          },
        );
      }

      // Track customer due ledger for "বাকি" sales.
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            lastOrderAt: new Date(),
            ...(isDue ? { dueAmount: { increment: grandTotal } } : {}),
          },
        });
      }

      const response = {
        orderId: order.id,
        transactionId: order.id,
        grandTotal,
        subTotal,
        vatTotal,
        discount,
        due: isDue ? grandTotal : 0,
      };

      // Record the idempotency key inside the same transaction.
      if (idempotencyKey && typeof idempotencyKey === "string") {
        await tx.idempotencyKey.create({
          data: {
            key: idempotencyKey,
            scope: "pos_sale",
            userId: session.user.id,
            response,
          },
        });
      }

      return response;
    });

    trackForUser(session.user.id, shop.id, {
      actionType: "order_created",
      actionLabel: `POS বিক্রয়: #${result.orderId?.slice(-6).toUpperCase() ?? ""}`,
      metadata: {
        order_id: result.orderId,
        order_total: result.grandTotal,
        source: "pos",
      },
    }).catch(() => {});

    revalidateProducts(shop.id);
    if (customerId) revalidateCustomers(shop.id);

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    // Concurrent replay of the same key lands here — return the stored result.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.idempotencyKey.findUnique({ where: { key: idempotencyKey } });
      if (existing?.response) return NextResponse.json(existing.response, { status: 201 });
    }
    if (err instanceof SaleError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    captureError(err, { route: "pos/sale", shopId: shop.id });
    return NextResponse.json({ error: "বিক্রয় সম্পন্ন করা যায়নি।" }, { status: 500 });
  }
}

class SaleError extends Error {}
