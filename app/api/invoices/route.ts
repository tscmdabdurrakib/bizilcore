import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { autoMarkOverdueInvoices, getShopForUser, ensureInvoiceTokens } from "@/lib/invoices/server";
import { calcInvoiceTotals } from "@/lib/invoices/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  await autoMarkOverdueInvoices(shop.id);
  await ensureInvoiceTokens(shop.id);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const customerId = searchParams.get("customerId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const sort = searchParams.get("sort") ?? "createdAt";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59.999Z`) } : {}),
    };
  }
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { customer: { phone: { contains: search } } },
    ];
  }

  const orderBy =
    sort === "total"
      ? { total: "desc" as const }
      : sort === "dueDate"
        ? { dueDate: "asc" as const }
        : { createdAt: "desc" as const };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: { include: { product: { select: { id: true, name: true } } } },
        payments: { orderBy: { paidAt: "desc" } },
      },
      orderBy,
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

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { customerId, items, discount, taxRate, notes, dueDate, isRecurring, recurringInterval } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Items required" }, { status: 400 });
  }

  const typedItems = items as {
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string | null;
  }[];

  const { subtotal, discount: discountAmount, taxAmount, total } = calcInvoiceTotals(
    typedItems,
    parseFloat(discount ?? 0),
    parseFloat(taxRate ?? 0)
  );

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
      taxRate: parseFloat(taxRate ?? 0),
      taxAmount,
      total,
      notes: notes || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      isRecurring: !!isRecurring,
      recurringInterval: isRecurring ? recurringInterval || "monthly" : null,
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
      items: { include: { product: { select: { id: true, name: true } } } },
      customer: true,
      payments: true,
    },
  });

  const { logActivity } = await import("@/lib/logActivity");
  await logActivity({
    userId: session.user.id,
    shopId: shop.id,
    action: "invoice_create",
    detail: `ইনভয়েস তৈরি: ${invoiceNumber} — ৳${total}`,
  });

  if (dueDate) {
    const { createAutoTask } = await import("@/lib/autoTasks");
    const dueDateObj = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
