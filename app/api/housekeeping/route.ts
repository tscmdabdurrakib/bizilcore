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

  const logs = await prisma.housekeepingLog.findMany({
    where: { shopId: shop.id, ...(status ? { status } : {}) },
    include: { room: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  if (!body.roomId) return NextResponse.json({ error: "রুম দরকার" }, { status: 400 });

  const room = await prisma.room.findFirst({ where: { id: body.roomId, shopId: shop.id } });
  if (!room) return NextResponse.json({ error: "রুম পাওয়া যায়নি" }, { status: 404 });

  // Tenant-scope staffId: only allow staff belonging to this shop
  let staffId: string | null = null;
  if (body.staffId) {
    const owned = await prisma.staffMember.findFirst({
      where: { id: String(body.staffId), shopId: shop.id },
      select: { id: true },
    });
    if (owned) staffId = owned.id;
  }

  const log = await prisma.housekeepingLog.create({
    data: {
      shopId: shop.id,
      roomId: room.id,
      staffId,
      task: body.task || "cleaning",
      priority: body.priority || "normal",
      note: body.note || null,
    },
    include: { room: true },
  });

  // If task is cleaning/maintenance, mark room status accordingly (only if currently vacant)
  if (room.status === "vacant") {
    await prisma.room.update({
      where: { id: room.id },
      data: { status: log.task === "maintenance" ? "maintenance" : "cleaning" },
    });
  }

  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "হাউসকিপিং টাস্ক",
    detail: `রুম ${room.number} · ${log.task}`,
  });

  return NextResponse.json(log, { status: 201 });
}
