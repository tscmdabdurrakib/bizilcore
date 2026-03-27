import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFeedbackNotification } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, message, pageUrl } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "Feedback message required" }, { status: 400 });

  const feedback = await prisma.userFeedback.create({
    data: {
      userId: session.user.id,
      type: type ?? "other",
      message: message.trim(),
      pageUrl: pageUrl ?? null,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } });
  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { name: true } });

  sendFeedbackNotification({
    userName: user?.name ?? "অজানা ব্যবহারকারী",
    userEmail: user?.email ?? "",
    shopName: shop?.name ?? "অজানা Shop",
    type,
    message: message.trim(),
    pageUrl,
    feedbackId: feedback.id,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const feedbacks = await prisma.userFeedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(feedbacks);
}
