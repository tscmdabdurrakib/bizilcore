import { prisma } from "@/lib/prisma";
import { trackForUser } from "@/lib/activity/trackFromSession";

export interface ActivateSubscriptionParams {
  userId: string;
  plan: string;
  months: number;
  paymentId: string;
  trxId: string;
  senderPhone?: string | null;
  status?: "completed" | "approved";
}

export async function activateSubscriptionFromPayment(params: ActivateSubscriptionParams) {
  const { userId, plan, months, paymentId, trxId, senderPhone, status = "completed" } = params;

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: "active",
        startDate: new Date(),
        endDate,
        autoRenew: false,
      },
      update: {
        plan,
        status: "active",
        startDate: new Date(),
        endDate,
        autoRenew: false,
      },
    }),
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        transactionId: trxId,
        senderPhone: senderPhone ?? undefined,
        verifiedAt: new Date(),
        verificationNote: status === "completed" ? "auto" : undefined,
      },
    }),
  ]);

  const shop = await prisma.shop.findUnique({ where: { userId }, select: { id: true } });
  if (shop) {
    trackForUser(userId, shop.id, {
      actionType: "plan_upgraded",
      actionLabel: `প্ল্যান আপগ্রেড: ${plan}`,
      metadata: { plan, months, payment_id: paymentId },
    }).catch(() => {});
  }

  return { endDate };
}
