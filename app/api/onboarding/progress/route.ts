import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSetupProgress, updateSetupProgress, type SetupTaskKey } from "@/lib/setupProgress";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const progress = await getSetupProgress(session.user.id);
  return NextResponse.json(progress);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.dismiss) {
    await updateSetupProgress(session.user.id, { dismissed: true, dismissedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  }

  if (body.snooze) {
    const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await updateSetupProgress(session.user.id, { snoozedUntil: until });
    return NextResponse.json({ ok: true });
  }

  if (body.task && typeof body.task === "string") {
    const current = await getSetupProgress(session.user.id);
    await updateSetupProgress(session.user.id, { [body.task as SetupTaskKey]: true, ...current });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
