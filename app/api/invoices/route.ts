import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { createAutoTask } from "@/lib/autoTasks";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return NextResponse.json({ invoices, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { customerId, items, discount, notes, dueDate } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Items required" }, { status: 400 });
  }

  const subtotal = (items as { quantity: number; unitPrice: number }[]).reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const discountAmount = parseFloat(discount ?? 0);
  const total = subtotal - discountAmount;

  const count = await prisma.invoice.count({ where: { shopId: shop.id } });
  const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      shopId: shop.id,
      userId: session.user.id,
      customerId: customerId || null,
      invoiceNumber,
      status: "draft",
      subtotal,
      discount: discountAmount,
      total,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      items: {
        create: (items as { description: string; quantity: number; unitPrice: number }[]).map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.quantity * item.unitPrice,
        })),
      },
    },
    include: { items: true, customer: true },
  });

  await logActivity({ userId: session.user.id, shopId: shop.id, action: "invoice_create", detail: `ইনভয়েস তৈরি: ${invoiceNumber} — ৳${total}` });

  if (dueDate) {
    const dueDateObj = new Date(dueDate);
    const today = new Date(); today.setHours(0,0,0,0);
    const dueDays = Math.max(0, Math.round((dueDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    createAutoTask({
      shopId: shop.id,
      userId: session.user.id,
      title: `পেমেন্ট কালেকশন: ${invoiceNumber} (৳${total}) — ${dueDateObj.toLocaleDateString("bn-BD")}`,
      category: "accounts",
      priority: dueDays <= 1 ? "high" : "medium",
      dueDaysFromNow: dueDays,
    }).catch(() => {});
  }

  return NextResponse.json(invoice, { status: 201 });
}
