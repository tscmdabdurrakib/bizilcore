import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNagadPayment } from "@/lib/nagad";
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
    data: { userId: session.user.id, amount, method: "nagad", plan, months, status: "pending" },
  });

  const appUrl = getAppUrl();
  const callbackURL = `${appUrl}/api/payment/nagad/callback?paymentId=${payment.id}`;

  if (!process.env.NAGAD_MERCHANT_ID || !process.env.NAGAD_MERCHANT_PRIVATE_KEY) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
    return NextResponse.json({ error: "Nagad payment gateway কনফিগার করা হয়নি। অ্যাডমিনকে জানান।" }, { status: 503 });
  }

  try {
    const { callURL } = await createNagadPayment(amount, payment.id, callbackURL);
    return NextResponse.json({ nagadURL: callURL, paymentId: payment.id });
  } catch (err) {
    console.error("Nagad error:", err);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
    const message = err instanceof Error ? err.message : "Nagad payment শুরু করা যায়নি।";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
