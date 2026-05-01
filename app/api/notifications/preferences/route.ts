import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNotifPrefs, updateNotifPrefs } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const prefs = await getNotifPrefs(session.user.id);
  return NextResponse.json(prefs);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const allowed = ["lowStock", "pendingOrders", "planExpiry", "achievements", "referralUpdates", "weeklyTips", "promotions"];
  const prefs: Record<string, boolean> = {};
  for (const key of allowed) {
    if (typeof body[key] === "boolean") prefs[key] = body[key];
  }
  await updateNotifPrefs(session.user.id, prefs);
  return NextResponse.json({ ok: true });
}
