import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by cron or manually: rewards referrers whose referred user is 7+ days old
export async function GET() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Find unrewarded referrals where referred user was created 7+ days ago
    const pending = await prisma.referral.findMany({
      where: {
        rewardGiven: false,
        createdAt: { lte: sevenDaysAgo },
      },
      include: {
        referrer: { include: { subscription: true } },
      },
    });

    let rewarded = 0;

    for (const ref of pending) {
      const referrer = ref.referrer;
      const now = new Date();

      try {
        await prisma.$transaction(async (tx) => {
          const sub = referrer.subscription;

          if (!sub) {
            // Create 1 month pro for referrer
            await tx.subscription.create({
              data: {
                userId: referrer.id,
                plan: "pro",
                status: "active",
                endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          } else if (sub.plan === "free" || !sub.endDate || sub.endDate < now) {
            // Upgrade to pro for 1 month
            await tx.subscription.update({
              where: { userId: referrer.id },
              data: {
                plan: "pro",
                status: "active",
                endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          } else {
            // Already on pro/business — extend by 30 days
            const currentEnd = sub.endDate > now ? sub.endDate : now;
            await tx.subscription.update({
              where: { userId: referrer.id },
              data: {
                endDate: new Date(currentEnd.getTime() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          }

          await tx.referral.update({
            where: { id: ref.id },
            data: { rewardGiven: true },
          });

          // Notify referrer
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
        console.error("[ReferrerRewards] Failed for referral", ref.id, err);
      }
    }

    console.log(`[ReferrerRewards] Processed ${pending.length} pending, rewarded ${rewarded}`);
    return NextResponse.json({ processed: pending.length, rewarded });
  } catch (err) {
    console.error("[ReferrerRewards] Error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
