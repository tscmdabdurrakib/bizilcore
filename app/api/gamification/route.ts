import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALL_BADGES = [
  { id: "first_sale", label: "প্রথম বিক্রি", description: "প্রথম অর্ডার তৈরি করুন", icon: "🎉" },
  { id: "orders_10", label: "১০ অর্ডার", description: "১০টি অর্ডার সম্পন্ন করুন", icon: "📦" },
  { id: "orders_100", label: "১০০ অর্ডার", description: "১০০টি অর্ডার মাইলস্টোন", icon: "🏆" },
  { id: "orders_500", label: "৫০০ অর্ডার", description: "৫০০টি অর্ডার সম্পন্ন করুন", icon: "🚀" },
  { id: "streak_7", label: "৭ দিন active", description: "৭ দিন ধারাবাহিকভাবে login করুন", icon: "🔥" },
  { id: "streak_30", label: "৩০ দিন active", description: "৩০ দিনের streak অর্জন করুন", icon: "⭐" },
  { id: "revenue_1lakh", label: "বড় বিক্রেতা", description: "মোট ১ লক্ষ টাকা বিক্রি করুন", icon: "💰" },
  { id: "team_leader", label: "Team Leader", description: "প্রথম staff যোগ করুন", icon: "👥" },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { badges: true, streak: true, totalOrders: true },
  });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true, category: true } });

  let weeklyRank: number | null = null;
  if (shop) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyRevenue = await prisma.order.aggregate({
      where: { userId: session.user.id, status: "delivered", createdAt: { gte: oneWeekAgo } },
      _sum: { totalAmount: true },
    });
    const myRevenue = weeklyRevenue._sum.totalAmount ?? 0;

    if (shop.category) {
      const sameCategoryUsers = await prisma.shop.findMany({
        where: { category: shop.category, id: { not: shop.id } },
        select: { userId: true },
      });
      const sameCategoryRevenues = await Promise.all(
        sameCategoryUsers.map(async (s) => {
          const rev = await prisma.order.aggregate({
            where: { userId: s.userId, status: "delivered", createdAt: { gte: oneWeekAgo } },
            _sum: { totalAmount: true },
          });
          return rev._sum.totalAmount ?? 0;
        })
      );
      const better = sameCategoryRevenues.filter(r => r > myRevenue).length;
      weeklyRank = better + 1;
    }
  }

  return NextResponse.json({
    badges: user?.badges ?? [],
    streak: user?.streak ?? 0,
    totalOrders: user?.totalOrders ?? 0,
    allBadges: ALL_BADGES,
    weeklyRank,
    category: shop?.category ?? null,
  });
}
