import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken, sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone } = await req.json();
  if (!phone?.trim()) return NextResponse.json({ error: "ফোন নম্বর দিন" }, { status: 400 });

  const wa = await prisma.whatsAppSettings.findUnique({ where: { userId: session.user.id } });
  if (!wa?.isConnected || !wa.apiToken || !wa.phoneNumberId) {
    return NextResponse.json({ error: "WhatsApp সংযুক্ত নেই" }, { status: 400 });
  }

  const token = decryptToken(wa.apiToken);
  const result = await sendWhatsAppMessage(
    token,
    wa.phoneNumberId,
    phone.trim(),
    "✅ আপনার BizilCore WhatsApp সংযোগ সফল হয়েছে! 🎉"
  );

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "মেসেজ পাঠানো যায়নি" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
