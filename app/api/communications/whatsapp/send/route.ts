import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken, sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to_phone, message, customer_id } = await req.json();
  if (!to_phone?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "ফোন নম্বর ও বার্তা দিন" }, { status: 400 });
  }

  const wa = await prisma.whatsAppSettings.findUnique({ where: { userId: session.user.id } });
  if (!wa?.isConnected || !wa.apiToken || !wa.phoneNumberId) {
    return NextResponse.json({ error: "WhatsApp সংযুক্ত নেই। Settings এ যান।" }, { status: 400 });
  }

  const log = await prisma.messageLog.create({
    data: {
      userId: session.user.id,
      customerId: customer_id ?? null,
      toPhone: to_phone.trim(),
      message: message.trim(),
      status: "pending",
    },
  });

  const token = decryptToken(wa.apiToken);
  const result = await sendWhatsAppMessage(token, wa.phoneNumberId, to_phone.trim(), message.trim());

  await prisma.messageLog.update({
    where: { id: log.id },
    data: {
      status: result.success ? "sent" : "failed",
      errorMessage: result.error ?? null,
    },
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "মেসেজ পাঠানো যায়নি" }, { status: 400 });
  }

  return NextResponse.json({ success: true, messageId: result.messageId });
}
