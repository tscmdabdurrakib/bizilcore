import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskPlan } from "@/lib/taskGuard";
import { maybeCreateRecurringClone } from "@/lib/taskRecurrence";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const task = await prisma.task.findFirst({
    where: { id, shopId: shop.id },
    include: {
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      activityLogs: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      order: { select: { id: true } },
      assignedTo: { select: { id: true, name: true } },
      subtasks: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const existing = await prisma.task.findFirst({
    where: { id, shopId: shop.id },
    include: { subtasks: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
  });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = await req.json();
  const {
    title, description, status, priority, category,
    assignedToId, tags, attachments, dueDate, reminderAt, recurring, recurrence, orderId,
    estimatedMinutes, actualMinutes,
  } = body;

  if (orderId) {
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: session.user.id } });
    if (!order) return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 400 });
  }

  if (assignedToId && assignedToId !== session.user.id) {
    const staffMember = await prisma.staffMember.findFirst({
      where: { userId: assignedToId, shopId: shop.id, isActive: true },
    });
    if (!staffMember) return NextResponse.json({ error: "অ্যাসাইনি এই শপের সদস্য নন" }, { status: 400 });
  }

  const changes: string[] = [];
  if (title && title !== existing.title) changes.push(`শিরোনাম পরিবর্তন`);
  if (status && status !== existing.status) changes.push(`স্ট্যাটাস: ${status}`);
  if (priority && priority !== existing.priority) changes.push(`অগ্রাধিকার: ${priority}`);

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(assignedToId !== undefined ? { assignedToId } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(reminderAt !== undefined ? { reminderAt: reminderAt ? new Date(reminderAt) : null } : {}),
      ...(recurring !== undefined ? { recurring } : {}),
      ...(recurrence !== undefined ? { recurrence } : {}),
      ...(orderId !== undefined ? { orderId } : {}),
      ...(attachments !== undefined ? { attachments } : {}),
      ...(estimatedMinutes !== undefined ? { estimatedMinutes: estimatedMinutes !== null ? Number(estimatedMinutes) : null } : {}),
      ...(actualMinutes !== undefined ? { actualMinutes: actualMinutes !== null ? Number(actualMinutes) : null } : {}),
      ...(status === "done" && existing.status !== "done" ? { completedAt: new Date() } : {}),
      ...(status !== "done" && existing.status === "done" ? { completedAt: null } : {}),
    },
  });

  if (changes.length > 0) {
    await prisma.taskActivityLog.create({
      data: {
        taskId: id,
        userId: session.user.id,
        action: "টাস্ক আপডেট",
        detail: changes.join(", "),
      },
    });
  }

  if (status !== undefined) {
    await maybeCreateRecurringClone(
      { ...existing, subtasks: existing.subtasks.map(s => ({ title: s.title, position: s.position })) },
      status,
      existing.status,
      session.user.id
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const { id } = await params;
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const task = await prisma.task.findFirst({ where: { id, shopId: shop.id } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
