import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { computeNextDueDate } from "@/lib/expenses/server";

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const recurring = await prisma.transaction.findMany({
    where: {
      type: "expense",
      isRecurring: true,
      nextDueDate: { lte: now },
    },
  });

  let created = 0;

  for (const exp of recurring) {
    const interval = exp.recurringInterval ?? "monthly";

    await prisma.transaction.create({
      data: {
        shopId: exp.shopId,
        userId: exp.userId,
        type: "expense",
        title: exp.title,
        amount: exp.amount,
        category: exp.category,
        date: now,
        note: exp.note,
        paymentMethod: exp.paymentMethod,
        supplierId: exp.supplierId,
        taxRate: exp.taxRate,
        taxAmount: exp.taxAmount,
        isRecurring: false,
        recurringParentId: exp.id,
      },
    });

    await prisma.transaction.update({
      where: { id: exp.id },
      data: { nextDueDate: computeNextDueDate(now, interval) },
    });

    created++;
  }

  return NextResponse.json({ success: true, created });
}
