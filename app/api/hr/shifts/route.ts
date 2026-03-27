import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const shifts = await prisma.shift.findMany({
    where: { shopId: shop.id },
    include: {
      shiftAssignments: {
        include: { staff: { include: { user: { select: { name: true } } } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ shifts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { title, startTime, endTime, days, color } = body;

  if (!title || !startTime || !endTime || !days) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const shift = await prisma.shift.create({
    data: {
      shopId: shop.id,
      title,
      startTime,
      endTime,
      days,
      color: color || "#0F6E56",
    },
  });

  return NextResponse.json(shift, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await prisma.shift.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
