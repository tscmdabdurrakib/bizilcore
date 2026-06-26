import { prisma } from "@/lib/prisma";
import { sendSMS, decryptApiKey } from "@/lib/sms";
import { getAppUrl } from "@/lib/app-url";

export async function notifyBackInStock(productId: string, shopId: string) {
  const alerts = await prisma.storeStockAlert.findMany({
    where: { productId, shopId, notified: false },
    include: {
      product: { select: { name: true } },
      shop: { select: { name: true, storeSlug: true, userId: true } },
    },
  });
  if (!alerts.length) return { notified: 0 };

  const shop = alerts[0].shop;
  let apiKey: string | null = null;
  if (shop.userId) {
    const smsSettings = await prisma.smsSettings.findUnique({ where: { userId: shop.userId } });
    if (smsSettings?.isConnected && smsSettings.apiKey) {
      apiKey = decryptApiKey(smsSettings.apiKey);
    }
  }

  const productUrl = shop.storeSlug
    ? `${getAppUrl()}/store/${shop.storeSlug}/products/${productId}`
    : getAppUrl();
  const message = `${alerts[0].product.name} আবার স্টকে! কিনুন: ${productUrl} - ${shop.name}`;

  let count = 0;
  for (const alert of alerts) {
    if (alert.phone && apiKey) {
      const ok = await sendSMS(apiKey, alert.phone, message);
      if (ok.success) count++;
    }
    await prisma.storeStockAlert.update({ where: { id: alert.id }, data: { notified: true } });
  }

  return { notified: count };
}
