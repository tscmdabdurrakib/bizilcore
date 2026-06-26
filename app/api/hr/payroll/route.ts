import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countWorkingDaysInMonth, getShopForOwner } from "@/lib/hr/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const run = await prisma.payrollRun.findUnique({
    where: { shopId_month_year: { shopId: shop.id, month, year } },
    include: {
      items: {
        include: {
          staff: {
            include: { user: { select: { name: true } } },
          },
        },
      },
    },
  });

  const advances = await prisma.staffAdvance.findMany({
    where: { shopId: shop.id },
    include: { staff: { include: { user: { select: { name: true } } } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ payroll: run, advances });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { action, month, year } = body;

  if (action === "generate") {
    if (!month || !year) return NextResponse.json({ error: "month ও year দিন" }, { status: 400 });

    const existing = await prisma.payrollRun.findUnique({
      where: { shopId_month_year: { shopId: shop.id, month, year } },
    });
    if (existing && existing.status === "finalized") {
      return NextResponse.json({ error: "এই মাসের payroll finalized" }, { status: 400 });
    }

    const staffList = await prisma.staffMember.findMany({
      where: { shopId: shop.id, isActive: true },
      include: { user: { select: { name: true } } },
    });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const workingDays = countWorkingDaysInMonth(year, month);

    const attendances = await prisma.attendance.findMany({
      where: { shopId: shop.id, date: { gte: start, lte: end } },
    });

    const attByStaff = new Map<string, { absent: number; late: number; "half-day": number }>();
    for (const a of attendances) {
      const cur = attByStaff.get(a.staffId) ?? { absent: 0, late: 0, "half-day": 0 };
      if (a.status === "absent") cur.absent++;
      else if (a.status === "late") cur.late++;
      else if (a.status === "half-day") cur["half-day"]++;
      attByStaff.set(a.staffId, cur);
    }

    const advances = await prisma.staffAdvance.findMany({
      where: { shopId: shop.id },
    });
    const advByStaff = new Map<string, number>();
    for (const adv of advances) {
      const unsettled = adv.amount - adv.settled;
      if (unsettled > 0) {
        advByStaff.set(adv.staffId, (advByStaff.get(adv.staffId) ?? 0) + unsettled);
      }
    }

    const items = staffList
      .filter((s) => s.salary && s.salary > 0)
      .map((s) => {
        const baseSalary = s.salary ?? 0;
        const att = attByStaff.get(s.id) ?? { absent: 0, late: 0, "half-day": 0 };
        const perDay = baseSalary / workingDays;
        const absentDeduction = att.absent * perDay;
        const lateDeduction = att.late * (perDay * 0.25);
        const halfDayDeduction = att["half-day"] * (perDay * 0.5);
        const deductions = Math.round(absentDeduction + lateDeduction + halfDayDeduction);
        const advance = Math.round(advByStaff.get(s.id) ?? 0);
        const netPay = Math.max(0, baseSalary - deductions - advance);

        return {
          staffId: s.id,
          baseSalary,
          bonus: 0,
          deductions,
          advance,
          netPay,
          paidAmount: 0,
          status: "pending",
        };
      });

    if (existing) {
      await prisma.payrollItem.deleteMany({ where: { payrollRunId: existing.id } });
      await prisma.payrollItem.createMany({
        data: items.map((i) => ({ ...i, payrollRunId: existing.id })),
      });
      const run = await prisma.payrollRun.findUnique({
        where: { id: existing.id },
        include: {
          items: {
            include: {
              staff: { include: { user: { select: { name: true } } } },
            },
          },
        },
      });
      return NextResponse.json({ payroll: run });
    }

    const run = await prisma.payrollRun.create({
      data: {
        shopId: shop.id,
        month,
        year,
        status: "draft",
        items: { create: items },
      },
      include: {
        items: {
          include: {
            staff: { include: { user: { select: { name: true } } } },
          },
        },
      },
    });

    return NextResponse.json({ payroll: run }, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
