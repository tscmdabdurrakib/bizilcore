import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  let notificationsCreated = 0;

  const overduePOs = await prisma.purchaseOrder.findMany({
    where: {
      status: { in: ["sent", "partially_received"] },
      expectedDate: { lt: today },
    },
    include: { shop: { select: { userId: true, name: true } }, supplier: { select: { name: true } } },
  });

  for (const po of overduePOs) {
    if (!po.shop.userId) continue;
    const daysLate = Math.floor((today.getTime() - new Date(po.expectedDate!).getTime()) / 86400000);
    const title =
      daysLate >= 3
        ? `⚠️ PO ${po.poNumber} — ${daysLate} দিন বিলম্ব`
        : `📦 PO ${po.poNumber} — ডেলিভারি বিলম্ব`;

    const existing = await prisma.notification.findFirst({
      where: {
        userId: po.shop.userId,
        title,
        createdAt: { gte: today },
      },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId: po.shop.userId,
        title,
        body: `${po.supplier?.name ?? "সরবরাহকারী"} — ৳${po.total.toLocaleString("bn-BD")}`,
        type: "warning",
        link: `/purchase-orders?overdue=1`,
      },
    });
    notificationsCreated++;
  }

  const dueToday = await prisma.purchaseOrder.findMany({
    where: {
      status: { in: ["sent", "partially_received"] },
      expectedDate: { gte: today, lt: tomorrow },
    },
    include: { shop: { select: { userId: true } }, supplier: { select: { name: true } } },
  });

  for (const po of dueToday) {
    if (!po.shop.userId) continue;
    const title = `📦 PO ${po.poNumber} — আজ পাওয়ার কথা`;
    const existing = await prisma.notification.findFirst({
      where: { userId: po.shop.userId, title, createdAt: { gte: today } },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId: po.shop.userId,
        title,
        body: `${po.supplier?.name ?? "সরবরাহকারী"} থেকে মাল আসার কথা`,
        type: "info",
        link: `/purchase-orders/${po.id}`,
      },
    });
    notificationsCreated++;
  }

  return NextResponse.json({ success: true, notificationsCreated });
}
