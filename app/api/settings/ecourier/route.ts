import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.ecourierSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    isConnected: settings?.isConnected ?? false,
    hasApi: settings?.hasApi ?? false,
    connectedAt: settings?.connectedAt ?? null,
    apiKey: settings?.apiKey ? settings.apiKey.slice(0, 4) + "••••" + settings.apiKey.slice(-4) : null,
    ecUserId: settings?.ecUserId ?? null,
    pickupAddress: settings?.pickupAddress ?? null,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { hasApi, apiKey, apiSecret, ecUserId, pickupAddress } = body as {
    hasApi?: boolean;
    apiKey?: string;
    apiSecret?: string;
    ecUserId?: string;
    pickupAddress?: string;
  };

  if (hasApi && (!apiKey?.trim() || !apiSecret?.trim() || !ecUserId?.trim())) {
    return NextResponse.json({ error: "API Key, API Secret এবং User ID পূরণ করুন" }, { status: 400 });
  }

  await prisma.ecourierSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      isConnected: true,
      hasApi: hasApi ?? false,
      apiKey: hasApi ? apiKey?.trim() : null,
      apiSecret: hasApi ? apiSecret?.trim() : null,
      ecUserId: hasApi ? ecUserId?.trim() : null,
      pickupAddress: pickupAddress?.trim() || null,
      connectedAt: new Date(),
    },
    update: {
      isConnected: true,
      hasApi: hasApi ?? false,
      apiKey: hasApi ? apiKey?.trim() : null,
      apiSecret: hasApi ? apiSecret?.trim() : null,
      ecUserId: hasApi ? ecUserId?.trim() : null,
      pickupAddress: pickupAddress?.trim() || null,
      connectedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.ecourierSettings.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
