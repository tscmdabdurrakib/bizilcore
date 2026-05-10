import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { shopId: shop.id };
    if (status && status !== "all") where.status = status;

    // Auto-mark overdue
    await prisma.freelanceInvoice.updateMany({
      where: {
        shopId: shop.id,
        status: { in: ["sent", "viewed"] },
        dueDate: { lt: new Date() },
      },
      data: { status: "overdue" },
    });

    const invoices = await prisma.freelanceInvoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        project: { select: { id: true, projectNumber: true, title: true } },
      },
    });

    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { shop } = await requireShop();
    const body = await req.json();

    const {
      projectId, clientId, items, subtotal, discountAmt = 0,
      taxRate = 0, taxAmount = 0, totalAmount, currency = "BDT",
      exchangeRate = 1, dueDate, paymentNote, status = "draft",
    } = body;

    const year = new Date().getFullYear();
    const prefix = shop.freelanceInvoicePrefix || "INV";
    const count = await prisma.freelanceInvoice.count({ where: { shopId: shop.id } });
    const invoiceNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

    const invoice = await prisma.freelanceInvoice.create({
      data: {
        shopId: shop.id,
        invoiceNumber,
        projectId: projectId || null,
        clientId,
        items,
        subtotal,
        discountAmt,
        taxRate,
        taxAmount,
        totalAmount,
        currency,
        exchangeRate,
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentNote: paymentNote || shop.freelancePaymentInstructions || null,
        status,
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        project: { select: { id: true, projectNumber: true, title: true } },
      },
    });

    return NextResponse.json(invoice);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
