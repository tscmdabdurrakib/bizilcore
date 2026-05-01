import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const event = await prisma.hallEvent.findFirst({ where: { id, shopId: shop.id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { amount, method, note } = body;

  if (!amount || !method) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const payment = await prisma.eventPayment.create({
    data: {
      eventId: id,
      amount: Number(amount),
      method,
      note: note ?? null,
    },
  });

  const newAdvance = event.advancePaid + Number(amount);
  const newDue = Math.max(0, event.totalAmount - newAdvance);
  const newStatus = newDue === 0 ? "completed" : event.status === "confirmed" ? "advance_paid" : event.status;

  await prisma.hallEvent.update({
    where: { id },
    data: { advancePaid: newAdvance, dueAmount: newDue, status: newStatus },
  });

  return NextResponse.json(payment);
}
