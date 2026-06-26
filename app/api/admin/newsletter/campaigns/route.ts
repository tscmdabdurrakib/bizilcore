import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

export async function GET() {
  const authResult = await requireAdminRole("newsletter");
  if ("error" in authResult) return authResult.error;

  try {
    const campaigns = await prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        subject: true,
        recipientCount: true,
        status: true,
        sentAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ campaigns });
  } catch {
    return NextResponse.json({ campaigns: [] });
  }
}
