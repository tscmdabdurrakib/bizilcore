import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShopForOwner } from "@/lib/hr/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { shiftId, staffId, weekStart } = body;

  if (!shiftId || !staffId || !weekStart) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const shift = await prisma.shift.findFirst({ where: { id: shiftId, shopId: shop.id } });
  if (!shift) return NextResponse.json({ error: "Shift not found" }, { status: 404 });

  const assignment = await prisma.shiftAssignment.upsert({
    where: {
      shiftId_staffId_weekStart: {
        shiftId,
        staffId,
        weekStart: new Date(weekStart),
      },
    },
    create: { shiftId, staffId, weekStart: new Date(weekStart) },
    update: {},
  });

  return NextResponse.json(assignment, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const assignment = await prisma.shiftAssignment.findUnique({
    where: { id },
    include: { shift: { select: { shopId: true } } },
  });
  if (!assignment || assignment.shift.shopId !== shop.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.shiftAssignment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
