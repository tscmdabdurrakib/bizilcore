import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

async function getShopAndRoom(userId: string, id: string) {
  const shop = await prisma.shop.findUnique({ where: { userId } });
  if (!shop) return { error: NextResponse.json({ error: "Shop not found" }, { status: 404 }) };
  const room = await prisma.room.findFirst({ where: { id, shopId: shop.id } });
  if (!room) return { error: NextResponse.json({ error: "Room not found" }, { status: 404 }) };
  return { shop, room };
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await getShopAndRoom(session.user.id, id);
  if ("error" in r) return r.error;
  return NextResponse.json(r.room);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await getShopAndRoom(session.user.id, id);
  if ("error" in r) return r.error;

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.number !== undefined) data.number = String(body.number).trim();
  if (body.type !== undefined) data.type = body.type;
  if (body.floor !== undefined) data.floor = body.floor;
  if (body.capacity !== undefined) data.capacity = Number(body.capacity);
  if (body.ratePerNight !== undefined) data.ratePerNight = Number(body.ratePerNight);
  if (body.status !== undefined) data.status = body.status;
  if (body.amenities !== undefined) data.amenities = Array.isArray(body.amenities) ? body.amenities : [];
  if (body.description !== undefined) data.description = body.description || null;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;

  const updated = await prisma.room.update({ where: { id: r.room.id }, data });

  await logActivity({
    shopId: r.shop.id,
    userId: session.user.id,
    action: "রুম আপডেট",
    detail: `রুম ${updated.number}`,
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const r = await getShopAndRoom(session.user.id, id);
  if ("error" in r) return r.error;

  const active = await prisma.booking.count({
    where: { roomId: r.room.id, status: { in: ["confirmed", "checked_in"] } },
  });
  if (active > 0) {
    return NextResponse.json(
      { error: "এই রুমে এক্টিভ বুকিং আছে — ডিলিট করা যাবে না" },
      { status: 409 },
    );
  }

  await prisma.room.delete({ where: { id: r.room.id } });

  await logActivity({
    shopId: r.shop.id,
    userId: session.user.id,
    action: "রুম ডিলিট",
    detail: `রুম ${r.room.number}`,
  });

  return NextResponse.json({ ok: true });
}
