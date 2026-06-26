import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { getShopForUser } from "@/lib/purchase-orders/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { ids, action } = body as { ids: string[]; action: string };

  if (!ids?.length) return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

  const pos = await prisma.purchaseOrder.findMany({
    where: { id: { in: ids }, shopId: shop.id },
    include: { supplier: true },
  });

  let updated = 0;
  const errors: string[] = [];

  if (action === "send") {
    for (const po of pos) {
      if (po.status !== "draft") continue;
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: "sent", sentAt: new Date() },
      });
      updated++;
    }
    await logActivity({
      userId: session.user.id,
      shopId: shop.id,
      action: "po_bulk_sent",
      detail: `${updated}টি PO পাঠানো`,
    });
  } else if (action === "cancel") {
    for (const po of pos) {
      if (!["draft", "sent"].includes(po.status)) continue;
      await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: "cancelled" },
      });
      updated++;
    }
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ updated, errors });
}
