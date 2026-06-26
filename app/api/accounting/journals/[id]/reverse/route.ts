import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { reverseJournalEntry } from "@/lib/accounting/journal";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop, session } = ctx;
  const { id } = await params;

  try {
    const reversal = await prisma.$transaction((tx) =>
      reverseJournalEntry(tx, id, shop.id, session.user.id),
    );
    return NextResponse.json(reversal);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to reverse";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
