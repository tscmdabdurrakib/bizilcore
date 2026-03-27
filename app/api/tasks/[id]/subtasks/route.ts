import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskPlan } from "@/lib/taskGuard";

async function getShopAndTask(userId: string, taskId: string) {
  const shop = await prisma.shop.findUnique({ where: { userId } });
  if (!shop) return null;
  const task = await prisma.task.findFirst({ where: { id: taskId, shopId: shop.id } });
  if (!task) return null;
  return { shop, task };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { id } = await params;
  const ctx = await getShopAndTask(session.user.id, id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const subtasks = await prisma.subTask.findMany({
    where: { taskId: id },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(subtasks);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { id } = await params;
  const ctx = await getShopAndTask(session.user.id, id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const count = await prisma.subTask.count({ where: { taskId: id } });

  const subtask = await prisma.subTask.create({
    data: { taskId: id, title: title.trim(), position: count },
  });

  return NextResponse.json(subtask, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { id } = await params;
  const ctx = await getShopAndTask(session.user.id, id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { subtaskId, done, title } = await req.json();
  if (!subtaskId) return NextResponse.json({ error: "subtaskId required" }, { status: 400 });

  const subtask = await prisma.subTask.findFirst({ where: { id: subtaskId, taskId: id } });
  if (!subtask) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

  const updated = await prisma.subTask.update({
    where: { id: subtaskId },
    data: {
      ...(done !== undefined ? { done } : {}),
      ...(title !== undefined ? { title: title.trim() } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { id } = await params;
  const ctx = await getShopAndTask(session.user.id, id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { subtaskId } = await req.json();
  if (!subtaskId) return NextResponse.json({ error: "subtaskId required" }, { status: 400 });

  await prisma.subTask.deleteMany({ where: { id: subtaskId, taskId: id } });

  return NextResponse.json({ success: true });
}
