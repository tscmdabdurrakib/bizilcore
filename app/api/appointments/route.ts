import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";
import { sendSMS, decryptApiKey } from "@/lib/sms";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();

  if (shop.businessType !== "salon") {
    return NextResponse.json({ error: "এই API শুধুমাত্র সেলুন শপের জন্য।" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const staffId = searchParams.get("staffId");

  let dateFilter: Record<string, Date> = {};
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    dateFilter = { gte: d, lt: next };
  } else if (month && year) {
    const m = parseInt(month);
    const y = parseInt(year);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    dateFilter = { gte: start, lt: end };
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      shopId: shop.id,
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      ...(staffId ? { staffId } : {}),
    },
    include: {
      items: { include: { service: { select: { id: true, name: true } } } },
      customer: { select: { id: true, name: true, phone: true } },
      staff: { select: { id: true, user: { select: { name: true } } } },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const { shop, session } = await requireShop();

  if (shop.businessType !== "salon") {
    return NextResponse.json({ error: "এই API শুধুমাত্র সেলুন শপের জন্য।" }, { status: 403 });
  }

  const body = await req.json();
  const { customerName, customerPhone, customerId, date, startTime, staffId, note, items, isWalkIn } = body;

  if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
    return NextResponse.json({ error: "কাস্টমারের নাম আবশ্যিক।" }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ error: "তারিখ আবশ্যিক।" }, { status: 400 });
  }
  if (!startTime) {
    return NextResponse.json({ error: "শুরুর সময় আবশ্যিক।" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "কমপক্ষে একটি সার্ভিস বেছে নিন।" }, { status: 400 });
  }
  if (!/^\d{2}:\d{2}$/.test(startTime)) {
    return NextResponse.json({ error: "শুরুর সময় HH:MM ফরম্যাটে দিন।" }, { status: 400 });
  }

  if (customerId) {
    const cust = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, shopId: true } });
    if (!cust || cust.shopId !== shop.id) {
      return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি।" }, { status: 400 });
    }
  }

  if (staffId) {
    const staff = await prisma.staffMember.findUnique({ where: { id: staffId }, select: { id: true, shopId: true } });
    if (!staff || staff.shopId !== shop.id) {
      return NextResponse.json({ error: "স্টাফ পাওয়া যায়নি।" }, { status: 400 });
    }
  }

  const rawItems = items as { serviceId?: string; serviceName?: string; price?: number }[];

  const serviceIds = rawItems.filter(i => i.serviceId).map(i => i.serviceId as string);
  let servicesMap: Map<string, { name: string; price: number; commissionRate: number }> = new Map();

  if (serviceIds.length > 0) {
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, shopId: shop.id, isActive: true },
      select: { id: true, name: true, price: true, commissionRate: true },
    });
    servicesMap = new Map(services.map(s => [s.id, s]));
    for (const sid of serviceIds) {
      if (!servicesMap.has(sid)) {
        return NextResponse.json({ error: "এক বা একাধিক সার্ভিস পাওয়া যায়নি বা নিষ্ক্রিয়।" }, { status: 400 });
      }
    }
  }

  const appointmentItems = [];
  for (const item of rawItems) {
    if (item.serviceId) {
      const svc = servicesMap.get(item.serviceId)!;
      appointmentItems.push({
        serviceId: item.serviceId,
        serviceName: svc.name,
        price: svc.price,
        staffCommission: 0,
        commissionPaid: false,
      });
    } else {
      const customName = typeof item.serviceName === "string" && item.serviceName.trim()
        ? item.serviceName.trim()
        : null;
      if (!customName) {
        return NextResponse.json({ error: "কাস্টম সার্ভিসের নাম আবশ্যিক।" }, { status: 400 });
      }
      const customPrice = typeof item.price === "number" ? item.price : NaN;
      if (!Number.isFinite(customPrice) || customPrice < 0) {
        return NextResponse.json({ error: "সার্ভিস মূল্য সঠিক হতে হবে।" }, { status: 400 });
      }
      appointmentItems.push({
        serviceId: null,
        serviceName: customName,
        price: customPrice,
        staffCommission: 0,
        commissionPaid: false,
      });
    }
  }

  const totalAmount = appointmentItems.reduce((s, i) => s + i.price, 0);

  const appointment = await prisma.appointment.create({
    data: {
      shopId: shop.id,
      customerId: customerId ?? null,
      staffId: staffId ?? null,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() ?? null,
      date: new Date(date),
      startTime,
      status: isWalkIn ? "in_progress" : "scheduled",
      note: note?.trim() ?? null,
      totalAmount,
      items: {
        create: appointmentItems,
      },
    },
    include: {
      items: { include: { service: { select: { id: true, name: true } } } },
      staff: { select: { id: true, user: { select: { name: true } } } },
    },
  });

  if (!isWalkIn && customerPhone) {
    try {
      const smsSettings = await prisma.smsSettings.findUnique({ where: { userId: session.user.id } });
      if (smsSettings?.isConnected && smsSettings?.apiKey) {
        const apiKey = decryptApiKey(smsSettings.apiKey);
        const dateStr = new Date(date).toLocaleDateString("bn-BD");
        const msg = `আপনার appointment নিশ্চিত হয়েছে ${dateStr} ${startTime} এ। - ${shop.name}`;
        sendSMS(apiKey, customerPhone, msg).catch(() => {});
      }
    } catch { }
  }

  return NextResponse.json(appointment, { status: 201 });
}
