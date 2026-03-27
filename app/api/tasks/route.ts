import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireTaskPlan } from "@/lib/taskGuard";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const category = searchParams.get("category");
  const assignedToId = searchParams.get("assignedToId");
  const myTasks = searchParams.get("myTasks") === "1";
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const all = searchParams.get("all") === "1";
  const dueDateFrom = searchParams.get("dueDateFrom");
  const dueDateTo = searchParams.get("dueDateTo");
  const completedToday = searchParams.get("completedToday") === "1";

  const where: Record<string, unknown> = { shopId: shop.id };
  if (completedToday) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    where.status = "done";
    where.completedAt = { gte: todayStart, lte: todayEnd };
  } else {
    if (status && status !== "all") where.status = status;
  }
  if (priority && priority !== "all") where.priority = priority;
  if (category && category !== "all") where.category = category;
  if (myTasks) {
    where.OR = [
      { userId: session.user.id },
      { assignedToId: session.user.id },
    ];
  } else if (assignedToId && assignedToId !== "all") {
    where.assignedToId = assignedToId === "unassigned" ? null : assignedToId;
  }
  if (search) {
    const tagMatchRows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT DISTINCT t.id FROM "Task" t, unnest(t.tags) AS tag
      WHERE t."shopId" = ${shop.id} AND tag ILIKE ${"%" + search + "%"}
    `;
    const tagMatchIds = tagMatchRows.map(r => r.id);

    const searchClause: object[] = [
      { title: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
    ];
    if (tagMatchIds.length > 0) {
      searchClause.push({ id: { in: tagMatchIds } });
    }

    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchClause }];
      delete where.OR;
    } else {
      where.OR = searchClause;
    }
  }
  if (dueDateFrom || dueDateTo) {
    where.dueDate = {
      ...(dueDateFrom ? { gte: new Date(dueDateFrom) } : {}),
      ...(dueDateTo ? { lte: new Date(dueDateTo) } : {}),
    };
  }

  const include = {
    comments: { select: { id: true } },
    user: { select: { name: true } },
    assignedTo: { select: { name: true } },
    subtasks: { select: { id: true, done: true }, orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }] },
  };

  if (all) {
    const tasks = await prisma.task.findMany({
      where,
      include,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(tasks);
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return NextResponse.json({ tasks, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await requireTaskPlan(session.user.id)) return NextResponse.json({ error: "Pro plan required" }, { status: 403 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const {
    title, description, status, priority, category,
    assignedToId, tags, dueDate, reminderAt, recurring, recurrence,
    orderId, subtasks,
  } = body;

  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

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

  const task = await prisma.task.create({
    data: {
      shopId: shop.id,
      userId: session.user.id,
      title,
      description: description || null,
      status: status || "todo",
      priority: priority || "medium",
      category: category || "general",
      assignedToId: assignedToId || null,
      tags: tags || [],
      dueDate: dueDate ? new Date(dueDate) : null,
      reminderAt: reminderAt ? new Date(reminderAt) : null,
      recurring: recurring || false,
      recurrence: recurrence || "none",
      orderId: orderId || null,
    },
  });

  await prisma.taskActivityLog.create({
    data: {
      taskId: task.id,
      userId: session.user.id,
      action: "টাস্ক তৈরি করা হয়েছে",
    },
  });

  if (Array.isArray(subtasks) && subtasks.length > 0) {
    await prisma.subTask.createMany({
      data: subtasks
        .filter((s: unknown) => typeof s === "string" && (s as string).trim())
        .map((s: string, i: number) => ({
          taskId: task.id,
          title: s.trim(),
          position: i,
          done: false,
        })),
    });
  }

  return NextResponse.json(task, { status: 201 });
}
