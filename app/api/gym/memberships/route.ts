import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const plans = await prisma.membershipPlan.findMany({
    where: { shopId: shop.id },
    include: { _count: { select: { members: true } } },
    orderBy: { price: "asc" },
  });

  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const body = await req.json();
  const plan = await prisma.membershipPlan.create({
    data: {
      shopId: shop.id,
      name: body.name,
      duration: Number(body.duration),
      price: Number(body.price),
      admissionFee: Number(body.admissionFee ?? 0),
      features: body.features ?? [],
      maxFreeze: Number(body.maxFreeze ?? 7),
      isActive: true,
    },
  });
  return NextResponse.json(plan);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const body = await req.json();
  const { id, ...data } = body;
  const plan = await prisma.membershipPlan.update({
    where: { id, shopId: shop.id },
    data: {
      name: data.name,
      duration: Number(data.duration),
      price: Number(data.price),
      admissionFee: Number(data.admissionFee ?? 0),
      features: data.features ?? [],
      maxFreeze: Number(data.maxFreeze ?? 7),
      isActive: data.isActive !== false,
    },
  });
  return NextResponse.json(plan);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.membershipPlan.delete({ where: { id, shopId: shop.id } });
  return NextResponse.json({ ok: true });
}
