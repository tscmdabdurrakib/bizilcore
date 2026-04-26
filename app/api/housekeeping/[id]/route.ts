import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const log = await prisma.housekeepingLog.findFirst({
    where: { id, shopId: shop.id },
    include: { room: true },
  });
  if (!log) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = await req.json();
  const action = body.action; // "start" | "done" | "cancel"
  const data: Record<string, unknown> = {};

  // State machine guards: pending → in_progress → done; pending|in_progress → cancelled
  if (action === "start") {
    if (log.status !== "pending") {
      return NextResponse.json({ error: "শুধু pending টাস্ক শুরু করা যাবে" }, { status: 400 });
    }
    data.status = "in_progress";
    data.startedAt = new Date();
  } else if (action === "done") {
    if (log.status !== "in_progress") {
      return NextResponse.json({ error: "শুধু চলমান টাস্ক সম্পন্ন করা যাবে (আগে শুরু করুন)" }, { status: 400 });
    }
    data.status = "done";
    data.doneAt = new Date();
  } else if (action === "cancel") {
    if (log.status === "done" || log.status === "cancelled") {
      return NextResponse.json({ error: "এই অবস্থায় বাতিল করা যাবে না" }, { status: 400 });
    }
    data.status = "cancelled";
  } else {
    return NextResponse.json({ error: "অজানা action" }, { status: 400 });
  }

  if (body.staffId !== undefined) {
    if (!body.staffId) {
      data.staffId = null;
    } else {
      const owned = await prisma.staffMember.findFirst({
        where: { id: String(body.staffId), shopId: shop.id },
        select: { id: true },
      });
      data.staffId = owned ? owned.id : null;
    }
  }
  if (body.note !== undefined) data.note = body.note || null;

  const updated = await prisma.housekeepingLog.update({
    where: { id: log.id },
    data,
    include: { room: true },
  });

  // If marking done and room currently in cleaning state, set vacant
  if (action === "done" && log.room.status === "cleaning" && log.task === "cleaning") {
    await prisma.room.update({ where: { id: log.roomId }, data: { status: "vacant" } });
  }
  if (action === "done" && log.room.status === "maintenance" && log.task === "maintenance") {
    await prisma.room.update({ where: { id: log.roomId }, data: { status: "vacant" } });
  }

  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: action === "done" ? "হাউসকিপিং সম্পন্ন" : action === "start" ? "হাউসকিপিং শুরু" : "হাউসকিপিং বাতিল",
    detail: `রুম ${log.room.number} · ${log.task}`,
  });

  return NextResponse.json(updated);
}
