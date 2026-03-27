import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAutoTask } from "@/lib/autoTasks";

async function getInvoiceForUser(id: string, userId: string) {
  const shop = await prisma.shop.findUnique({ where: { userId } });
  if (!shop) return null;
  return prisma.invoice.findFirst({ where: { id, shopId: shop.id } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, shop: { userId: session.user.id } },
    include: { customer: true, items: true },
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
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      status: body.status,
      notes: body.notes,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      paidAt: body.status === "paid" ? new Date() : undefined,
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
