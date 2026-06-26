import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const returns = await prisma.storeReturnRequest.findMany({
    where: { shopId: shopCtx.activeShop.id },
    include: {
      items: true,
      storeOrder: { select: { orderNumber: true, customerName: true, customerPhone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(returns);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { id, status, refundAmount, merchantNote, restock } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  const existing = await prisma.storeReturnRequest.findFirst({
    where: { id, shopId: shopCtx.activeShop.id },
    include: { items: true, storeOrder: { include: { items: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Return not found" }, { status: 404 });

  const updated = await prisma.$transaction(async (tx) => {
    const ret = await tx.storeReturnRequest.update({
      where: { id },
      data: {
        status,
        refundAmount: refundAmount != null ? parseFloat(refundAmount) : undefined,
        merchantNote: merchantNote || undefined,
      },
      include: { items: true, storeOrder: { select: { orderNumber: true } } },
    });

    if (status === "approved" && restock) {
      for (const item of existing.items) {
        const orderItem = existing.storeOrder.items.find((oi) => oi.productName === item.productName);
        if (orderItem?.productId) {
          await tx.product.update({
            where: { id: orderItem.productId },
            data: { stockQty: { increment: item.quantity } },
          });
        }
      }
    }
    return ret;
  });

  return NextResponse.json(updated);
}
