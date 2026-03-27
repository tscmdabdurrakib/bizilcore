import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = ["hair", "skin", "nail", "makeup", "other"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  if (shop.businessType !== "salon") {
    return NextResponse.json({ error: "এই API শুধুমাত্র সেলুন শপের জন্য।" }, { status: 403 });
  }

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service || service.shopId !== shop.id) {
    return NextResponse.json({ error: "সার্ভিস পাওয়া যায়নি।" }, { status: 404 });
  }

  const body = await req.json();
  const { name, category, price, durationMins, description, isActive, commissionRate, defaultStaffId } = body;

  if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
    return NextResponse.json({ error: "সার্ভিসের নাম আবশ্যিক।" }, { status: 400 });
  }
  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "অবৈধ ক্যাটাগরি।" }, { status: 400 });
  }
  if (price !== undefined && (typeof price !== "number" || price < 0)) {
    return NextResponse.json({ error: "মূল্য শূন্য বা ধনাত্মক হতে হবে।" }, { status: 400 });
  }
  if (durationMins !== undefined && (!Number.isInteger(durationMins) || durationMins <= 0)) {
    return NextResponse.json({ error: "সময়কাল ধনাত্মক পূর্ণসংখ্যা হতে হবে।" }, { status: 400 });
  }
  if (commissionRate !== undefined && (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 1)) {
    return NextResponse.json({ error: "কমিশন রেট 0 থেকে 100% এর মধ্যে হতে হবে।" }, { status: 400 });
  }

  if (defaultStaffId !== undefined && defaultStaffId !== null) {
    const staff = await prisma.staffMember.findUnique({ where: { id: defaultStaffId }, select: { id: true, shopId: true } });
    if (!staff || staff.shopId !== shop.id) {
      return NextResponse.json({ error: "নির্বাচিত স্টাফ পাওয়া যায়নি।" }, { status: 400 });
    }
  }

  const updated = await prisma.service.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(durationMins !== undefined ? { durationMins } : {}),
      ...(description !== undefined ? { description: description?.trim() ?? null } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(commissionRate !== undefined ? { commissionRate } : {}),
      ...(defaultStaffId !== undefined ? { defaultStaffId: defaultStaffId ?? null } : {}),
    },
    include: { defaultStaff: { select: { id: true, user: { select: { name: true } } } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  if (shop.businessType !== "salon") {
    return NextResponse.json({ error: "এই API শুধুমাত্র সেলুন শপের জন্য।" }, { status: 403 });
  }

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service || service.shopId !== shop.id) {
    return NextResponse.json({ error: "সার্ভিস পাওয়া যায়নি।" }, { status: 404 });
  }

  const usedInAppointments = await prisma.appointmentItem.count({ where: { serviceId: id } });
  if (usedInAppointments > 0) {
    return NextResponse.json(
      { error: "এই সার্ভিসটি অ্যাপয়েন্টমেন্টে ব্যবহৃত হয়েছে। মুছতে পারবেন না — পরিবর্তে নিষ্ক্রিয় করুন।" },
      { status: 409 }
    );
  }

  await prisma.service.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
