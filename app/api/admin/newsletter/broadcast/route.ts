import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";
import { sendEmail } from "@/lib/mailer";

export async function GET() {
  const authResult = await requireAdminRole("newsletter");
  if ("error" in authResult) return authResult.error;

  try {
    const campaigns = await prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json({ campaigns: [] });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdminRole("newsletter");
  if ("error" in authResult) return authResult.error;

  const { subject, htmlBody } = await req.json();
  if (!subject?.trim() || !htmlBody?.trim()) {
    return NextResponse.json({ error: "Subject and body required" }, { status: 400 });
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { status: "active" },
    select: { email: true },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const sub of subscribers) {
    try {
      await sendEmail("newsletter", {
        to: sub.email,
        subject,
        html: htmlBody,
      });
      sent++;
    } catch (e) {
      errors.push(sub.email);
    }
  }

  try {
    await prisma.newsletterCampaign.create({
      data: {
        subject,
        htmlBody,
        sentBy: authResult.user.id,
        recipientCount: sent,
        status: errors.length === 0 ? "sent" : sent > 0 ? "partial" : "failed",
        sentAt: new Date(),
      },
    });
  } catch { /* migration pending */ }

  return NextResponse.json({ sent, failed: errors.length, total: subscribers.length });
}
