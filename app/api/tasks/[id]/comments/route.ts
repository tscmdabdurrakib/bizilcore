import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskPlan } from "@/lib/taskGuard";
import { requireTaskShop } from "@/lib/tasks/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { id } = await params;
  const shopCtx = await requireTaskShop();
  if ("error" in shopCtx) return shopCtx.error;
  const shop = shopCtx.shop;

  const task = await prisma.task.findFirst({ where: { id, shopId: shop.id } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Comment body required" }, { status: 400 });

  const comment = await prisma.taskComment.create({
    data: {
      taskId: id,
      userId: session.user.id,
      body: body.trim(),
    },
    include: { user: { select: { id: true, name: true } } },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: id,
      userId: session.user.id,
      action: "মন্তব্য যোগ করা হয়েছে",
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
