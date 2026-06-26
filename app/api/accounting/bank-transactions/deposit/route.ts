import { NextRequest, NextResponse } from "next/server";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { bankJournal } from "../route";

export async function POST(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop, session } = ctx;
  const body = await req.json();
  const { bankAccountId, amount, transactionDate, description } = body;
  const amt = parseFloat(amount);
  if (!bankAccountId || !amt || amt <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await bankJournal(
      shop.id,
      session.user.id,
      bankAccountId,
      amt,
      new Date(transactionDate ?? Date.now()),
      description ?? "Deposit",
      "deposit",
    );
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
