import { prisma } from "@/lib/prisma";

export type NotifType =
  | "achievement"
  | "referral"
  | "plan_expiry"
  | "weekly_tip"
  | "low_stock"
  | "order"
  | "promotion"
  | "system";

export async function createNotification(
  userId: string,
  type: NotifType,
  title: string,
  body: string,
  link?: string,
) {
  try {
    return await prisma.notification.create({
      data: { userId, type, title, body, link: link ?? null },
    });
  } catch {
    return null;
  }
}

export interface NotifPref {
  id: string;
  userId: string;
  lowStock: boolean;
  pendingOrders: boolean;
  planExpiry: boolean;
  achievements: boolean;
  referralUpdates: boolean;
  weeklyTips: boolean;
  promotions: boolean;
}

export async function getNotifPrefs(userId: string): Promise<NotifPref> {
  const rows = await prisma.$queryRaw<NotifPref[]>`
    SELECT * FROM "NotificationPreference" WHERE "userId" = ${userId} LIMIT 1
  `;
  if (rows.length > 0) return rows[0];
  const id = `np_${userId}_${Date.now()}`;
  await prisma.$executeRaw`
    INSERT INTO "NotificationPreference" ("id","userId") VALUES (${id}, ${userId})
    ON CONFLICT ("userId") DO NOTHING
  `;
  const fresh = await prisma.$queryRaw<NotifPref[]>`
    SELECT * FROM "NotificationPreference" WHERE "userId" = ${userId} LIMIT 1
  `;
  return fresh[0] ?? ({
    id, userId,
    lowStock: true, pendingOrders: true, planExpiry: true,
    achievements: true, referralUpdates: true, weeklyTips: true, promotions: false,
  } as NotifPref);
}

export async function updateNotifPrefs(
  userId: string,
  prefs: Partial<Omit<NotifPref, "id" | "userId">>,
) {
  const id = `np_${userId}_${Date.now()}`;
  await prisma.$executeRaw`
    INSERT INTO "NotificationPreference" ("id","userId")
    VALUES (${id}, ${userId})
    ON CONFLICT ("userId") DO NOTHING
  `;
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const [key, val] of Object.entries(prefs)) {
    sets.push(`"${key}" = $${idx}`);
    values.push(val);
    idx++;
  }
  if (sets.length === 0) return;
  values.push(userId);
  await prisma.$executeRawUnsafe(
    `UPDATE "NotificationPreference" SET ${sets.join(", ")} WHERE "userId" = $${idx}`,
    ...values,
  );
}

const WEEKLY_TIPS = [
  { title: "📊 সাপ্তাহিক টিপস", body: "নিয়মিত স্টক আপডেট করলে বিক্রি ৩০% বাড়তে পারে! আজই চেক করুন।", link: "/inventory" },
  { title: "💡 বিক্রয় টিপস", body: "কাস্টমারদের জন্মদিনে ডিসকাউন্ট অফার করুন — তারা বারবার আসবে!", link: "/customers" },
  { title: "📈 ব্যবসার টিপস", body: "সপ্তাহে একবার রিপোর্ট চেক করুন। ট্রেন্ড ধরতে পারলে আগেই প্ল্যান করা যায়।", link: "/reports" },
  { title: "🤝 কাস্টমার টিপস", body: "পুরানো কাস্টমারদের মেসেজ করুন — একটি সম্পর্ক মানেই বারবার বিক্রি!", link: "/customers" },
  { title: "⚡ অর্ডার টিপস", body: "দ্রুত ডেলিভারি দিলে ৫-স্টার রিভিউ পাওয়ার সম্ভাবনা দ্বিগুণ হয়।", link: "/orders" },
  { title: "💰 হিসাব টিপস", body: "মাস শেষে বাকি খাতা মিলিয়ে নিন — কে কত বাকি আছে জানলে আদায় সহজ হয়।", link: "/hisab/due-ledger" },
  { title: "🎯 লয়্যালটি টিপস", body: "লয়্যালটি পয়েন্ট অফার করুন — কাস্টমার ধরে রাখা নতুন কাস্টমার আনার চেয়ে সহজ!", link: "/settings/loyalty" },
];

export function getWeeklyTip(weekNumber: number) {
  return WEEKLY_TIPS[weekNumber % WEEKLY_TIPS.length];
}
