import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskToken } from "@/lib/whatsapp";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wa = await prisma.whatsAppSettings.findUnique({
    where: { userId: session.user.id },
  });

  if (!wa) return NextResponse.json({ isConnected: false });

  return NextResponse.json({
    isConnected: wa.isConnected,
    maskedToken: wa.apiToken ? maskToken(wa.apiToken) : null,
    phoneNumberId: wa.phoneNumberId ?? null,
    businessAccountId: wa.businessAccountId ?? null,
    connectedAt: wa.connectedAt ?? null,
  });
}
