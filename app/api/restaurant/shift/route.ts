import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getShop(userId: string) {
  return prisma.shop.findUnique({
    where: { userId },
    select: { id: true, restRequireShift: true },
  });
}

/** GET — returns the current open PosShift (if any) plus recent closed shifts */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const [activeShift, recentShifts] = await Promise.all([
    prisma.posShift.findFirst({
      where: { shopId: shop.id, status: "open" },
      include: { logs: { orderBy: { loggedAt: "desc" } } },
      orderBy: { openedAt: "desc" },
    }),
    prisma.posShift.findMany({
      where: { shopId: shop.id, status: "closed" },
      orderBy: { closedAt: "desc" },
      take: 20,
      include: { logs: { orderBy: { loggedAt: "asc" } } },
    }),
  ]);

  // Compute running balance for active shift
  let runningBalance = 0;
  if (activeShift) {
    runningBalance = activeShift.openingCash;
    for (const log of activeShift.logs) {
      if (log.type === "in") runningBalance += log.amount;
      if (log.type === "out") runningBalance -= log.amount;
    }
  }

  return NextResponse.json({
    activeShift: activeShift ? { ...activeShift, runningBalance } : null,
    recentShifts,
    requireShift: shop.restRequireShift,
  });
}

/** POST — open a new POS shift */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await getShop(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  // Only one open shift at a time
  const existing = await prisma.posShift.findFirst({
    where: { shopId: shop.id, status: "open" },
  });
  if (existing) {
    return NextResponse.json({ error: "একটি শিফট ইতিমধ্যে চলছে" }, { status: 400 });
  }

  const body = await req.json();
  const openingCash = Math.max(0, Number(body.openingCash) || 0);
  const openedBy    = String(body.openedBy || session.user.name || "Unknown");
  const openedById  = session.user.id;

  // Auto-generate shift number: SHF-YYYY-NNN
  const year = new Date().getFullYear();
  const prefix = `SHF-${year}-`;
  const last = await prisma.posShift.findFirst({
    where: { shopId: shop.id, shiftNumber: { startsWith: prefix } },
    orderBy: { shiftNumber: "desc" },
    select: { shiftNumber: true },
  });
  const seq = last ? parseInt(last.shiftNumber.split("-")[2] ?? "0") + 1 : 1;
  const shiftNumber = `${prefix}${String(seq).padStart(3, "0")}`;

  const shift = await prisma.$transaction(async tx => {
    const s = await tx.posShift.create({
      data: {
        shopId: shop.id,
        shiftNumber,
        openedBy,
        openedById,
        openingCash,
        expectedCash: openingCash,
        status: "open",
      },
    });
    // Log the opening event
    await tx.cashDrawerLog.create({
      data: {
        shopId: shop.id,
        shiftId: s.id,
        type: "open",
        amount: openingCash,
        note: "শিফট শুরু",
        performedBy: openedBy,
      },
    });
    return s;
  });

  return NextResponse.json(shift, { status: 201 });
}
