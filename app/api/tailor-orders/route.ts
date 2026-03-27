import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["received", "cutting", "stitching", "finishing", "ready", "delivered"];
const VALID_FABRIC = ["customer_fabric", "shop_fabric"];

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();

  if (shop.businessType !== "tailor") {
    return NextResponse.json({ error: "এই API শুধুমাত্র দর্জি শপের জন্য।" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const deliveryDate = searchParams.get("deliveryDate");
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const search = searchParams.get("search");

  let dateFilter: Record<string, Date> = {};
  if (deliveryDate) {
    const d = new Date(deliveryDate);
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

  const orders = await prisma.tailorOrder.findMany({
    where: {
      shopId: shop.id,
      ...(status ? { status } : {}),
      ...(Object.keys(dateFilter).length > 0 ? { deliveryDate: dateFilter } : {}),
      ...(search ? {
        OR: [
          { customerName: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
    },
    orderBy: [{ deliveryDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();

  if (shop.businessType !== "tailor") {
    return NextResponse.json({ error: "এই API শুধুমাত্র দর্জি শপের জন্য।" }, { status: 403 });
  }

  const body = await req.json();
  const {
    customerId, customerName, customerPhone,
    description, fabricSource, fabricDetails, measurements, styleImageUrl, notes,
    advanceAmount, totalAmount, deliveryDate,
  } = body;

  if (!customerName || typeof customerName !== "string" || !customerName.trim()) {
    return NextResponse.json({ error: "কাস্টমারের নাম আবশ্যিক।" }, { status: 400 });
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "বিবরণ আবশ্যিক।" }, { status: 400 });
  }
  if (fabricSource && !VALID_FABRIC.includes(fabricSource)) {
    return NextResponse.json({ error: "অবৈধ কাপড়ের উৎস।" }, { status: 400 });
  }

  const adv = typeof advanceAmount === "number" && Number.isFinite(advanceAmount) && advanceAmount >= 0 ? advanceAmount : 0;
  const tot = typeof totalAmount === "number" && Number.isFinite(totalAmount) && totalAmount >= 0 ? totalAmount : 0;
  if (adv > tot) {
    return NextResponse.json({ error: "অগ্রিম পরিমাণ মোটের চেয়ে বেশি হতে পারবে না।" }, { status: 400 });
  }

  if (customerId) {
    const cust = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true, shopId: true } });
    if (!cust || cust.shopId !== shop.id) {
      return NextResponse.json({ error: "কাস্টমার পাওয়া যায়নি।" }, { status: 400 });
    }
  }

  let measurementSnapshot = measurements ?? null;
  if (customerId && !measurements) {
    const m = await prisma.measurement.findUnique({
      where: { shopId_customerId: { shopId: shop.id, customerId } },
    });
    if (m) {
      measurementSnapshot = {
        chest: m.chest, waist: m.waist, hip: m.hip, shoulder: m.shoulder,
        sleeve: m.sleeve, length: m.length, neck: m.neck, inseam: m.inseam,
        notes: m.notes,
      };
    }
  }

  const order = await prisma.tailorOrder.create({
    data: {
      shopId: shop.id,
      customerId: customerId ?? null,
      customerName: customerName.trim(),
      customerPhone: customerPhone?.trim() ?? null,
      description: description.trim(),
      fabricSource: fabricSource ?? "customer_fabric",
      fabricDetails: fabricDetails?.trim() || null,
      measurements: measurementSnapshot,
      styleImageUrl: styleImageUrl?.trim() || null,
      notes: notes?.trim() || null,
      advanceAmount: adv,
      totalAmount: tot,
      dueAmount: Math.max(0, tot - adv),
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      status: "received",
    },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });

  return NextResponse.json(order, { status: 201 });
}
