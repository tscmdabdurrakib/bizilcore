import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";

function agingBucket(days: number): string {
  if (days <= 30) return "current";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}

export async function GET(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const type = req.nextUrl.searchParams.get("type") ?? "invoices";
  if (type === "aging") {
    const invoices = await prisma.invoice.findMany({
      where: { shopId: shop.id, status: { in: ["sent", "partial", "overdue"] } },
      include: { customer: { select: { name: true } } },
    });

    const buckets = { current: 0, "31-60": 0, "61-90": 0, "90+": 0 };
    const byCustomer: Record<string, { name: string; buckets: typeof buckets }> = {};

    for (const inv of invoices) {
      const balance = inv.total - inv.paidAmount;
      if (balance <= 0) continue;
      const days = inv.dueDate
        ? Math.floor((Date.now() - inv.dueDate.getTime()) / 86400000)
        : 0;
      const bucket = agingBucket(Math.max(0, days)) as keyof typeof buckets;
      buckets[bucket] += balance;

      const cid = inv.customerId ?? "unknown";
      if (!byCustomer[cid]) {
        byCustomer[cid] = {
          name: inv.customer?.name ?? "Unknown",
          buckets: { current: 0, "31-60": 0, "61-90": 0, "90+": 0 },
        };
      }
      byCustomer[cid].buckets[bucket] += balance;
    }

    return NextResponse.json({ buckets, byCustomer: Object.values(byCustomer) });
  }

  const bills = await prisma.supplierBill.findMany({
    where: { shopId: shop.id },
    orderBy: { billDate: "desc" },
    take: 100,
  });

  const rows = bills.map((b) => ({
    ...b,
    balance: b.totalAmount - b.paidAmount,
    daysOverdue: b.dueDate
      ? Math.max(0, Math.floor((Date.now() - b.dueDate.getTime()) / 86400000))
      : 0,
  }));

  return NextResponse.json({ bills: rows });
}

export async function POST(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop, session } = ctx;
  const body = await req.json();
  const { supplierBillId, amount, paymentMethod, bankAccountId, notes } = body;

  const bill = await prisma.supplierBill.findFirst({
    where: { id: supplierBillId, shopId: shop.id },
  });
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  const amt = parseFloat(amount);
  const balance = bill.totalAmount - bill.paidAmount;
  if (!amt || amt > balance + 0.01) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const { createJournalEntry } = await import("@/lib/accounting/journal");
  const { COA_CODES, getAccountByCode } = await import("@/lib/accounting/seed-coa");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const apAcct = await getAccountByCode(shop.id, COA_CODES.AP, tx);
      let payAcctId: string;
      if (bankAccountId) {
        const bank = await tx.accountingBankAccount.findFirst({
          where: { id: bankAccountId, shopId: shop.id },
        });
        if (!bank) throw new Error("Bank account not found");
        payAcctId = bank.accountId;
      } else {
        const cash = await getAccountByCode(shop.id, COA_CODES.CASH, tx);
        if (!cash) throw new Error("Cash account missing");
        payAcctId = cash.id;
      }
      if (!apAcct) throw new Error("AP account missing");

      const entry = await createJournalEntry(tx, {
        shopId: shop.id,
        userId: session.user.id,
        entryDate: new Date(),
        description: `Payment for bill ${bill.billNumber}`,
        lines: [
          { accountId: apAcct.id, debitAmount: amt, creditAmount: 0 },
          { accountId: payAcctId, debitAmount: 0, creditAmount: amt },
        ],
        referenceType: "supplier_payment",
        referenceId: bill.id,
        post: true,
      });

      const payment = await tx.supplierPayment.create({
        data: {
          shopId: shop.id,
          supplierBillId,
          paymentDate: new Date(),
          amount: amt,
          paymentMethod: paymentMethod ?? "cash",
          bankAccountId: bankAccountId ?? null,
          journalEntryId: entry.id,
          notes: notes ?? null,
        },
      });

      const newPaid = bill.paidAmount + amt;
      await tx.supplierBill.update({
        where: { id: supplierBillId },
        data: {
          paidAmount: newPaid,
          status: newPaid >= bill.totalAmount - 0.01 ? "paid" : "partial",
        },
      });

      return { payment, entry };
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
