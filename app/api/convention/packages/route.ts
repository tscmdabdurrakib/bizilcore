import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const packages = await prisma.eventPackage.findMany({
    where: { shopId: shop.id },
    orderBy: { price: "asc" },
  });

  return NextResponse.json(packages);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { name, price, includes, description } = body;

  if (!name || !price) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const pkg = await prisma.eventPackage.create({
    data: {
      shopId: shop.id,
      name,
      price: Number(price),
      includes: includes ?? [],
      description: description ?? null,
    },
  });

  return NextResponse.json(pkg);
}
