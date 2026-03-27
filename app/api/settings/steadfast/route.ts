import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.steadfastSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    isConnected: settings?.isConnected ?? false,
    connectedAt: settings?.connectedAt ?? null,
    apiKey: settings?.apiKey ? settings.apiKey.slice(0, 4) + "••••" + settings.apiKey.slice(-4) : null,
    hasCredentials: !!(settings?.apiKey && settings?.secretKey),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { apiKey, secretKey } = body as { apiKey?: string; secretKey?: string };

  if (!apiKey || !secretKey) {
    return NextResponse.json({ error: "API Key ও Secret Key দুটোই দিন" }, { status: 400 });
  }

  await prisma.steadfastSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      isConnected: true,
      connectedAt: new Date(),
    },
    update: {
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      isConnected: true,
      connectedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.steadfastSettings.updateMany({
    where: { userId: session.user.id },
    data: { isConnected: false, apiKey: null, secretKey: null, connectedAt: null },
  });

  return NextResponse.json({ success: true });
}
