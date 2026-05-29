import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/restaurant/shift/[id]/cash-log
 * Body: { type: "in" | "out", amount, note }
 *
 * Records a cash in/out transaction in the active shift's drawer log
 * and updates the shift's expectedCash accordingly.
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
  });
  if (!shift) return NextResponse.json({ error: "সক্রিয় শিফট পাওয়া যায়নি" }, { status: 404 });

  const body = await req.json();
  const type   = body.type === "out" ? "out" : "in";
  const amount = Math.max(0, Number(body.amount) || 0);
  const note   = body.note ? String(body.note) : null;
  const performedBy = String(session.user.name || "Unknown");

  if (amount <= 0) return NextResponse.json({ error: "পরিমাণ শূন্যের বেশি হতে হবে" }, { status: 400 });

  const log = await prisma.$transaction(async tx => {
    const l = await tx.cashDrawerLog.create({
      data: {
        shopId: shop.id,
        shiftId: id,
        type,
        amount,
        note,
        performedBy,
      },
    });
    // Update expectedCash on the shift
    await tx.posShift.update({
      where: { id },
      data: {
        expectedCash: { [type === "in" ? "increment" : "decrement"]: amount },
      },
    });
    return l;
  });

  return NextResponse.json(log, { status: 201 });
}

/** GET — returns all logs for a shift */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const logs = await prisma.cashDrawerLog.findMany({
    where: { shiftId: id, shopId: shop.id },
    orderBy: { loggedAt: "asc" },
  });

  return NextResponse.json(logs);
}
