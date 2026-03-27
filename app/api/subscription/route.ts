import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let sub = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  });

  if (!sub) {
    sub = await prisma.subscription.create({
      data: { userId: session.user.id, plan: "free", status: "active" },
    });
  }

  // Auto-check expiry
  if (sub.endDate && sub.endDate < new Date() && sub.plan !== "free") {
    sub = await prisma.subscription.update({
      where: { id: sub.id },
      data: { plan: "free", status: "expired" },
    });
  }

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const daysLeft = sub.endDate
    ? Math.max(0, Math.ceil((sub.endDate.getTime() - Date.now()) / 86400000))
    : null;

  return NextResponse.json({ subscription: sub, payments, daysLeft });
}
