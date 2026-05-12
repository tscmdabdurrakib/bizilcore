import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { getWaiterStats, parseDateParam } from "@/lib/restaurant/waiterStats";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();

  const { searchParams } = new URL(req.url);
  let dateFrom: string | null, dateTo: string | null;
  try {
    dateFrom = parseDateParam(searchParams.get("from"), "from");
    dateTo   = parseDateParam(searchParams.get("to"),   "to");
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  const role = searchParams.get("role") || null;

  const result = await getWaiterStats(shop.id, dateFrom, dateTo, role);
  return NextResponse.json(result);
}
