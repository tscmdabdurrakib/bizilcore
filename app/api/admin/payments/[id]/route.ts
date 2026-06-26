import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionUpgradeEmail } from "@/lib/mailer";
import { activateSubscriptionFromPayment } from "@/lib/payment/activate-subscription";
import { confirmTransaction, getPlatformZiniPayApiKey } from "@/lib/zinipay";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { action, adminNote, plan, months } = body;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (action === "approve") {
    const planToSet = plan || payment.plan;
    const monthsToUse = months || payment.months;

    if (
      payment.status === "pending" &&
      payment.zinipayVerifyId &&
      payment.transactionId &&
      getPlatformZiniPayApiKey()
    ) {
      try {
        await confirmTransaction(getPlatformZiniPayApiKey()!, {
          transactionId: payment.transactionId,
          amount: payment.amount,
          id: payment.zinipayVerifyId,
          invoiceId: payment.id,
        });
      } catch (err) {
        console.error("[AdminPayment] ZiniPay confirm retry failed:", err);
      }
    }

    const { endDate } = await activateSubscriptionFromPayment({
      userId: payment.userId,
      plan: planToSet,
      months: monthsToUse,
      paymentId: payment.id,
      trxId: payment.transactionId ?? payment.id,
      senderPhone: payment.senderPhone,
      status: "approved",
    });

    if (adminNote) {
      await prisma.payment.update({
        where: { id },
        data: { adminNote, verificationNote: "manual_approve" },
      });
    }

    const startDate = new Date();
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    sendSubscriptionUpgradeEmail({
      toEmail: payment.user.email,
      userName: payment.user.name ?? "ব্যবহারকারী",
      plan: planToSet,
      months: monthsToUse,
      amount: payment.amount,
      method: payment.method,
      transactionId: payment.transactionId,
      startDate,
      endDate,
      invoiceNumber,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Payment approved. Plan activated." });
  }

  if (action === "reject") {
    await prisma.payment.update({
      where: { id },
      data: { status: "rejected", adminNote: adminNote || null },
    });
    return NextResponse.json({ success: true, message: "Payment rejected." });
  }

  if (action === "set-plan") {
    if (!plan || !payment.userId) return NextResponse.json({ error: "Plan required" }, { status: 400 });
    const monthsToUse = months || 1;
    const endDate = plan === "free" ? null : new Date(Date.now() + monthsToUse * 30 * 24 * 60 * 60 * 1000);

    await prisma.subscription.upsert({
      where: { userId: payment.userId },
      create: { userId: payment.userId, plan, status: "active", startDate: new Date(), endDate },
      update: { plan, status: plan === "free" ? "active" : "active", endDate },
    });
    return NextResponse.json({ success: true, message: "Plan updated." });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
