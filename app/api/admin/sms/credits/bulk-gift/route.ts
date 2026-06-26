import { NextRequest, NextResponse } from "next/server";
import { requireAdminRole, logAdminAction } from "@/lib/admin/auth";
import { giftCredits } from "@/lib/sms/credits";

export async function POST(req: NextRequest) {
  const authResult = await requireAdminRole("sms");
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const { userIds, creditsAmount, smsType = "non_masking", reason } = body as {
    userIds: string[];
    creditsAmount: number;
    smsType?: "masking" | "non_masking";
    reason: string;
  };

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "userIds required" }, { status: 400 });
  }
  if (!creditsAmount || creditsAmount <= 0) {
    return NextResponse.json({ error: "creditsAmount must be positive" }, { status: 400 });
  }
  if (!reason?.trim()) {
    return NextResponse.json({ error: "reason required" }, { status: 400 });
  }
  if (userIds.length > 100) {
    return NextResponse.json({ error: "Max 100 users per batch" }, { status: 400 });
  }

  const succeeded: string[] = [];
  const failed: { userId: string; error: string }[] = [];

  for (const userId of userIds) {
    try {
      await giftCredits(userId, creditsAmount, smsType, reason, authResult.user.id);
      succeeded.push(userId);
    } catch (e) {
      failed.push({ userId, error: (e as Error).message });
    }
  }

  await logAdminAction(authResult.user.id, "sms.bulk_gift", "sms", undefined, {
    userIds,
    creditsAmount,
    succeeded: succeeded.length,
    failed: failed.length,
  });

  return NextResponse.json({ succeeded, failed });
}
