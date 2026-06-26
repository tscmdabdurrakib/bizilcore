/**
 * Best-effort WhatsApp notifications for store orders.
 *
 * Uses the legacy WhatsAppSettings row (keyed by userId), which the new
 * Embedded-Signup flow keeps in sync. Silently no-ops when WhatsApp isn't
 * connected so it never blocks the order flow.
 */
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/whatsapp";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function sendWhatsAppOrderConfirmation(opts: {
  userId: string;
  toPhone: string;
  message: string;
}): Promise<boolean> {
  try {
    const settings = await prisma.whatsAppSettings.findUnique({ where: { userId: opts.userId } });
    if (!settings?.isConnected || !settings.apiToken || !settings.phoneNumberId) return false;
    const token = decryptToken(settings.apiToken);
    if (!token) return false;
    const res = await sendWhatsAppMessage(token, settings.phoneNumberId, opts.toPhone, opts.message);
    return res.success;
  } catch {
    return false;
  }
}
