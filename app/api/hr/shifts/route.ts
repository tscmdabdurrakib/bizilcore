import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShopForOwner } from "@/lib/hr/server";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
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

  const shop = await getShopForOwner(session.user.id);
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

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { id, title, startTime, endTime, days, color } = body;
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.shift.findFirst({ where: { id, shopId: shop.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shift = await prisma.shift.update({
    where: { id },
    data: {
      title: title ?? existing.title,
      startTime: startTime ?? existing.startTime,
      endTime: endTime ?? existing.endTime,
      days: days ?? existing.days,
      color: color ?? existing.color,
    },
  });

  return NextResponse.json(shift);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const existing = await prisma.shift.findFirst({ where: { id, shopId: shop.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.shift.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
