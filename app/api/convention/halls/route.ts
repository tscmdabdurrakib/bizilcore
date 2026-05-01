import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const halls = await prisma.hall.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "asc" },
  });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const todayBookings = await prisma.hallEvent.findMany({
    where: {
      shopId: shop.id,
      eventDate: { gte: today, lt: tomorrow },
      status: { not: "cancelled" },
    },
    select: { hallId: true },
  });

  const bookedHallIds = new Set(todayBookings.map((b) => b.hallId));

  return NextResponse.json(
    halls.map((h) => ({ ...h, todayStatus: bookedHallIds.has(h.id) ? "booked" : "available" }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { name, capacity, ratePerDay, ratePerHour, rateHalfDay, amenities, floorArea, description, imageUrl } = body;

  if (!name || !capacity || !ratePerDay) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const hall = await prisma.hall.create({
    data: {
      shopId: shop.id,
      name,
      capacity: Number(capacity),
      ratePerDay: Number(ratePerDay),
      ratePerHour: ratePerHour ? Number(ratePerHour) : null,
      rateHalfDay: rateHalfDay ? Number(rateHalfDay) : null,
      amenities: amenities ?? [],
      floorArea: floorArea ?? null,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
    },
  });

  return NextResponse.json(hall);
}
