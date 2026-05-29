import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/restaurant/shift/[id]/close
 * Body: { countedCash, closedBy, denominationBreakdown (Json), notes, pin }
 *
 * Requires manager PIN. Computes expectedCash from opening cash + cash orders + manual logs.
 * Sets cashOver/cashShort.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { id: true, managerPin: true },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  // ── Manager PIN verification ─────────────────────────────────
  const pin = String(body.pin ?? "");
  if (shop.managerPin) {
    if (!pin) return NextResponse.json({ error: "শিফট বন্ধ করতে Manager PIN প্রয়োজন" }, { status: 403 });
    const pinOk = await bcrypt.compare(pin, shop.managerPin);
    if (!pinOk) return NextResponse.json({ error: "ভুল Manager PIN" }, { status: 403 });
  }
  // If managerPin is not set, allow without PIN (shop owner hasn't configured it yet)

  const shift = await prisma.posShift.findFirst({
    where: { id, shopId: shop.id, status: "open" },
    include: { logs: true },
  });
  if (!shift) return NextResponse.json({ error: "শিফট পাওয়া যায়নি বা ইতিমধ্যে বন্ধ" }, { status: 404 });

  const countedCash = Math.max(0, Number(body.countedCash) || 0);
  const closedBy    = String(body.closedBy || session.user.name || "Unknown");
  const closedById  = session.user.id;
  const notes       = body.notes ? String(body.notes) : null;
  const denominationBreakdown = body.denominationBreakdown ?? null;

  // Compute expected cash
  const cashIn  = shift.logs.filter(l => l.type === "in").reduce((s, l) => s + l.amount, 0);
  const cashOut = shift.logs.filter(l => l.type === "out").reduce((s, l) => s + l.amount, 0);

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
    await tx.cashDrawerLog.create({
      data: {
        shopId: shop.id,
        shiftId: id,
        type: "close",
        amount: countedCash,
        note: `শিফট বন্ধ — গণনা: ৳${countedCash.toFixed(2)}${denominationBreakdown ? " (denomination recorded)" : ""}`,
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
