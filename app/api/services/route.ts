import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = ["hair", "skin", "nail", "makeup", "other"];

export async function GET() {
  const { shop } = await requireShop();

  if (shop.businessType !== "salon") {
    return NextResponse.json({ error: "এই API শুধুমাত্র সেলুন শপের জন্য।" }, { status: 403 });
  }

  const services = await prisma.service.findMany({
    where: { shopId: shop.id },
    include: { defaultStaff: { select: { id: true, user: { select: { name: true } } } } },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();

  if (shop.businessType !== "salon") {
    return NextResponse.json({ error: "এই API শুধুমাত্র সেলুন শপের জন্য।" }, { status: 403 });
  }

  const body = await req.json();
  const { name, category, price, durationMins, description, commissionRate, defaultStaffId } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "সার্ভিসের নাম আবশ্যিক।" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "অবৈধ ক্যাটাগরি।" }, { status: 400 });
  }
  if (typeof price !== "number" || price < 0) {
    return NextResponse.json({ error: "মূল্য শূন্য বা ধনাত্মক হতে হবে।" }, { status: 400 });
  }
  if (!Number.isInteger(durationMins) || durationMins <= 0) {
    return NextResponse.json({ error: "সময়কাল ধনাত্মক পূর্ণসংখ্যা হতে হবে।" }, { status: 400 });
  }

  if (defaultStaffId) {
    const staff = await prisma.staffMember.findUnique({ where: { id: defaultStaffId }, select: { id: true, shopId: true } });
    if (!staff || staff.shopId !== shop.id) {
      return NextResponse.json({ error: "নির্বাচিত স্টাফ পাওয়া যায়নি।" }, { status: 400 });
    }
  }

  const resolvedRate = typeof commissionRate === "number" ? commissionRate : 0.30;
  if (resolvedRate < 0 || resolvedRate > 1) {
    return NextResponse.json({ error: "কমিশন রেট 0 থেকে 100% এর মধ্যে হতে হবে।" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      shopId: shop.id,
      name: name.trim(),
      category,
      price,
      durationMins,
      description: description?.trim() ?? null,
      commissionRate: resolvedRate,
      defaultStaffId: defaultStaffId ?? null,
    },
    include: { defaultStaff: { select: { id: true, user: { select: { name: true } } } } },
  });

  return NextResponse.json(service, { status: 201 });
}
