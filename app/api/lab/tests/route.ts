import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const includePackages = searchParams.get("packages") === "1";

  const where: Record<string, unknown> = { shopId: shop.id };
  if (category && category !== "all") where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortCode: { contains: search, mode: "insensitive" } },
      { banglaName: { contains: search, mode: "insensitive" } },
    ];
  }

  if (includePackages) {
    const [tests, packages] = await Promise.all([
      prisma.labTest.findMany({ where, orderBy: { name: "asc" } }),
      prisma.testPackage.findMany({
        where: { shopId: shop.id, isActive: true },
        include: { tests: { include: { test: true } } },
        orderBy: { name: "asc" },
      }),
    ]);
    return NextResponse.json({ tests, packages });
  }

  const tests = await prisma.labTest.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json(tests);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const body = await req.json();
  const {
    name, banglaName, shortCode, category, price,
    homeCollectionPrice, turnaroundHours, sampleType,
    normalRangeMale, normalRangeFemale, unit, isActive,
  } = body;

  if (!name || !shortCode || !category || price === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await prisma.labTest.findUnique({ where: { shopId_shortCode: { shopId: shop.id, shortCode } } });
  if (existing) return NextResponse.json({ error: "Short code already exists" }, { status: 400 });

  const test = await prisma.labTest.create({
    data: {
      shopId: shop.id, name, banglaName, shortCode: shortCode.toUpperCase(),
      category, price: parseFloat(price),
      homeCollectionPrice: homeCollectionPrice ? parseFloat(homeCollectionPrice) : null,
      turnaroundHours: parseInt(turnaroundHours) || 24,
      sampleType, normalRangeMale, normalRangeFemale, unit,
      isActive: isActive !== false,
    },
  });
  return NextResponse.json(test);
}

export async function PATCH(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (data.price !== undefined) data.price = parseFloat(data.price);
  if (data.homeCollectionPrice !== undefined) data.homeCollectionPrice = data.homeCollectionPrice ? parseFloat(data.homeCollectionPrice) : null;
  if (data.turnaroundHours !== undefined) data.turnaroundHours = parseInt(data.turnaroundHours);
  if (data.shortCode) data.shortCode = data.shortCode.toUpperCase();

  const test = await prisma.labTest.update({ where: { id }, data });
  return NextResponse.json(test);
}
