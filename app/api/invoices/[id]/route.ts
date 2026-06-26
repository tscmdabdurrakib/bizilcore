import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAutoTask } from "@/lib/autoTasks";
import { calcInvoiceTotals } from "@/lib/invoices/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, shop: { userId: session.user.id } },
    include: {
      customer: true,
      items: { include: { product: { select: { id: true, name: true } } } },
      payments: { orderBy: { paidAt: "desc" } },
      shop: {
        select: {
          name: true,
          phone: true,
          address: true,
          logoUrl: true,
          invoiceNote: true,
          bankAccount: true,
          bankName: true,
        },
      },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.invoice.findFirst({
    where: { id, shop: { userId: session.user.id } },
    include: { items: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.status === "cancelled" && existing.status === "paid") {
    return NextResponse.json({ error: "পরিশোধিত ইনভয়েস বাতিল করা যাবে না" }, { status: 400 });
  }

  const isFullEdit =
    existing.status === "draft" &&
    (body.items || body.customerId !== undefined || body.discount !== undefined || body.taxRate !== undefined);

  const isLimitedEdit =
    ["sent", "overdue", "partial"].includes(existing.status) &&
    !body.items &&
    (body.notes !== undefined || body.dueDate !== undefined);

  if (isFullEdit && body.items) {
    const typedItems = body.items as {
      description: string;
      quantity: number;
      unitPrice: number;
      productId?: string | null;
    }[];
    const { subtotal, discount, taxAmount, total } = calcInvoiceTotals(
      typedItems,
      parseFloat(body.discount ?? existing.discount),
      parseFloat(body.taxRate ?? existing.taxRate)
    );

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      return tx.invoice.update({
        where: { id },
        data: {
          customerId: body.customerId !== undefined ? body.customerId || null : existing.customerId,
          subtotal,
          discount,
          taxRate: parseFloat(body.taxRate ?? existing.taxRate),
          taxAmount,
          total,
          notes: body.notes !== undefined ? body.notes || null : existing.notes,
          dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : existing.dueDate,
          items: {
            create: typedItems.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.quantity * item.unitPrice,
              productId: item.productId || null,
            })),
          },
        },
        include: {
          customer: true,
          items: { include: { product: { select: { id: true, name: true } } } },
          payments: { orderBy: { paidAt: "desc" } },
        },
      });
    });

    return NextResponse.json(updated);
  }

  if (isLimitedEdit) {
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        notes: body.notes !== undefined ? body.notes || null : undefined,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
      },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { paidAt: "desc" } },
      },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "record_payment") {
    const amount = parseFloat(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const newPaidAmount = existing.paidAmount + amount;
    const isFullyPaid = newPaidAmount >= existing.total - 0.01;
    const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoicePayment.create({
        data: {
          invoiceId: id,
          amount,
          method: body.method || "cash",
          note: body.note || null,
          paidAt,
        },
      });
      return tx.invoice.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          paymentMethod: body.method || existing.paymentMethod,
          status: isFullyPaid ? "paid" : "partial",
          paidAt: isFullyPaid ? paidAt : existing.paidAt,
        },
        include: {
          customer: true,
          items: true,
          payments: { orderBy: { paidAt: "desc" } },
        },
      });
    });

    return NextResponse.json(updated);
  }

  const statusData: Record<string, unknown> = {};
  if (body.status !== undefined) {
    statusData.status = body.status;
    if (body.status === "paid") {
      statusData.paidAt = new Date();
      statusData.paidAmount = existing.total;
      statusData.paymentMethod = body.paymentMethod || existing.paymentMethod || "cash";
    }
    if (body.status === "sent" && existing.status === "draft") {
      statusData.viewedAt = null;
    }
  }
  if (body.notes !== undefined) statusData.notes = body.notes || null;
  if (body.dueDate !== undefined) statusData.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const updated = await prisma.invoice.update({
    where: { id },
    data: statusData,
    include: {
      customer: true,
      items: true,
      payments: { orderBy: { paidAt: "desc" } },
    },
  });

  if (body.status === "overdue" && existing.status !== "overdue") {
    createAutoTask({
      shopId: existing.shopId,
      userId: session.user.id,
      title: `পেমেন্ট মেয়াদোত্তীর্ণ: ${existing.invoiceNumber} (৳${existing.total})`,
      category: "accounts",
      priority: "high",
      dueDaysFromNow: 0,
    }).catch(() => {});
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, shop: { userId: session.user.id } },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
