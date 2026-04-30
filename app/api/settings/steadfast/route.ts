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
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { apiKey, secretKey } = body as { apiKey?: string; secretKey?: string };

  if (!apiKey?.trim() || !secretKey?.trim()) {
    return NextResponse.json({ error: "API Key এবং Secret Key পূরণ করুন" }, { status: 400 });
  }

  await prisma.steadfastSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      isConnected: true,
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      connectedAt: new Date(),
    },
    update: {
      isConnected: true,
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      connectedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.steadfastSettings.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
