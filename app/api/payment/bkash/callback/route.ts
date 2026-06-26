import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeBkashPayment } from "@/lib/bkash";
import { activateSubscriptionFromPayment } from "@/lib/payment/activate-subscription";

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
      await activateSubscriptionFromPayment({
        userId: payment.userId,
        plan: payment.plan,
        months: payment.months,
        paymentId: payment.id,
        trxId: result.trxID ?? bkashPaymentId,
        status: "completed",
      });
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
