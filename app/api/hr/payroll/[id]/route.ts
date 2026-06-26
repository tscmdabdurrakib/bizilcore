import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShopForOwner } from "@/lib/hr/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { action, itemId, paidAmount, bonus, deductions, notes, addToExpenses } = body;

  const run = await prisma.payrollRun.findFirst({
    where: { id, shopId: shop.id },
    include: { items: true },
  });
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "finalize") {
    if (run.status === "finalized") {
      return NextResponse.json({ error: "Already finalized" }, { status: 400 });
    }
    const updated = await prisma.payrollRun.update({
      where: { id },
      data: { status: "finalized" },
      include: {
        items: {
          include: { staff: { include: { user: { select: { name: true } } } } },
        },
      },
    });
    return NextResponse.json({ payroll: updated });
  }

  if (action === "pay" && itemId) {
    const item = run.items.find((i) => i.id === itemId);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const pay = paidAmount != null ? Number(paidAmount) : item.netPay - item.paidAmount;
    const newPaid = item.paidAmount + pay;
    const status = newPaid >= item.netPay ? "paid" : newPaid > 0 ? "partial" : "pending";

    const updatedItem = await prisma.payrollItem.update({
      where: { id: itemId },
      data: {
        paidAmount: newPaid,
        status,
        bonus: bonus != null ? Number(bonus) : item.bonus,
        deductions: deductions != null ? Number(deductions) : item.deductions,
        notes: notes ?? item.notes,
        netPay:
          item.baseSalary +
          (bonus != null ? Number(bonus) : item.bonus) -
          (deductions != null ? Number(deductions) : item.deductions) -
          item.advance,
      },
      include: { staff: { include: { user: { select: { name: true } } } } },
    });

    if (addToExpenses && pay > 0) {
      await prisma.transaction.create({
        data: {
          shopId: shop.id,
          userId: session.user.id,
          type: "expense",
          title: `বেতন — ${updatedItem.staff.user.name}`,
          amount: pay,
          category: "salary",
          date: new Date(),
          note: `${run.month}/${run.year} payroll`,
        },
      });
    }

    // Settle advances proportionally
    if (status === "paid" && item.advance > 0) {
      const advs = await prisma.staffAdvance.findMany({
        where: { shopId: shop.id, staffId: item.staffId },
      });
      let remaining = item.advance;
      for (const adv of advs) {
        const unsettled = adv.amount - adv.settled;
        if (unsettled <= 0) continue;
        const settle = Math.min(unsettled, remaining);
        await prisma.staffAdvance.update({
          where: { id: adv.id },
          data: { settled: adv.settled + settle },
        });
        remaining -= settle;
        if (remaining <= 0) break;
      }
    }

    return NextResponse.json({ item: updatedItem });
  }

  if (action === "updateItem" && itemId) {
    const item = run.items.find((i) => i.id === itemId);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const newBonus = bonus != null ? Number(bonus) : item.bonus;
    const newDeductions = deductions != null ? Number(deductions) : item.deductions;
    const netPay = item.baseSalary + newBonus - newDeductions - item.advance;

    const updatedItem = await prisma.payrollItem.update({
      where: { id: itemId },
      data: {
        bonus: newBonus,
        deductions: newDeductions,
        netPay: Math.max(0, netPay),
        notes: notes ?? item.notes,
      },
      include: { staff: { include: { user: { select: { name: true } } } } },
    });

    return NextResponse.json({ item: updatedItem });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
