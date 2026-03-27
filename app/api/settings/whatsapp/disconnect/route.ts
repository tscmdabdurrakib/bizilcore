import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.whatsAppSettings.upsert({
    where: { userId: session.user.id },
    update: {
      apiToken: null,
      phoneNumberId: null,
      businessAccountId: null,
      isConnected: false,
      connectedAt: null,
    },
    create: {
      userId: session.user.id,
      isConnected: false,
    },
  });

  return NextResponse.json({ success: true });
}
