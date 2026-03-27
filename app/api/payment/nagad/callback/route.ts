import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  const status = searchParams.get("status");

  const appUrl = (await import("@/lib/app-url")).getAppUrl();

  if (status === "Aborted" || status === "Declined") {
    if (paymentId) await prisma.payment.update({ where: { id: paymentId }, data: { status: "failed" } }).catch(() => {});
    return NextResponse.redirect(`${appUrl}/payment/cancel`);
  }

  if (!paymentId) return NextResponse.redirect(`${appUrl}/payment/cancel`);

  try {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return NextResponse.redirect(`${appUrl}/payment/cancel`);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + payment.months);

    await prisma.subscription.upsert({
      where: { userId: payment.userId },
      create: { userId: payment.userId, plan: payment.plan, status: "active", startDate: new Date(), endDate },
      update: { plan: payment.plan, status: "active", startDate: new Date(), endDate },
    });

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "completed", transactionId: searchParams.get("paymentRefId") ?? "NAGAD-" + paymentId },
    });

    return NextResponse.redirect(`${appUrl}/payment/success?paymentId=${paymentId}&method=nagad`);
  } catch (err) {
    console.error("Nagad callback error:", err);
    return NextResponse.redirect(`${appUrl}/payment/cancel`);
  }
}
