import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { captureError } from "@/lib/observability";

interface ReturnItem {
  productId: string;
  quantity: number;
}

/**
 * Retail POS return / refund.
 * Restores stock, records a StockMovement + OrderReturn audit trail, and books
 * a refund expense transaction. All atomic.
 */
export async function POST(req: NextRequest) {
  const { shop, session } = await requireShop();

  if (shop.businessType !== "retail") {
    return NextResponse.json({ error: "এই API শুধুমাত্র রিটেল শপের জন্য।" }, { status: 403 });
  }

  const body = await req.json();
  const { orderId, items, reason, refundAmount, restock = true } = body as {
    orderId: string;
    items: ReturnItem[];
    reason?: string;
    refundAmount?: number;
    restock?: boolean;
  };

  if (!orderId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "অর্ডার ও ফেরত পণ্য নির্বাচন করুন।" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি।" }, { status: 404 });
  }

  // Validate returned quantities against what was actually sold.
  for (const ret of items) {
    if (!Number.isInteger(ret.quantity) || ret.quantity <= 0) {
      return NextResponse.json({ error: "ফেরত পরিমাণ অবৈধ।" }, { status: 400 });
    }
    const sold = order.items.find(i => i.productId === ret.productId);
    if (!sold) {
      return NextResponse.json({ error: "এই পণ্যটি মূল অর্ডারে নেই।" }, { status: 400 });
    }
    if (ret.quantity > sold.quantity) {
      return NextResponse.json({ error: "ফেরত পরিমাণ বিক্রির চেয়ে বেশি হতে পারে না।" }, { status: 400 });
    }
  }

  const computedRefund =
    typeof refundAmount === "number" && refundAmount >= 0
      ? refundAmount
      : items.reduce((sum, ret) => {
          const sold = order.items.find(i => i.productId === ret.productId)!;
          return sum + sold.unitPrice * ret.quantity;
        }, 0);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const orderReturn = await tx.orderReturn.create({
        data: {
          orderId,
          userId: session.user.id,
          reason: reason ?? null,
          restock,
          items: {
            create: items.map(r => ({ productId: r.productId, quantity: r.quantity })),
          },
        },
      });

      if (restock) {
        for (const r of items) {
          await tx.product.updateMany({
            where: { id: r.productId, shopId: shop.id },
            data: { stockQty: { increment: r.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: r.productId,
              userId: session.user.id,
              type: "in",
              quantity: r.quantity,
              reason: `pos_return:${orderId}`,
              orderId,
            },
          });
        }
      }

      // Refund recorded as an expense so reports net it against sales income.
      if (computedRefund > 0) {
        await tx.transaction.create({
          data: {
            userId: session.user.id,
            type: "expense",
            amount: computedRefund,
            category: "pos_refund",
            note: reason ? `ফেরত: ${reason}` : `অর্ডার ${orderId} ফেরত`,
            date: new Date(),
          },
        });
      }

      return { returnId: orderReturn.id, refundAmount: computedRefund };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    captureError(err, { route: "pos/return", shopId: shop.id });
    return NextResponse.json({ error: "ফেরত প্রক্রিয়া ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
