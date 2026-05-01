import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const packages = await prisma.testPackage.findMany({
    where: { shopId: shop.id },
    include: { tests: { include: { test: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(packages);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const body = await req.json();
  const { name, banglaName, price, testIds } = body;

  if (!name || price === undefined || !Array.isArray(testIds) || testIds.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const pkg = await prisma.testPackage.create({
    data: {
      shopId: shop.id,
      name,
      banglaName,
      price: parseFloat(price),
      tests: {
        create: testIds.map((testId: string) => ({ testId })),
      },
    },
    include: { tests: { include: { test: true } } },
  });
  return NextResponse.json(pkg);
}

export async function PATCH(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "lab") return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const body = await req.json();
  const { id, isActive } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const pkg = await prisma.testPackage.update({
    where: { id },
    data: { isActive },
    include: { tests: { include: { test: true } } },
  });
  return NextResponse.json(pkg);
}
