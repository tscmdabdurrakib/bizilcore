import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBkashPayment } from "@/lib/bkash";
import { getPlanAmount, isValidPaidPlan } from "@/lib/pricing";
import { getAppUrl } from "@/lib/app-url";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { plan, months } = body;

  if (!(await isValidPaidPlan(plan)) || ![1, 3, 6].includes(months)) {
    return NextResponse.json({ error: "Invalid plan or duration" }, { status: 400 });
  }

  const amount = await getPlanAmount(plan, months);

  const payment = await prisma.payment.create({
    data: { userId: session.user.id, amount, method: "bkash", plan, months, status: "pending" },
  });

  const appUrl = getAppUrl();
  const callbackURL = `${appUrl}/api/payment/bkash/callback?paymentId=${payment.id}`;

  if (!process.env.BKASH_APP_KEY || !process.env.BKASH_USERNAME) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
    return NextResponse.json({ error: "bKash payment gateway কনফিগার করা হয়নি। অ্যাডমিনকে জানান।" }, { status: 503 });
  }

  try {
    const { bkashURL, paymentID } = await createBkashPayment(amount, payment.id, callbackURL);
    await prisma.payment.update({ where: { id: payment.id }, data: { transactionId: paymentID } });
    return NextResponse.json({ bkashURL, paymentID, paymentId: payment.id });
  } catch (err) {
    console.error("bKash error:", err);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
    const message = err instanceof Error ? err.message : "bKash payment শুরু করা যায়নি।";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
