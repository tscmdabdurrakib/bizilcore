import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { shopId: shop.id };
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { memberId: { contains: search, mode: "insensitive" } },
    ];
  }

  const members = await prisma.member.findMany({
    where,
    include: {
      plan: { select: { name: true, duration: true } },
      trainer: { select: { name: true } },
      _count: { select: { attendance: true } },
    },
    orderBy: { joinDate: "desc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const body = await req.json();

  // Auto-generate member ID
  const year = new Date().getFullYear();
  const prefix = shop.gymMemberPrefix ?? "GYM";
  const count = await prisma.member.count({ where: { shopId: shop.id } });
  const memberId = `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;

  const member = await prisma.member.create({
    data: {
      shopId: shop.id,
      memberId,
      name: body.name,
      phone: body.phone,
      email: body.email,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      address: body.address,
      emergencyPhone: body.emergencyPhone,
      bloodGroup: body.bloodGroup,
      medicalCondition: body.medicalCondition,
      goals: body.goals,
      notes: body.notes,
      planId: body.planId || undefined,
      trainerId: body.trainerId || undefined,
      membershipStart: body.membershipStart ? new Date(body.membershipStart) : undefined,
      membershipEnd: body.membershipEnd ? new Date(body.membershipEnd) : undefined,
      status: "active",
    },
  });

  // Record initial payment if any
  if (body.paidAmount && Number(body.paidAmount) > 0) {
    await prisma.memberPayment.create({
      data: {
        shopId: shop.id,
        memberId: member.id,
        amount: Number(body.paidAmount),
        type: "membership",
        method: body.paymentMethod ?? "cash",
        note: "ভর্তি পেমেন্ট",
      },
    });
    await prisma.member.update({ where: { id: member.id }, data: { totalPaid: Number(body.paidAmount) } });
  }

  return NextResponse.json(member);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });

  const body = await req.json();
  const { id, ...data } = body;

  const member = await prisma.member.update({
    where: { id, shopId: shop.id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      membershipStart: data.membershipStart ? new Date(data.membershipStart) : undefined,
      membershipEnd: data.membershipEnd ? new Date(data.membershipEnd) : undefined,
    },
  });

  return NextResponse.json(member);
}
