import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const trainers = await prisma.gymTrainer.findMany({
    where: { shopId: shop.id },
    include: {
      _count: { select: { members: true, sessions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(trainers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const body = await req.json();
  const trainer = await prisma.gymTrainer.create({
    data: {
      shopId: shop.id,
      name: body.name,
      phone: body.phone,
      specialization: body.specialization,
      certification: body.certification,
      salary: body.salary ? Number(body.salary) : undefined,
      commission: body.commission ? Number(body.commission) : undefined,
      isActive: true,
    },
  });
  return NextResponse.json(trainer);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const body = await req.json();
  const { id, ...data } = body;
  const trainer = await prisma.gymTrainer.update({
    where: { id, shopId: shop.id },
    data: {
      name: data.name,
      phone: data.phone,
      specialization: data.specialization,
      certification: data.certification,
      salary: data.salary ? Number(data.salary) : undefined,
      commission: data.commission ? Number(data.commission) : undefined,
      isActive: data.isActive !== false,
    },
  });
  return NextResponse.json(trainer);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.gymTrainer.update({ where: { id, shopId: shop.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
