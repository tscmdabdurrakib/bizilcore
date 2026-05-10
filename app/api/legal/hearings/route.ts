import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const view = searchParams.get("view") ?? "upcoming";

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const monthEnd = new Date(today); monthEnd.setMonth(monthEnd.getMonth() + 1);

  let dateFilter: Record<string, Date> = {};
  if (view === "today") dateFilter = { gte: today, lt: tomorrow };
  else if (view === "week") { const we = new Date(today); we.setDate(today.getDate() + 7); dateFilter = { gte: today, lt: we }; }
  else if (view === "month") dateFilter = { gte: today, lt: monthEnd };
  else dateFilter = { gte: today };

  const hearings = await prisma.caseHearing.findMany({
    where: {
      shopId: shop.id,
      hearingDate: dateFilter,
    },
    include: {
      case: {
        select: {
          id: true,
          caseNumber: true,
          title: true,
          court: true,
          status: true,
          client: { select: { id: true, name: true, phone: true } },
        },
      },
    },
    orderBy: { hearingDate: "asc" },
  });

  return NextResponse.json({ hearings });
}
