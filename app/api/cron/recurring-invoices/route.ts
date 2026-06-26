import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { calcInvoiceTotals } from "@/lib/invoices/utils";

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recurring = await prisma.invoice.findMany({
    where: { isRecurring: true, status: { in: ["paid", "sent"] } },
    include: { items: true },
  });

  let created = 0;

  for (const inv of recurring) {
    const interval = inv.recurringInterval ?? "monthly";
    const lastCreated = inv.createdAt;
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - lastCreated.getTime()) / (1000 * 60 * 60 * 24));
    const shouldCreate =
      (interval === "monthly" && daysSince >= 28) ||
      (interval === "weekly" && daysSince >= 7);

    if (!shouldCreate) continue;

    const count = await prisma.invoice.count({ where: { shopId: inv.shopId } });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;
    const items = inv.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      productId: i.productId,
    }));
    const { subtotal, discount, taxAmount, total } = calcInvoiceTotals(items, inv.discount, inv.taxRate);

    await prisma.invoice.create({
      data: {
        shopId: inv.shopId,
        userId: inv.userId,
        customerId: inv.customerId,
        invoiceNumber,
        status: "draft",
        subtotal,
        discount,
        taxRate: inv.taxRate,
        taxAmount,
        total,
        notes: inv.notes,
        dueDate: inv.dueDate
          ? new Date(now.getTime() + (inv.dueDate.getTime() - lastCreated.getTime()))
          : null,
        isRecurring: false,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
            productId: item.productId,
          })),
        },
      },
    });
    created++;
  }

  return NextResponse.json({ success: true, created });
}
