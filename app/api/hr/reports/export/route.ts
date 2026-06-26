import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOwnerPlan, getShopForOwner } from "@/lib/hr/server";
import { canAccessFeature } from "@/lib/features";

function csvEscape(val: string | number | null | undefined) {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await getOwnerPlan(session.user.id);
  if (!canAccessFeature(plan, "export")) {
    return NextResponse.json({ error: "Export Pro+ প্ল্যানে available" }, { status: 403 });
  }

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "attendance";
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1));
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);

  let csv = "";
  let filename = `hr-${type}-${year}-${month}.csv`;

  if (type === "attendance") {
    const rows = await prisma.attendance.findMany({
      where: { shopId: shop.id, date: { gte: start, lte: end } },
      include: { staff: { include: { user: { select: { name: true } } } } },
      orderBy: { date: "asc" },
    });
    csv = "Date,Staff,Status,Check In,Check Out,Notes\n";
    for (const r of rows) {
      csv += [
        csvEscape(r.date.toISOString().slice(0, 10)),
        csvEscape(r.staff.user.name),
        csvEscape(r.status),
        csvEscape(r.checkIn?.toISOString() ?? ""),
        csvEscape(r.checkOut?.toISOString() ?? ""),
        csvEscape(r.notes),
      ].join(",") + "\n";
    }
  } else if (type === "leave") {
    const rows = await prisma.leaveRequest.findMany({
      where: { shopId: shop.id },
      include: { staff: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    csv = "Staff,Type,Start,End,Status,Reason\n";
    for (const r of rows) {
      csv += [
        csvEscape(r.staff.user.name),
        csvEscape(r.type),
        csvEscape(r.startDate.toISOString().slice(0, 10)),
        csvEscape(r.endDate.toISOString().slice(0, 10)),
        csvEscape(r.status),
        csvEscape(r.reason),
      ].join(",") + "\n";
    }
  } else if (type === "payroll") {
    const run = await prisma.payrollRun.findUnique({
      where: { shopId_month_year: { shopId: shop.id, month, year } },
      include: {
        items: {
          include: { staff: { include: { user: { select: { name: true } } } } },
        },
      },
    });
    csv = "Staff,Base Salary,Bonus,Deductions,Advance,Net Pay,Paid,Status\n";
    for (const i of run?.items ?? []) {
      csv += [
        csvEscape(i.staff.user.name),
        csvEscape(i.baseSalary),
        csvEscape(i.bonus),
        csvEscape(i.deductions),
        csvEscape(i.advance),
        csvEscape(i.netPay),
        csvEscape(i.paidAmount),
        csvEscape(i.status),
      ].join(",") + "\n";
    }
  } else if (type === "summary") {
    const [staffCount, attendances, leaveCount, payroll] = await Promise.all([
      prisma.staffMember.count({ where: { shopId: shop.id, isActive: true } }),
      prisma.attendance.findMany({
        where: { shopId: shop.id, date: { gte: start, lte: end } },
      }),
      prisma.leaveRequest.count({
        where: { shopId: shop.id, status: "approved", startDate: { lte: end }, endDate: { gte: start } },
      }),
      prisma.payrollRun.findUnique({
        where: { shopId_month_year: { shopId: shop.id, month, year } },
        include: { items: true },
      }),
    ]);
    const present = attendances.filter((a) => a.status === "present").length;
    const absent = attendances.filter((a) => a.status === "absent").length;
    const totalPayroll = payroll?.items.reduce((s, i) => s + i.netPay, 0) ?? 0;
    const totalPaid = payroll?.items.reduce((s, i) => s + i.paidAmount, 0) ?? 0;

    return NextResponse.json({
      summary: {
        month,
        year,
        staffCount,
        present,
        absent,
        leaveCount,
        totalPayroll,
        totalPaid,
        pendingPayroll: totalPayroll - totalPaid,
      },
    });
  } else {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
