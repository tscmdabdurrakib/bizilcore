import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/sms/auth";
import { prisma } from "@/lib/prisma";
import { validateSenderId } from "@/lib/sms/types";
import { getGlobalSmsSettings } from "@/lib/sms/credits";

export async function GET() {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const request = await prisma.smsSenderIdRequest.findUnique({
    where: { userId: authResult.userId },
  });

  if (!request) {
    return NextResponse.json({ status: null, senderId: null, adminNote: null });
  }

  return NextResponse.json({
    status: request.status,
    senderId: request.senderId,
    adminNote: request.adminNote,
    reviewedAt: request.reviewedAt,
    createdAt: request.createdAt,
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const settings = await getGlobalSmsSettings();
  if (!settings.maskingEnabled) {
    return NextResponse.json(
      { error: "Masking SMS সার্ভিস বর্তমানে বন্ধ আছে" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const senderId = validateSenderId(body.senderId ?? "");

  if (!senderId) {
    return NextResponse.json(
      { error: "Sender ID ৩–১১ অক্ষরের ইংরেজি বর্ণ/সংখ্যা হতে হবে (যেমন MYSTORE)" },
      { status: 400 }
    );
  }

  const existing = await prisma.smsSenderIdRequest.findUnique({
    where: { userId: authResult.userId },
  });

  if (existing?.status === "approved") {
    return NextResponse.json({ error: "আপনার Sender ID ইতিমধ্যে approved" }, { status: 400 });
  }

  const duplicate = await prisma.smsSenderIdRequest.findFirst({
    where: {
      senderId,
      userId: { not: authResult.userId },
      status: { in: ["pending", "approved"] },
    },
  });
  if (duplicate) {
    return NextResponse.json({ error: "এই Sender ID ইতিমধ্যে ব্যবহৃত হচ্ছে" }, { status: 400 });
  }

  const request = await prisma.smsSenderIdRequest.upsert({
    where: { userId: authResult.userId },
    create: {
      userId: authResult.userId,
      senderId,
      status: "pending",
    },
    update: {
      senderId,
      status: "pending",
      adminNote: null,
      reviewedBy: null,
      reviewedAt: null,
    },
  });

  return NextResponse.json({
    success: true,
    status: request.status,
    senderId: request.senderId,
  });
}
