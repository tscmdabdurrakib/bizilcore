import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.pathaoSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    isConnected: settings?.isConnected ?? false,
    connectedAt: settings?.connectedAt ?? null,
    clientId: settings?.clientId ? settings.clientId.slice(0, 4) + "••••" + settings.clientId.slice(-4) : null,
    storeId: settings?.storeId ?? null,
    username: settings?.username ?? null,
    sandboxMode: settings?.sandboxMode ?? false,
    hasCredentials: !!(settings?.clientId && settings?.clientSecret && settings?.username && settings?.password && settings?.storeId),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { clientId, clientSecret, username, password, storeId, sandboxMode } = body as {
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    storeId?: string;
    sandboxMode?: boolean;
  };

  if (!clientId || !clientSecret || !username || !password || !storeId) {
    return NextResponse.json({ error: "সব তথ্য পূরণ করুন" }, { status: 400 });
  }

  await prisma.pathaoSettings.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      username: username.trim(),
      password: password.trim(),
      storeId: storeId.trim(),
      sandboxMode: sandboxMode ?? false,
      isConnected: true,
      connectedAt: new Date(),
    },
    update: {
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      username: username.trim(),
      password: password.trim(),
      storeId: storeId.trim(),
      sandboxMode: sandboxMode ?? false,
      isConnected: true,
      connectedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.pathaoSettings.updateMany({
    where: { userId: session.user.id },
    data: { isConnected: false, clientId: null, clientSecret: null, username: null, password: null, storeId: null, sandboxMode: false, connectedAt: null },
  });

  return NextResponse.json({ success: true });
}
