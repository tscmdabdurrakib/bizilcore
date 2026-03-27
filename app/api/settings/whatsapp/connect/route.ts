import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptToken, verifyWhatsAppCredentials } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { api_token, phone_number_id, business_account_id } = await req.json();

  if (!api_token?.trim() || !phone_number_id?.trim()) {
    return NextResponse.json({ error: "API Token ও Phone Number ID দিন" }, { status: 400 });
  }

  const valid = await verifyWhatsAppCredentials(api_token.trim(), phone_number_id.trim());

  if (!valid) {
    return NextResponse.json({ error: "API Token বা Phone Number ID সঠিক নয়" }, { status: 400 });
  }

  await prisma.whatsAppSettings.upsert({
    where: { userId: session.user.id },
    update: {
      apiToken: encryptToken(api_token.trim()),
      phoneNumberId: phone_number_id.trim(),
      businessAccountId: business_account_id?.trim() || null,
      isConnected: true,
      connectedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      apiToken: encryptToken(api_token.trim()),
      phoneNumberId: phone_number_id.trim(),
      businessAccountId: business_account_id?.trim() || null,
      isConnected: true,
      connectedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
