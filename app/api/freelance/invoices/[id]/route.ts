import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;

    const invoice = await prisma.freelanceInvoice.findFirst({
      where: { id, shopId: shop.id },
      include: {
        client: { select: { id: true, name: true, phone: true, address: true } },
        project: { select: { id: true, projectNumber: true, title: true } },
      },
    });

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const invoice = await prisma.freelanceInvoice.findFirst({ where: { id, shopId: shop.id } });
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (action === "mark_paid") {
      const updated = await prisma.freelanceInvoice.update({
        where: { id },
        data: { status: "paid", paidAt: new Date(), paymentNote: body.note || invoice.paymentNote },
      });
      return NextResponse.json(updated);
    }

    if (action === "mark_sent") {
      const updated = await prisma.freelanceInvoice.update({
        where: { id },
        data: { status: "sent" },
      });
      return NextResponse.json(updated);
    }

    if (action === "cancel") {
      const updated = await prisma.freelanceInvoice.update({
        where: { id },
        data: { status: "cancelled" },
      });
      return NextResponse.json(updated);
    }

    // General update
    const updated = await prisma.freelanceInvoice.update({
      where: { id },
      data: {
        status: body.status ?? invoice.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : invoice.dueDate,
        paymentNote: body.paymentNote ?? invoice.paymentNote,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
