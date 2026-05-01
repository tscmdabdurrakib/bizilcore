import { prisma } from "@/lib/prisma";

export const BADGES = [
  { key: "first_login",      title: "প্রথম পদক্ষেপ",     desc: "প্রথমবার লগইন করলেন",           icon: "👋", xp: 10  },
  { key: "profile_complete", title: "পরিপূর্ণ প্রোফাইল",  desc: "Shop profile সম্পূর্ণ করলেন",   icon: "✅", xp: 20  },
  { key: "first_product",    title: "প্রথম পণ্য",          desc: "প্রথম পণ্য যোগ করলেন",          icon: "📦", xp: 30  },
  { key: "first_sale",       title: "প্রথম বিক্রি",        desc: "প্রথম অর্ডার পেলেন",             icon: "🎉", xp: 50  },
  { key: "orders_10",        title: "সক্রিয় বিক্রেতা",    desc: "১০টি অর্ডার সম্পন্ন",            icon: "⭐", xp: 100 },
  { key: "orders_100",       title: "শত অর্ডার",           desc: "১০০টি অর্ডার সম্পন্ন",           icon: "👑", xp: 300 },
  { key: "orders_1000",      title: "হাজার অর্ডার",        desc: "১০০০টি অর্ডার — অসাধারণ!",       icon: "🚀", xp: 1000},
  { key: "revenue_50k",      title: "পঞ্চাশ হাজার",        desc: "মোট বিক্রি ৳৫০,০০০ ছাড়াল",      icon: "💵", xp: 200 },
  { key: "revenue_1lakh",    title: "লক্ষপতি",             desc: "মোট বিক্রি ৳১,০০,০০০ ছাড়াল",    icon: "💰", xp: 500 },
  { key: "streak_7",         title: "৭ দিন সক্রিয়",       desc: "টানা ৭ দিন লগইন করলেন",          icon: "🔥", xp: 50  },
  { key: "streak_30",        title: "মাসব্যাপী সক্রিয়",   desc: "টানা ৩০ দিন active",             icon: "🏆", xp: 200 },
  { key: "first_referral",   title: "বন্ধু আনলেন",         desc: "প্রথম referral সফল হয়েছে",       icon: "🤝", xp: 100 },
  { key: "referrals_5",      title: "দলনেতা",              desc: "৫ জনকে refer করলেন",             icon: "👥", xp: 300 },
  { key: "pro_upgrade",      title: "Pro সদস্য",           desc: "Pro plan এ upgrade করলেন",        icon: "💎", xp: 150 },
] as const;

export type BadgeKey = typeof BADGES[number]["key"];

const LEVELS = [
  { min: 0,    max: 99,   label: "নতুন বিক্রেতা"  },
  { min: 100,  max: 299,  label: "সক্রিয় বিক্রেতা" },
  { min: 300,  max: 699,  label: "দক্ষ বিক্রেতা"   },
  { min: 700,  max: 1499, label: "অভিজ্ঞ বিক্রেতা"  },
  { min: 1500, max: Infinity, label: "শীর্ষ বিক্রেতা" },
];

export function getLevelFromXp(xp: number): string {
  return LEVELS.find(l => xp >= l.min && xp <= l.max)?.label ?? "নতুন বিক্রেতা";
}

export function getNextLevelXp(xp: number): number {
  const next = LEVELS.find(l => xp < l.min);
  return next ? next.min : 9999;
}

type Trigger =
  | "login"
  | "product_added"
  | "order_created"
  | "order_completed"
  | "revenue_updated"
  | "referral_success"
  | "plan_upgraded"
  | "profile_complete";

export async function checkAndAwardBadges(
  userId: string,
  trigger: Trigger = "order_created"
): Promise<Array<{ key: string; title: string; desc: string; icon: string; xp: number }>> {
  try {
    const [user, earnedRows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          streak: true,
          xpPoints: true,
          totalOrders: true,
        },
      }),
      prisma.userBadge.findMany({ where: { userId }, select: { badgeKey: true } }),
    ]);

    if (!user) return [];

    const earned = new Set(earnedRows.map(r => r.badgeKey));

    const shop = await prisma.shop.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        _count: { select: { products: true } },
      },
    });

    const revenueResult = await prisma.order.aggregate({
      where: { userId, status: "delivered" },
      _sum: { totalAmount: true },
    });
    const revenue = revenueResult._sum.totalAmount ?? 0;

    const referralCount = await prisma.referral.count({
      where: { referrerId: userId, status: "completed" },
    }).catch(() => 0);

    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      select: { plan: true },
    }).catch(() => null);

    const conditions: Record<string, boolean> = {
      first_login:      true,
      profile_complete: !!(shop?.name && (shop?.phone || shop?.address)),
      first_product:    (shop?._count.products ?? 0) >= 1,
      first_sale:       (user.totalOrders ?? 0) >= 1,
      orders_10:        (user.totalOrders ?? 0) >= 10,
      orders_100:       (user.totalOrders ?? 0) >= 100,
      orders_1000:      (user.totalOrders ?? 0) >= 1000,
      revenue_50k:      revenue >= 50000,
      revenue_1lakh:    revenue >= 100000,
      streak_7:         (user.streak ?? 0) >= 7,
      streak_30:        (user.streak ?? 0) >= 30,
      first_referral:   referralCount >= 1,
      referrals_5:      referralCount >= 5,
      pro_upgrade:      subscription?.plan === "pro" || subscription?.plan === "advanced",
    };

    const relevant: Record<Trigger, string[]> = {
      login:            ["first_login", "streak_7", "streak_30"],
      product_added:    ["first_product"],
      order_created:    ["first_sale", "orders_10", "orders_100", "orders_1000"],
      order_completed:  ["first_sale", "orders_10", "orders_100", "orders_1000", "revenue_50k", "revenue_1lakh"],
      revenue_updated:  ["revenue_50k", "revenue_1lakh"],
      referral_success: ["first_referral", "referrals_5"],
      plan_upgraded:    ["pro_upgrade"],
      profile_complete: ["profile_complete"],
    };

    const toCheck = relevant[trigger] ?? [];
    const newBadges: Array<{ key: string; title: string; desc: string; icon: string; xp: number }> = [];

    for (const badgeKey of toCheck) {
      if (earned.has(badgeKey)) continue;
      if (!conditions[badgeKey]) continue;
      const meta = BADGES.find(b => b.key === badgeKey);
      if (!meta) continue;
      newBadges.push({ key: badgeKey, title: meta.title, desc: meta.desc, icon: meta.icon, xp: meta.xp });
    }

    if (newBadges.length > 0) {
      const totalXpGain = newBadges.reduce((s, b) => s + b.xp, 0);
      const newXp = (user.xpPoints ?? 0) + totalXpGain;
      const newLevel = getLevelFromXp(newXp);

      await prisma.$transaction([
        prisma.userBadge.createMany({
          data: newBadges.map(b => ({ userId, badgeKey: b.key })),
          skipDuplicates: true,
        }),
        prisma.user.update({
          where: { id: userId },
          data: { xpPoints: newXp, level: newLevel },
        }),
      ]);
    }

    return newBadges;
  } catch {
    return [];
  }
}

export async function updateLoginStreak(userId: string): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, lastLoginDate: true },
    });

    const lastDate = user?.lastLoginDate;
    if (lastDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = lastDate === yesterday ? (user?.streak ?? 0) + 1 : 1;

    await prisma.user.update({
      where: { id: userId },
      data: { streak: newStreak, lastLoginDate: today },
    });

    await checkAndAwardBadges(userId, "login");
  } catch {
  }
}
