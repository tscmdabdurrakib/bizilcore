import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const event = await prisma.cateringEvent.findFirst({
    where: { id, shopId: shop.id },
    include: {
      template: { include: { items: true } },
      customItems: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!event) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();
  const { action } = body;

  const event = await prisma.cateringEvent.findFirst({ where: { id, shopId: shop.id } });
  if (!event) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });

  if (action === "add_payment") {
    const { amount, method, note } = body;
    if (!amount || !method) return NextResponse.json({ error: "পরিমাণ ও মাধ্যম দিন" }, { status: 400 });

    await prisma.cateringPayment.create({
      data: { eventId: id, amount: Number(amount), method, note: note || null },
    });

    const newAdvance = event.advancePaid + Number(amount);
    const newDue     = Math.max(0, event.totalAmount - newAdvance);
    const updated = await prisma.cateringEvent.update({
      where: { id },
      data: {
        advancePaid: newAdvance,
        dueAmount:   newDue,
        status:      newDue === 0 ? "completed" : event.status,
      },
      include: { payments: { orderBy: { paidAt: "desc" } }, customItems: true, template: { include: { items: true } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "status_update") {
    const { status } = body;
    const updated = await prisma.cateringEvent.update({
      where: { id },
      data: { status },
      include: { payments: { orderBy: { paidAt: "desc" } }, customItems: true, template: { include: { items: true } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "update_checklist") {
    const { checklist } = body;
    const updated = await prisma.cateringEvent.update({
      where: { id },
      data: { checklist },
      include: { payments: { orderBy: { paidAt: "desc" } }, customItems: true, template: { include: { items: true } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "save_shopping_list") {
    const { shoppingList } = body;
    const updated = await prisma.cateringEvent.update({
      where: { id },
      data: { shoppingList },
      include: { payments: { orderBy: { paidAt: "desc" } }, customItems: true, template: { include: { items: true } } },
    });
    return NextResponse.json(updated);
  }

  if (action === "complete_event") {
    const { actualGuestCount } = body;
    const guests = Number(actualGuestCount) || event.guestCount;
    const newTotal  = guests * event.perHeadCost;
    const newCost   = event.totalCost > 0 ? (event.totalCost / event.guestCount) * guests : 0;
    const newProfit = newTotal - newCost;
    const newDue    = Math.max(0, newTotal - event.advancePaid);

    const updated = await prisma.cateringEvent.update({
      where: { id },
      data: {
        guestCount:  guests,
        totalAmount: newTotal,
        totalCost:   newCost,
        profit:      newProfit,
        dueAmount:   newDue,
        status:      "completed",
      },
      include: { payments: { orderBy: { paidAt: "desc" } }, customItems: true, template: { include: { items: true } } },
    });
    return NextResponse.json(updated);
  }

  const { staffNeeded, equipmentNote, notes, status } = body;
  const updateData: Record<string, unknown> = {};
  if (staffNeeded   !== undefined) updateData.staffNeeded   = staffNeeded ? Number(staffNeeded) : null;
  if (equipmentNote !== undefined) updateData.equipmentNote = equipmentNote;
  if (notes         !== undefined) updateData.notes         = notes;
  if (status        !== undefined) updateData.status        = status;

  const updated = await prisma.cateringEvent.update({
    where: { id },
    data: updateData,
    include: { payments: { orderBy: { paidAt: "desc" } }, customItems: true, template: { include: { items: true } } },
  });
  return NextResponse.json(updated);
}
