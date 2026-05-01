import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createNotification, getNotifPrefs, getWeeklyTip } from "@/lib/notifications";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prefs = await getNotifPrefs(session.user.id);
  if (!prefs.weeklyTips) return NextResponse.json({ skipped: true });

  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const tip = getWeeklyTip(weekNumber);

  await createNotification(session.user.id, "weekly_tip", tip.title, tip.body, tip.link);
  return NextResponse.json({ ok: true });
}
