import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const order = await prisma.printOrder.findFirst({
    where: { id, shopId: shop.id },
    include: {
      items: { include: { service: { select: { name: true, unit: true } } } },
      payments: { orderBy: { paidAt: "desc" } },
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { shop, user } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  const order = await prisma.printOrder.findFirst({ where: { id, shopId: shop.id } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const STATUS_FLOW = ["received", "design_approval", "printing", "finishing", "ready", "delivered"];

  // Handle payment
  if (body.action === "payment") {
    const amount = Number(body.amount ?? 0);
    if (amount <= 0) return NextResponse.json({ error: "Amount invalid" }, { status: 400 });

    const [payment] = await prisma.$transaction([
      prisma.printPayment.create({ data: { orderId: id, amount, method: body.method ?? "cash" } }),
      prisma.printOrder.update({
        where: { id },
        data: {
          advancePaid: { increment: amount },
          dueAmount: { decrement: amount },
        },
      }),
    ]);
    return NextResponse.json(payment);
  }

  // Handle design approval
  if (body.action === "approve_design") {
    const updated = await prisma.printOrder.update({
      where: { id },
      data: { designApproved: true, status: "printing" },
    });

    if (shop.printAutoSms) {
      console.log(`SMS to ${order.clientPhone}: আপনার design approve হয়েছে। Printing শুরু হচ্ছে। অর্ডার নং: ${order.orderNumber} - ${shop.name}`);
    }
    return NextResponse.json(updated);
  }

  // Handle status advance
  if (body.action === "advance_status") {
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= STATUS_FLOW.length - 1) {
      return NextResponse.json({ error: "Cannot advance" }, { status: 400 });
    }

    // Block advancing past design_approval if not approved
    if (order.status === "design_approval" && !order.designApproved && (shop.printRequireApproval ?? true)) {
      return NextResponse.json({ error: "Design অনুমোদন আগে করতে হবে" }, { status: 400 });
    }

    const nextStatus = STATUS_FLOW[currentIdx + 1];
    const updated = await prisma.printOrder.update({
      where: { id },
      data: { status: nextStatus },
    });

    // SMS on ready
    if (nextStatus === "ready" && shop.printAutoSms) {
      console.log(`SMS to ${order.clientPhone}: আপনার প্রিন্টিং কাজ সম্পন্ন। সংগ্রহ করুন। অর্ডার নং: ${order.orderNumber}। বাকি: ৳${order.dueAmount} - ${shop.name}`);
    }

    return NextResponse.json(updated);
  }

  // Generic update
  const updated = await prisma.printOrder.update({
    where: { id },
    data: {
      status: body.status ?? order.status,
      designApproved: body.designApproved !== undefined ? body.designApproved : order.designApproved,
      notes: body.notes !== undefined ? body.notes : order.notes,
      designFiles: body.designFiles !== undefined ? body.designFiles : order.designFiles,
    },
    include: {
      items: { include: { service: { select: { name: true } } } },
      payments: true,
    },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, shopId: shop.id, action: "print_order_updated", detail: `Order ${order.orderNumber} → ${updated.status}` },
  }).catch(() => {});

  return NextResponse.json(updated);
}
