/**
 * Abandoned cart recovery reminder.
 *
 * Sends a single WhatsApp/SMS reminder to shoppers who started checkout (phone
 * captured) but didn't place an order within the reminder window. Runs every
 * ~30 min via vercel.json; each cart is reminded at most once.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { sendWhatsAppOrderConfirmation } from "@/lib/social/whatsapp-notify";
import { sendSMS, decryptApiKey } from "@/lib/sms";
import { getAppUrl } from "@/lib/app-url";
import { captureError } from "@/lib/observability";

const REMIND_AFTER_MS = 60 * 60 * 1000; // wait 1h before reminding
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // don't remind carts older than 7 days

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const carts = await prisma.abandonedCart.findMany({
    where: {
      status: "open",
      remindedAt: null,
      createdAt: { lte: new Date(now - REMIND_AFTER_MS), gte: new Date(now - MAX_AGE_MS) },
    },
    take: 200,
  });

  // Cache shop lookups across carts.
  const shopCache = new Map<string, { userId: string; name: string; storeSlug: string | null } | null>();
  const smsKeyCache = new Map<string, string | null>();

  let reminded = 0;
  let skipped = 0;

  for (const cart of carts) {
    try {
      let shop = shopCache.get(cart.shopId);
      if (shop === undefined) {
        const row = await prisma.shop.findUnique({
          where: { id: cart.shopId },
          select: { userId: true, name: true, storeSlug: true },
        });
        shop = row?.userId ? { userId: row.userId, name: row.name, storeSlug: row.storeSlug } : null;
        shopCache.set(cart.shopId, shop);
      }
      if (!shop) {
        skipped++;
        continue;
      }

      const slug = cart.storeSlug ?? shop.storeSlug ?? "";
      const trackUrl = slug ? `${getAppUrl()}/store/${slug}/checkout` : getAppUrl();
      const amount = Math.round(cart.subtotal);
      const msg =
        `আসসালামু আলাইকুম${cart.customerName ? " " + cart.customerName : ""}! ${shop.name} থেকে আপনার অর্ডারটি অসম্পূর্ণ আছে (৳${amount})। সম্পন্ন করতে এখানে চাপ দিন: ${trackUrl}`;

      const wa = await sendWhatsAppOrderConfirmation({ userId: shop.userId, toPhone: cart.phone, message: msg }).catch(() => false);

      let sms = false;
      let apiKey = smsKeyCache.get(shop.userId);
      if (apiKey === undefined) {
        const settings = await prisma.smsSettings.findUnique({ where: { userId: shop.userId } });
        apiKey = settings?.isConnected && settings.apiKey ? decryptApiKey(settings.apiKey) : null;
        smsKeyCache.set(shop.userId, apiKey);
      }
      if (apiKey) {
        const smsResult = await sendSMS(apiKey, cart.phone, msg).catch(() => ({ success: false }));
        sms = smsResult.success;
      }

      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: { status: "reminded", remindedAt: new Date() },
      });

      if (wa || sms) reminded++;
      else skipped++;
    } catch (err) {
      skipped++;
      captureError(err, { route: "cron/abandoned-cart", cartId: cart.id });
    }
  }

  return NextResponse.json({ checked: carts.length, reminded, skipped, timestamp: new Date().toISOString() });
}
