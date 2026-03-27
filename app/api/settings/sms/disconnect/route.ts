import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.smsSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, isConnected: false },
    update: { isConnected: false, apiKey: null },
  });

  return NextResponse.json({ success: true });
}
