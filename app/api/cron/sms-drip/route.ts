import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSMS, decryptApiKey } from "@/lib/sms";
import { getSetupProgress } from "@/lib/setupProgress";

const DRIP_MESSAGES: Record<number, {
  condition: (progress: Awaited<ReturnType<typeof getSetupProgress>>, orderCount: number, productCount: number, isPro: boolean, referralCode: string) => boolean;
  message: (referralCode: string) => string;
}> = {
  1: {
    condition: (p) => !p.first_product,
    message: () => "BizilCore তে স্বাগতম! প্রথম পণ্য যোগ করতে মাত্র ২ মিনিট লাগবে।\nএখনই শুরু করুন: bizilcore.com/inventory/new",
  },
  3: {
    condition: (p, orderCount, productCount) => productCount > 0 && orderCount === 0,
    message: () => "আপনার পণ্য ready! এখন প্রথম অর্ডার এন্ট্রি করুন।\nbizilcore.com/orders/new",
  },
  7: {
    condition: (_p, _o, _pr, isPro) => !isPro,
    message: () => "BizilCore Pro তে courier booking, auto SMS সহ অনেক সুবিধা।\nদেখুন: bizilcore.com/pricing",
  },
  30: {
    condition: (_p, orderCount, _pr, _isPro) => orderCount >= 5,
    message: (code) => `বন্ধুকে invite করুন — উভয়ই ১ মাস Pro free পাবেন।\nআপনার code: ${code} | bizilcore.com/settings/referral`,
  },
};

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const userRows = await prisma.$queryRaw<{
    createdAt: Date;
    smsDripSentDays: number[];
    phone: string | null;
    plan: string | null;
  }[]>`
    SELECT u."createdAt", u."smsDripSentDays", u.phone, s.plan
    FROM "User" u
    LEFT JOIN "Subscription" s ON s."userId" = u.id AND s.status = 'active'
    WHERE u.id = ${userId}
    LIMIT 1
  `;
  if (!userRows.length) return NextResponse.json({ skipped: true });
  const user = userRows[0];

  if (!user.phone) return NextResponse.json({ skipped: true, reason: "no_phone" });

  const daysSinceSignup = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const sentDays = user.smsDripSentDays ?? [];
  const isPro = ["pro", "business"].includes(user.plan ?? "");

  const progress = await getSetupProgress(userId);

  const shopRows = await prisma.$queryRaw<{ productCount: bigint; orderCount: bigint }[]>`
    SELECT 
      (SELECT COUNT(*) FROM "Product" WHERE "shopId" = s.id AND "isDemoData" = false) as "productCount",
      (SELECT COUNT(*) FROM "Order" WHERE "userId" = ${userId} AND "isDemoData" = false) as "orderCount"
    FROM "Shop" s WHERE s."userId" = ${userId} LIMIT 1
  `;
  const productCount = shopRows.length ? Number(shopRows[0].productCount) : 0;
  const orderCount = shopRows.length ? Number(shopRows[0].orderCount) : 0;

  const refRows = await prisma.$queryRaw<{ code: string }[]>`
    SELECT code FROM "ReferralCode" WHERE "userId" = ${userId} LIMIT 1
  `;
  const referralCode = refRows[0]?.code ?? "—";

  const smsSettings = await prisma.smsSettings.findUnique({ where: { userId } });
  if (!smsSettings?.apiKey) return NextResponse.json({ skipped: true, reason: "no_sms_key" });
  const apiKey = decryptApiKey(smsSettings.apiKey);

  const daysToCheck = [1, 3, 7, 30];
  const sent: number[] = [];

  for (const day of daysToCheck) {
    if (daysSinceSignup < day) continue;
    if (sentDays.includes(day)) continue;
    const drip = DRIP_MESSAGES[day];
    if (!drip) continue;
    if (!drip.condition(progress, orderCount, productCount, isPro, referralCode)) continue;
    const message = drip.message(referralCode);
    const ok = await sendSMS(apiKey, user.phone, message);
    if (ok) {
      sent.push(day);
      await prisma.$executeRaw`
        UPDATE "User" SET "smsDripSentDays" = array_append("smsDripSentDays", ${day}) WHERE id = ${userId}
      `;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
