import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;

    const project = await prisma.freelanceProject.findFirst({
      where: { id, shopId: shop.id },
      include: {
        client: { select: { id: true, name: true, phone: true, address: true } },
        milestones: { orderBy: { createdAt: "asc" } },
        timeLogs: { orderBy: { logDate: "desc" } },
        invoices: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, invoiceNumber: true, status: true,
            totalAmount: true, currency: true, dueDate: true, createdAt: true,
          },
        },
      },
    });

    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { shop } = await requireShop();
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const project = await prisma.freelanceProject.findFirst({ where: { id, shopId: shop.id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (action === "update_status") {
      const updated = await prisma.freelanceProject.update({
        where: { id },
        data: { status: body.status },
      });
      return NextResponse.json(updated);
    }

    if (action === "add_milestone") {
      const milestone = await prisma.projectMilestone.create({
        data: {
          projectId: id,
          title: body.title,
          description: body.description || null,
          amount: body.amount || 0,
          currency: body.currency || "BDT",
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          status: "pending",
        },
      });
      return NextResponse.json(milestone);
    }

    if (action === "update_milestone") {
      const milestone = await prisma.projectMilestone.update({
        where: { id: body.milestoneId },
        data: {
          status: body.status,
          completedAt: ["approved", "paid"].includes(body.status) ? new Date() : null,
          note: body.note || null,
        },
      });
      return NextResponse.json(milestone);
    }

    if (action === "add_timelog") {
      const log = await prisma.timeLog.create({
        data: {
          shopId: shop.id,
          projectId: id,
          task: body.task,
          hours: body.hours,
          hourlyRate: body.hourlyRate || null,
          billable: body.billable !== false,
          logDate: body.logDate ? new Date(body.logDate) : new Date(),
          note: body.note || null,
        },
      });
      return NextResponse.json(log);
    }

    if (action === "add_note") {
      const updated = await prisma.freelanceProject.update({
        where: { id },
        data: { notes: body.notes },
      });
      return NextResponse.json(updated);
    }

    // General update
    const updated = await prisma.freelanceProject.update({
      where: { id },
      data: {
        title: body.title,
        status: body.status,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
        notes: body.notes,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
