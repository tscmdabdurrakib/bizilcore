import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyBackInStock } from "@/lib/store/back-in-stock";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restocked = await prisma.product.findMany({
    where: { stockQty: { gt: 0 }, storeVisible: true },
    select: { id: true, shopId: true },
    take: 200,
  });

  let totalNotified = 0;
  for (const p of restocked) {
    const pending = await prisma.storeStockAlert.count({
      where: { productId: p.id, shopId: p.shopId, notified: false },
    });
    if (pending > 0) {
      const r = await notifyBackInStock(p.id, p.shopId);
      totalNotified += r.notified;
    }
  }

  return NextResponse.json({ processed: restocked.length, notified: totalNotified });
}
