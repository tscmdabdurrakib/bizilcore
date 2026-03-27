import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "bizilcore-cron";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Expire subscriptions past their end date
  const expired = await prisma.subscription.findMany({
    where: {
      endDate: { lt: now },
      plan: { not: "free" },
      status: { not: "expired" },
    },
  });

  await Promise.all(
    expired.map(sub =>
      prisma.subscription.update({
        where: { id: sub.id },
        data: { plan: "free", status: "expired" },
      })
    )
  );

  // 2. Process referrer rewards: give referrer 1 month Pro if referred user is 7+ days old
  const pendingReferrals = await prisma.referral.findMany({
    where: { rewardGiven: false, createdAt: { lte: sevenDaysAgo } },
    include: { referrer: { include: { subscription: true } } },
  });

  let rewarded = 0;
  for (const ref of pendingReferrals) {
    const referrer = ref.referrer;
    try {
      await prisma.$transaction(async (tx) => {
        const sub = referrer.subscription;
        if (!sub) {
          await tx.subscription.create({
            data: { userId: referrer.id, plan: "pro", status: "active", endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
          });
        } else if (sub.plan === "free" || !sub.endDate || sub.endDate < now) {
          await tx.subscription.update({
            where: { userId: referrer.id },
            data: { plan: "pro", status: "active", endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
          });
        } else {
          const currentEnd = sub.endDate > now ? sub.endDate : now;
          await tx.subscription.update({
            where: { userId: referrer.id },
            data: { endDate: new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000) },
          });
        }
        await tx.referral.update({ where: { id: ref.id }, data: { rewardGiven: true } });
        await tx.notification.create({
          data: {
            userId: referrer.id,
            type: "referral_reward",
            title: "Referral পুরস্কার পেয়েছেন! 🎉",
            body: "আপনার রেফার করা বন্ধু ৭ দিন সক্রিয় হয়েছেন। আপনি ১ মাস Pro plan পেয়েছেন।",
            link: "/settings",
          },
        });
      });
      rewarded++;
    } catch (err) {
      console.error("[Cron] Referrer reward failed for referral", ref.id, err);
    }
  }

  console.log(`[Cron] Subscription check: ${expired.length} checked, ${expired.length} expired. Referrer rewards: ${pendingReferrals.length} pending, ${rewarded} rewarded.`);
  return NextResponse.json({
    subscriptionsExpired: expired.length,
    referrerRewardsPending: pendingReferrals.length,
    referrerRewarded: rewarded,
    timestamp: now.toISOString(),
  });
}
