import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { createJournalEntry } from "@/lib/accounting/journal";
import { COA_CODES, getAccountByCode } from "@/lib/accounting/seed-coa";
import { roundMoney } from "@/types/accounting";

export async function GET(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const status = req.nextUrl.searchParams.get("status");
  const invoices = await prisma.invoice.findMany({
    where: {
      shopId: shop.id,
      ...(status ? { status } : { status: { in: ["sent", "partial", "overdue", "draft"] } }),
    },
    include: { customer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const rows = invoices.map((inv) => {
    const balance = inv.total - inv.paidAmount;
    const daysOverdue = inv.dueDate
      ? Math.max(0, Math.floor((Date.now() - inv.dueDate.getTime()) / 86400000))
      : 0;
    return {
      ...inv,
      balance: roundMoney(balance),
      daysOverdue: inv.status === "paid" ? 0 : daysOverdue,
    };
  });

  return NextResponse.json({ invoices: rows });
}

export async function POST(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop, session } = ctx;
  const body = await req.json();
  const { invoiceId, amount, paymentMethod, bankAccountId, notes } = body;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, shopId: shop.id },
  });
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const amt = roundMoney(parseFloat(amount));
  const balance = invoice.total - invoice.paidAmount;
  if (amt <= 0 || amt > balance + 0.01) {
    return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const paymentCode =
        paymentMethod === "bkash"
          ? COA_CODES.BKASH
          : paymentMethod === "nagad"
            ? COA_CODES.NAGAD
            : COA_CODES.CASH;
      const payAcct = await getAccountByCode(shop.id, paymentCode, tx);
      const arAcct = await getAccountByCode(shop.id, COA_CODES.AR, tx);
      if (!payAcct || !arAcct) throw new Error("COA accounts missing");

      const entry = await createJournalEntry(tx, {
        shopId: shop.id,
        userId: session.user.id,
        entryDate: new Date(),
        description: `Payment for invoice ${invoice.invoiceNumber}`,
        lines: [
          { accountId: payAcct.id, debitAmount: amt, creditAmount: 0 },
          { accountId: arAcct.id, debitAmount: 0, creditAmount: amt },
        ],
        referenceType: "invoice_payment",
        referenceId: invoice.id,
        post: true,
      });

      const payment = await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount: amt,
          method: paymentMethod ?? "cash",
          note: notes ?? null,
          bankAccountId: bankAccountId ?? null,
          journalEntryId: entry.id,
        },
      });

      const newPaid = invoice.paidAmount + amt;
      const newStatus = newPaid >= invoice.total - 0.01 ? "paid" : "partial";

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaid,
          status: newStatus,
          paidAt: newStatus === "paid" ? new Date() : undefined,
        },
      });

      return { payment, entry };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
