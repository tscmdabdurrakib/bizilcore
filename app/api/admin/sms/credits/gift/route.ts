import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/sms/auth";
import { giftCredits } from "@/lib/sms/credits";
import { parseSmsType, smsTypeLabelBn } from "@/lib/sms/types";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const userId = body.userId as string | undefined;
  const email = body.email as string | undefined;
  const creditsAmount = parseInt(body.creditsAmount, 10);
  const reason = (body.reason as string)?.trim();
  const smsType = parseSmsType(body.smsType);

  if (!Number.isFinite(creditsAmount) || creditsAmount <= 0) {
    return NextResponse.json({ error: "সঠিক credit পরিমাণ দিন" }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: "কারণ/নোট লিখুন" }, { status: 400 });
  }

  let targetUserId = userId;
  if (!targetUserId && email) {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "ইউজার পাওয়া যায়নি" }, { status: 404 });
    }
    targetUserId = user.id;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "userId বা email দিন" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, email: true, isAdmin: true },
  });
  if (!user) {
    return NextResponse.json({ error: "ইউজার পাওয়া যায়নি" }, { status: 404 });
  }

  try {
    await giftCredits(targetUserId, creditsAmount, smsType, reason, authResult.userId);

    createNotification(
      targetUserId,
      "system",
      "🎁 SMS Credit Gift!",
      `আপনি ${creditsAmount}টি ${smsTypeLabelBn(smsType)} SMS credit পেয়েছেন। ${reason}`,
      "/billing#sms-credits"
    ).catch(() => {});

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      creditsAmount,
      smsType,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gift failed" },
      { status: 400 }
    );
  }
}
