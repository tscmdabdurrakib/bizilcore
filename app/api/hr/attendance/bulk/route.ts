import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getShopForOwner, parseAttendanceTime } from "@/lib/hr/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForOwner(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { date, records } = body as {
    date: string;
    records: { staffId: string; status: string; checkIn?: string; checkOut?: string; notes?: string }[];
  };

  if (!date || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "date ও records দিন" }, { status: 400 });
  }

  const dateStr = date.slice(0, 10);
  const dateObj = new Date(dateStr);

  const results = await Promise.all(
    records.map((r) =>
      prisma.attendance.upsert({
        where: { staffId_date: { staffId: r.staffId, date: dateObj } },
        create: {
          shopId: shop.id,
          staffId: r.staffId,
          date: dateObj,
          status: r.status,
          checkIn: parseAttendanceTime(r.checkIn, dateStr),
          checkOut: parseAttendanceTime(r.checkOut, dateStr),
          notes: r.notes || null,
        },
        update: {
          status: r.status,
          checkIn: parseAttendanceTime(r.checkIn, dateStr),
          checkOut: parseAttendanceTime(r.checkOut, dateStr),
          notes: r.notes || null,
        },
      }),
    ),
  );

  return NextResponse.json({ saved: results.length }, { status: 201 });
}
