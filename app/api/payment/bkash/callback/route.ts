import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeBkashPayment } from "@/lib/bkash";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  const paymentID = searchParams.get("paymentID");
  const status = searchParams.get("status");

  const appUrl = (await import("@/lib/app-url")).getAppUrl();

  if (status === "cancel" || status === "failure") {
    if (paymentId) await prisma.payment.update({ where: { id: paymentId }, data: { status: "failed" } }).catch(() => {});
    return NextResponse.redirect(`${appUrl}/payment/cancel`);
  }

  if (!paymentId) return NextResponse.redirect(`${appUrl}/payment/cancel`);

  try {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return NextResponse.redirect(`${appUrl}/payment/cancel`);

    const bkashPaymentId = paymentID ?? payment.transactionId;
    if (!bkashPaymentId) throw new Error("No bKash payment ID");

    const result = await executeBkashPayment(bkashPaymentId);

    if (result.statusCode === "0000") {
      await activateSubscription(payment.userId, payment.plan, payment.months, payment.id, result.trxID ?? bkashPaymentId);
      return NextResponse.redirect(`${appUrl}/payment/success?paymentId=${paymentId}&method=bkash`);
    } else {
      await prisma.payment.update({ where: { id: paymentId }, data: { status: "failed" } });
      return NextResponse.redirect(`${appUrl}/payment/cancel`);
    }
  } catch (err) {
    console.error("bKash callback error:", err);
    return NextResponse.redirect(`${appUrl}/payment/cancel`);
  }
}


async function activateSubscription(userId: string, plan: string, months: number, paymentId: string, trxId: string) {
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  await prisma.subscription.upsert({
    where: { userId },
    create: { userId, plan, status: "active", startDate: new Date(), endDate, autoRenew: false },
    update: { plan, status: "active", startDate: new Date(), endDate, autoRenew: false },
  });

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "completed", transactionId: trxId },
  });
}
