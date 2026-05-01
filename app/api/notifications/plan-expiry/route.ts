import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification, getNotifPrefs } from "@/lib/notifications";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await getNotifPrefs(session.user.id);
  if (!prefs.planExpiry) return NextResponse.json({ skipped: true });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { planExpiry: true, plan: true },
  });

  if (!user?.planExpiry) return NextResponse.json({ ok: true, noExpiry: true });

  const msLeft = new Date(user.planExpiry).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    await createNotification(
      session.user.id, "plan_expiry",
      "⚠️ আপনার প্ল্যান শেষ হয়ে গেছে!",
      "আপনার সাবস্ক্রিপশন মেয়াদ শেষ হয়েছে। সেবা চলমান রাখতে রিনিউ করুন।",
      "/settings/billing"
    );
  } else if (daysLeft <= 3) {
    await createNotification(
      session.user.id, "plan_expiry",
      `⏰ প্ল্যান মাত্র ${daysLeft} দিন বাকি!`,
      `আপনার ${user.plan ?? "বর্তমান"} প্ল্যান ${daysLeft} দিনে শেষ হবে। এখনই রিনিউ করুন।`,
      "/settings/billing"
    );
  } else if (daysLeft <= 7) {
    await createNotification(
      session.user.id, "plan_expiry",
      `📅 প্ল্যান ${daysLeft} দিনে শেষ হবে`,
      `আপনার সাবস্ক্রিপশন ${daysLeft} দিন পরে শেষ হবে। রিনিউ করার কথা মনে রাখুন।`,
      "/settings/billing"
    );
  }

  return NextResponse.json({ ok: true, daysLeft });
}
