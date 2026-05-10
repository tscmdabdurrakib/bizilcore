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

    const todayDateStr = today.toISOString().split("T")[0];

    const [
      todayAppts,
      rooms,
      totalStaff,
      monthRevenue,
      todayApptDetails,
      roomsWithAppts,
    ] = await Promise.all([
      prisma.appointment.count({
        where: {
          shopId: shop.id,
          date: { gte: today, lt: tomorrow },
          status: { not: "cancelled" },
        },
      }),
      prisma.treatmentRoom.findMany({
        where: { shopId: shop.id, isActive: true },
        include: {
          appointments: {
            where: {
              date: { gte: today, lt: tomorrow },
              status: { in: ["confirmed", "in_progress"] },
            },
            include: { customer: { select: { name: true } } },
            orderBy: { startTime: "asc" },
            take: 1,
          },
        },
      }),
      prisma.staffMember.count({
        where: { shopId: shop.id, isActive: true },
      }),
      prisma.appointment.aggregate({
        where: {
          shopId: shop.id,
          status: "completed",
          createdAt: { gte: monthStart },
        },
        _sum: { totalAmount: true },
      }),
      prisma.appointment.findMany({
        where: {
          shopId: shop.id,
          date: { gte: today, lt: tomorrow },
          status: { not: "cancelled" },
        },
        include: {
          staff: { select: { user: { select: { name: true } } } },
          room: { select: { name: true } },
          items: { select: { serviceName: true } },
        },
        orderBy: { startTime: "asc" },
        take: 20,
      }),
      prisma.appointment.findMany({
        where: {
          shopId: shop.id,
          date: { gte: today, lt: tomorrow },
          status: "in_progress",
          roomId: { not: null },
        },
        select: { roomId: true },
      }),
    ]);

    const occupiedRoomIds = new Set(roomsWithAppts.map((a) => a.roomId));

    const roomStatus = rooms.map((room) => {
      const currentAppt = room.appointments[0];
      const isOccupied = occupiedRoomIds.has(room.id);
      return {
        id: room.id,
        name: room.name,
        type: room.type,
        capacity: room.capacity,
        status: isOccupied ? "in_session" : "available",
        currentClient: currentAppt?.customerName ?? null,
      };
    });

    const occupiedCount = roomStatus.filter((r) => r.status === "in_session").length;

    const staffInSession = await prisma.appointment.findMany({
      where: {
        shopId: shop.id,
        date: { gte: today, lt: tomorrow },
        status: "in_progress",
        staffId: { not: null },
      },
      select: { staffId: true },
      distinct: ["staffId"],
    });
    const busyStaffIds = new Set(staffInSession.map((a) => a.staffId));
    const availableTherapists = totalStaff - busyStaffIds.size;

    const timeline = todayApptDetails.map((a) => ({
      id: a.id,
      startTime: a.startTime,
      endTime: a.endTime,
      customerName: a.customerName,
      customerPhone: a.customerPhone,
      status: a.status,
      totalAmount: a.totalAmount,
      therapist: a.staff?.user?.name ?? null,
      room: a.room?.name ?? null,
      services: a.items.map((i) => i.serviceName),
    }));

    return NextResponse.json({
      todayAppts,
      availableTherapists,
      roomOccupancy: { occupied: occupiedCount, total: rooms.length },
      monthRevenue: monthRevenue._sum.totalAmount ?? 0,
      roomStatus,
      timeline,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
