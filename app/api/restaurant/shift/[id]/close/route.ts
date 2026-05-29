import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/restaurant/shift/[id]/close
 * Body: { countedCash, closedBy, denominationBreakdown (Json), notes }
 *
 * Computes expectedCash = openingCash + cash-in orders (cash method) + manual cash-in - manual cash-out
 * Then sets cashOver/cashShort based on countedCash vs expectedCash.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;

  const shift = await prisma.posShift.findFirst({
    where: { id, shopId: shop.id, status: "open" },
    include: { logs: true },
  });
  if (!shift) return NextResponse.json({ error: "শিফট পাওয়া যায়নি বা ইতিমধ্যে বন্ধ" }, { status: 404 });

  const body = await req.json();
  const countedCash = Math.max(0, Number(body.countedCash) || 0);
  const closedBy    = String(body.closedBy || session.user.name || "Unknown");
  const closedById  = session.user.id;
  const notes       = body.notes ? String(body.notes) : null;
  const denominationBreakdown = body.denominationBreakdown ?? null;

  // Compute expected cash from shift opening + logs + paid cash orders during this shift
  const cashIn  = shift.logs.filter(l => l.type === "in").reduce((s, l) => s + l.amount, 0);
  const cashOut = shift.logs.filter(l => l.type === "out").reduce((s, l) => s + l.amount, 0);

  // Cash orders placed during this shift
  const cashOrders = await prisma.restaurantOrder.aggregate({
    where: {
      shopId: shop.id,
      status: { in: ["paid", "completed"] },
      paymentMethod: "cash",
      createdAt: { gte: shift.openedAt },
      isVoided: false,
    },
    _sum: { totalAmount: true },
  });
  const cashOrderRevenue = cashOrders._sum.totalAmount ?? 0;

  const expectedCash = shift.openingCash + cashOrderRevenue + cashIn - cashOut;
  const diff         = countedCash - expectedCash;
  const cashOver     = diff > 0 ? diff : 0;
  const cashShort    = diff < 0 ? Math.abs(diff) : 0;

  const closed = await prisma.$transaction(async tx => {
    // Log the closing event
    await tx.cashDrawerLog.create({
      data: {
        shopId: shop.id,
        shiftId: id,
        type: "close",
        amount: countedCash,
        note: `শিফট বন্ধ — গণনা: ৳${countedCash.toFixed(2)}${denominationBreakdown ? " (denomination breakdown recorded)" : ""}`,
        performedBy: closedBy,
      },
    });

    return tx.posShift.update({
      where: { id },
      data: {
        status: "closed",
        closedAt: new Date(),
        closedBy,
        closedById,
        countedCash,
        expectedCash,
        cashOver,
        cashShort,
        notes: [notes, denominationBreakdown ? `Denomination: ${JSON.stringify(denominationBreakdown)}` : null]
          .filter(Boolean).join(" | ") || null,
      },
      include: { logs: { orderBy: { loggedAt: "asc" } } },
    });
  });

  return NextResponse.json({ ...closed, cashOrderRevenue, expectedCash, diff, cashOver, cashShort });
}
