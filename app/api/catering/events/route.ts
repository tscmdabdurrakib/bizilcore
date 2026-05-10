import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status") || "";
  const filter   = searchParams.get("filter") || "";

  const now       = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const in7Days   = new Date(now); in7Days.setDate(now.getDate() + 7);

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status) where.status = status;
  if (filter === "thisMonth")  { where.eventDate = { gte: monthStart, lte: monthEnd }; }
  if (filter === "upcoming")   { where.eventDate = { gte: now, lte: in7Days }; }
  if (filter === "preparation"){ where.status = "preparation"; }
  if (filter === "completed")  { where.status = "completed"; }

  const events = await prisma.cateringEvent.findMany({
    where,
    include: {
      template: { select: { id: true, name: true } },
      customItems: true,
      payments: { orderBy: { paidAt: "desc" } },
      _count: { select: { customItems: true, payments: true } },
    },
    orderBy: { eventDate: "asc" },
    take: 100,
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  const body = await req.json();

  const {
    clientName, clientPhone, clientAddress,
    eventType, eventDate, eventTime, venue, guestCount, mealTypes,
    templateId, customItems = [],
    perHeadCost, totalCost, totalAmount,
    advancePaid, staffNeeded, equipmentNote, notes,
    customerId,
  } = body;

  if (!clientName || !clientPhone || !eventType || !eventDate || !venue || !guestCount || !totalAmount) {
    return NextResponse.json({ error: "প্রয়োজনীয় তথ্য অপূর্ণ" }, { status: 400 });
  }

  const prefix = shop.cateringBookingPrefix ?? "CAT";
  const year   = new Date().getFullYear();
  const count  = await prisma.cateringEvent.count({ where: { shopId: shop.id } });
  const bookingNumber = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

  const profit   = Number(totalAmount) - Number(totalCost ?? 0);
  const dueAmount = Number(totalAmount) - Number(advancePaid ?? 0);

  const autoChecklist = [
    { id: "1", text: "Menu confirm করা হয়েছে",        done: false },
    { id: "2", text: "Ingredients কেনা হয়েছে",         done: false },
    { id: "3", text: "Staff confirmed",                  done: false },
    { id: "4", text: "Equipment ready",                  done: false },
    { id: "5", text: "Venue contact নেওয়া হয়েছে",      done: false },
    { id: "6", text: "সময়মতো পৌঁছানো",                 done: false },
  ];

  const event = await prisma.cateringEvent.create({
    data: {
      shopId:       shop.id,
      bookingNumber,
      customerId:   customerId || null,
      clientName,
      clientPhone,
      clientAddress: clientAddress || null,
      eventType,
      eventDate:    new Date(eventDate),
      eventTime:    eventTime || null,
      venue,
      guestCount:   Number(guestCount),
      mealTypes:    mealTypes ?? [],
      templateId:   templateId || null,
      perHeadCost:  Number(perHeadCost ?? 0),
      totalCost:    Number(totalCost ?? 0),
      totalAmount:  Number(totalAmount),
      profit,
      advancePaid:  Number(advancePaid ?? 0),
      dueAmount,
      staffNeeded:  staffNeeded ? Number(staffNeeded) : null,
      equipmentNote: equipmentNote || null,
      status:       "confirmed",
      checklist:    autoChecklist,
      notes:        notes || null,
      customItems: {
        create: customItems.map((i: { itemName: string; category: string; perHeadCost: number; quantity?: string }) => ({
          itemName:    i.itemName,
          category:    i.category,
          perHeadCost: Number(i.perHeadCost) || 0,
          quantity:    i.quantity || null,
          subtotal:    (Number(i.perHeadCost) || 0) * Number(guestCount),
        })),
      },
    },
    include: { customItems: true, template: true },
  });

  return NextResponse.json(event, { status: 201 });
}
