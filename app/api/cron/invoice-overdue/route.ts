import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { autoMarkOverdueInvoices } from "@/lib/invoices/server";

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shops = await prisma.shop.findMany({ select: { id: true } });
  let updated = 0;

  for (const shop of shops) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result = await prisma.invoice.updateMany({
      where: {
        shopId: shop.id,
        status: "sent",
        dueDate: { lt: today },
      },
      data: { status: "overdue" },
    });
    updated += result.count;
    await autoMarkOverdueInvoices(shop.id);
  }

  return NextResponse.json({ success: true, updated });
}
