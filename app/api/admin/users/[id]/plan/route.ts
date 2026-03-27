import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionUpgradeEmail } from "@/lib/mailer";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  if (!admin?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: userId } = await params;
  const { plan, months } = await req.json();

  if (!["free", "pro", "business"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const monthsNum = Number(months) || 1;
  const startDate = new Date();
  const endDate = plan === "free" ? null : new Date(Date.now() + monthsNum * 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan, status: "active", startDate, endDate },
    update: { plan, status: "active", startDate, endDate },
  });

  if (plan !== "free") {
    const invoiceNumber = `INV-ADM-${Date.now().toString(36).toUpperCase()}`;
    sendSubscriptionUpgradeEmail({
      toEmail: targetUser.email,
      userName: targetUser.name ?? "ব্যবহারকারী",
      plan,
      months: monthsNum,
      amount: 0,
      method: "admin",
      transactionId: null,
      startDate,
      endDate,
      invoiceNumber,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
