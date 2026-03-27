import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function getTodaySalesCash(shopId: string, userId: string): Promise<number> {
  const today = new Date();
  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "income",
      category: "pos_sale",
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

async function getTodayExpenses(shopId: string): Promise<number> {
  const today = new Date();
  const result = await prisma.expense.aggregate({
    where: {
      shopId,
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function GET() {
  const { shop, session } = await requireShop();

  if (shop.businessType !== "retail") {
    return NextResponse.json({ error: "এই API শুধুমাত্র রিটেল শপের জন্য।" }, { status: 403 });
  }

  const today = new Date();
  const register = await prisma.cashRegister.findFirst({
    where: {
      shopId: shop.id,
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!register) {
    return NextResponse.json({ register: null });
  }

  const salesCash = await getTodaySalesCash(shop.id, session.user.id);
  const expenses = await getTodayExpenses(shop.id);
  const expectedCash = register.openingCash + salesCash - expenses;

  return NextResponse.json({
    register,
    salesCash,
    expenses,
    expectedCash,
  });
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();

  if (shop.businessType !== "retail") {
    return NextResponse.json({ error: "এই API শুধুমাত্র রিটেল শপের জন্য।" }, { status: 403 });
  }

  const body = await req.json();

  const openingCash = Number(body.openingCash ?? 0);
  if (isNaN(openingCash) || openingCash < 0) {
    return NextResponse.json({ error: "উদ্বোধনী নগদ শূন্য বা ধনাত্মক হতে হবে।" }, { status: 400 });
  }

  const today = new Date();
  const existing = await prisma.cashRegister.findFirst({
    where: {
      shopId: shop.id,
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "আজকের Cash Register ইতিমধ্যে খোলা হয়েছে।", register: existing }, { status: 409 });
  }

  const register = await prisma.cashRegister.create({
    data: {
      shopId: shop.id,
      date: today,
      openingCash,
      status: "open",
      expectedCash: openingCash,
    },
  });

  return NextResponse.json({ register }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { shop, session } = await requireShop();

  if (shop.businessType !== "retail") {
    return NextResponse.json({ error: "এই API শুধুমাত্র রিটেল শপের জন্য।" }, { status: 403 });
  }

  const body = await req.json();

  const closingCash = Number(body.closingCash ?? 0);
  if (isNaN(closingCash) || closingCash < 0) {
    return NextResponse.json({ error: "সমাপনী নগদ শূন্য বা ধনাত্মক হতে হবে।" }, { status: 400 });
  }

  const today = new Date();
  const register = await prisma.cashRegister.findFirst({
    where: {
      shopId: shop.id,
      date: { gte: startOfDay(today), lte: endOfDay(today) },
      status: "open",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!register) {
    return NextResponse.json({ error: "আজকের কোনো খোলা Cash Register পাওয়া যায়নি।" }, { status: 404 });
  }

  const salesCash = await getTodaySalesCash(shop.id, session.user.id);
  const expenses = await getTodayExpenses(shop.id);
  const expectedCash = register.openingCash + salesCash - expenses;
  const difference = closingCash - expectedCash;

  const updated = await prisma.cashRegister.update({
    where: { id: register.id },
    data: {
      closingCash,
      expectedCash,
      difference,
      status: "closed",
    },
  });

  return NextResponse.json({ register: updated, salesCash, expenses, expectedCash, difference });
}
