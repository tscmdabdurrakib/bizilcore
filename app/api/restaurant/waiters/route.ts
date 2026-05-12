import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWaiterStats, parseDateParam } from "@/lib/restaurant/waiterStats";

async function getShop(userId: string) {
  return prisma.shop.findUnique({ where: { userId }, select: { id: true } });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

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
