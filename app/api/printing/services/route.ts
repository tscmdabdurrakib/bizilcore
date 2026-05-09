import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const services = await prisma.printService.findMany({
    where: {
      shopId: shop.id,
      ...(category && category !== "all" ? { category } : {}),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const { shop } = await requireShop();
  const body = await req.json();
  const { name, category, unit, pricePerUnit, minQuantity, description } = body;

  if (!name || !category || !unit || pricePerUnit == null) {
    return NextResponse.json({ error: "নাম, ক্যাটাগরি, ইউনিট ও মূল্য আবশ্যক" }, { status: 400 });
  }

  const service = await prisma.printService.create({
    data: {
      shopId: shop.id,
      name,
      category,
      unit,
      pricePerUnit: Number(pricePerUnit),
      minQuantity: Number(minQuantity ?? 100),
      description: description ?? null,
      isActive: true,
    },
  });

  return NextResponse.json(service);
}
