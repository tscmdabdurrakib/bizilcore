import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eachDateInRange, getShopForOwner } from "@/lib/hr/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { status } = body;
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const request = await prisma.leaveRequest.findFirst({
    where: { id, shopId: shop.id },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.status !== "pending") {
    return NextResponse.json({ error: "Already reviewed" }, { status: 400 });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
    include: { staff: { include: { user: { select: { name: true } } } } },
  });

  if (status === "approved") {
    const year = request.startDate.getFullYear();
    const days = eachDateInRange(request.startDate, request.endDate).length;

    await prisma.leaveBalance.upsert({
      where: { staffId_year: { staffId: request.staffId, year } },
      create: {
        shopId: shop.id,
        staffId: request.staffId,
        year,
        usedCasual: request.type === "casual" ? days : 0,
        usedSick: request.type === "sick" ? days : 0,
      },
      update: {
        usedCasual: request.type === "casual" ? { increment: days } : undefined,
        usedSick: request.type === "sick" ? { increment: days } : undefined,
      },
    });

    for (const d of eachDateInRange(request.startDate, request.endDate)) {
      await prisma.attendance.upsert({
        where: { staffId_date: { staffId: request.staffId, date: d } },
        create: {
          shopId: shop.id,
          staffId: request.staffId,
          date: d,
          status: "leave",
          notes: `${request.type} leave approved`,
        },
        update: { status: "leave" },
      });
    }
  }

  return NextResponse.json(updated);
}
