import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const floor = searchParams.get("floor");

  const rooms = await prisma.room.findMany({
    where: {
      shopId: shop.id,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(floor ? { floor } : {}),
    },
    orderBy: [{ floor: "asc" }, { number: "asc" }],
  });

  return NextResponse.json(rooms);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  if (!body.number || !body.ratePerNight) {
    return NextResponse.json({ error: "রুম নম্বর ও ভাড়া দরকার" }, { status: 400 });
  }

  const exists = await prisma.room.findUnique({
    where: { shopId_number: { shopId: shop.id, number: String(body.number).trim() } },
  });
  if (exists) return NextResponse.json({ error: "এই রুম নম্বর ইতিমধ্যেই আছে" }, { status: 409 });

  const room = await prisma.room.create({
    data: {
      shopId: shop.id,
      number: String(body.number).trim(),
      type: body.type || "single",
      floor: body.floor || "1st",
      capacity: Number(body.capacity) || 2,
      ratePerNight: Number(body.ratePerNight),
      status: body.status || "vacant",
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      description: body.description || null,
      imageUrl: body.imageUrl || null,
    },
  });

  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "নতুন রুম যোগ",
    detail: `রুম ${room.number} · ${room.type}`,
  });

  return NextResponse.json(room, { status: 201 });
}
