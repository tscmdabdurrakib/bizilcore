import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { shop } = await requireShop();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const staff = await prisma.staffMember.findMany({
      where: { shopId: shop.id, isActive: true },
      include: {
        user: { select: { name: true, email: true } },
        appointments: {
          where: { date: { gte: monthStart } },
          select: { id: true, totalAmount: true, status: true, date: true, startTime: true },
        },
      },
      orderBy: { invitedAt: "asc" },
    });

    const therapists = staff.map((s) => {
      const completedAppts = s.appointments.filter((a) => a.status === "completed");
      const todayAppts = s.appointments.filter((a) => {
        const d = new Date(a.date);
        return d >= today && d < tomorrow;
      });
      const inSession = todayAppts.some((a) => a.status === "in_progress");
      return {
        id: s.id,
        name: s.user.name,
        email: s.user.email,
        jobTitle: s.jobTitle,
        phone: s.phone,
        isActive: s.isActive,
        monthSessions: completedAppts.length,
        monthRevenue: completedAppts.reduce((sum, a) => sum + a.totalAmount, 0),
        todaySessions: todayAppts.length,
        status: inSession ? "in_session" : "available",
        todaySchedule: todayAppts
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((a) => ({ time: a.startTime, status: a.status })),
      };
    });

    return NextResponse.json(therapists);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
