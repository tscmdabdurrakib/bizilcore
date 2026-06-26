import { NextResponse } from "next/server";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { backfillAllShopsCoa } from "@/lib/accounting/seed-coa";

export async function POST() {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;

  const count = await backfillAllShopsCoa();
  return NextResponse.json({ success: true, shopsProcessed: count });
}
