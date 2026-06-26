import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { postJournalEntry } from "@/lib/accounting/journal";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;
  const { id } = await params;

  try {
    const entry = await prisma.$transaction((tx) =>
      postJournalEntry(tx, id, shop.id),
    );
    return NextResponse.json(entry);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to post";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
