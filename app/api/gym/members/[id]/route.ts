import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });
  const { id } = await params;

  const member = await prisma.member.findFirst({
    where: { id, shopId: shop.id },
    include: {
      plan: true,
      trainer: { select: { id: true, name: true, specialization: true } },
      attendance: { orderBy: { checkIn: "desc" }, take: 60 },
      payments: { orderBy: { paidAt: "desc" } },
      bodyStats: { orderBy: { recordDate: "desc" } },
      trainingSessions: {
        include: { trainer: { select: { name: true } } },
        orderBy: { sessionDate: "desc" },
        take: 20,
      },
    },
  });

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "No shop" }, { status: 404 });
  const { id } = await params;
  const body = await req.json();

  // Handle special actions
  if (body.action === "renew") {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: body.planId } });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    const member = await prisma.member.findFirst({ where: { id, shopId: shop.id } });
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const startFrom = body.fromExpiry && member.membershipEnd && new Date(member.membershipEnd) > new Date()
      ? new Date(member.membershipEnd)
      : new Date();
    const newEnd = new Date(startFrom);
    newEnd.setDate(newEnd.getDate() + plan.duration);

    const updated = await prisma.member.update({
      where: { id },
      data: { membershipStart: startFrom, membershipEnd: newEnd, planId: body.planId, status: "active" },
    });

    if (body.paidAmount && Number(body.paidAmount) > 0) {
      await prisma.memberPayment.create({
        data: {
          shopId: shop.id, memberId: id,
          amount: Number(body.paidAmount), type: "membership",
          method: body.paymentMethod ?? "cash", note: "নবায়ন পেমেন্ট",
        },
      });
      await prisma.member.update({ where: { id }, data: { totalPaid: { increment: Number(body.paidAmount) } } });
    }
    return NextResponse.json(updated);
  }

  if (body.action === "freeze") {
    const member = await prisma.member.findFirst({ where: { id, shopId: shop.id }, include: { plan: true } });
    if (!member || !member.membershipEnd) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const days = Math.min(Number(body.days), member.plan?.maxFreeze ?? 7);
    const newEnd = new Date(member.membershipEnd);
    newEnd.setDate(newEnd.getDate() + days);
    const updated = await prisma.member.update({
      where: { id },
      data: { membershipEnd: newEnd, frozenDays: { increment: days }, status: "frozen" },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "payment") {
    await prisma.memberPayment.create({
      data: {
        shopId: shop.id, memberId: id,
        amount: Number(body.amount), type: body.type ?? "membership",
        method: body.method ?? "cash", note: body.note,
      },
    });
    await prisma.member.update({ where: { id }, data: { totalPaid: { increment: Number(body.amount) } } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "body_stat") {
    const weight = body.weight ? Number(body.weight) : undefined;
    const height = body.height ? Number(body.height) : undefined;
    const bmi = weight && height ? Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10 : undefined;
    const stat = await prisma.bodyStat.create({
      data: {
        memberId: id,
        weight, height, bmi,
        bodyFat: body.bodyFat ? Number(body.bodyFat) : undefined,
        muscle: body.muscle ? Number(body.muscle) : undefined,
        chest: body.chest ? Number(body.chest) : undefined,
        waist: body.waist ? Number(body.waist) : undefined,
        hip: body.hip ? Number(body.hip) : undefined,
        notes: body.notes,
      },
    });
    return NextResponse.json(stat);
  }

  // Generic update
  const { action: _action, ...data } = body;
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
