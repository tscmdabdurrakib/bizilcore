import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { createJournalEntry } from "@/lib/accounting/journal";

export async function POST(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop, session } = ctx;
  const body = await req.json();
  const { entry_date, entryDate, description, lines, referenceType, referenceId } = body;
  const dateStr = entry_date ?? entryDate;

  if (!dateStr || !description || !Array.isArray(lines) || !lines.length) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const mappedLines = lines.map((l: {
      account_id?: string;
      accountId?: string;
      debit_amount?: number;
      debitAmount?: number;
      credit_amount?: number;
      creditAmount?: number;
      description?: string;
    }) => {
      const accountId = l.accountId ?? l.account_id;
      if (!accountId) throw new Error("Each line must have an account");
      return {
        accountId,
        debitAmount: l.debitAmount ?? l.debit_amount ?? 0,
        creditAmount: l.creditAmount ?? l.credit_amount ?? 0,
        description: l.description,
      };
    });

    const entry = await prisma.$transaction((tx) =>
      createJournalEntry(tx, {
        shopId: shop.id,
        userId: session.user.id,
        entryDate: new Date(dateStr),
        description,
        lines: mappedLines,
        referenceType,
        referenceId,
        post: false,
      }),
    );
    return NextResponse.json(entry, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create journal";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
