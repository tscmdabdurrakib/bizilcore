import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";
import { getShopEasyConfig } from "@/lib/store/shop-easy-config";
import { DEFAULT_ORDER_STATUS_TEMPLATES, renderOrderTemplate } from "@/lib/store/order-templates";
import { sendSMS, decryptApiKey } from "@/lib/sms";
import { sendWhatsAppOrderConfirmation } from "@/lib/social/whatsapp-notify";
import { getAppUrl } from "@/lib/app-url";
import { bookCourierForOrder } from "@/lib/courier-booking";
import { trackForUser } from "@/lib/activity/trackFromSession";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, ids, status, templateId, courierName } = await req.json();
  if (!action || !ids?.length) {
    return NextResponse.json({ error: "action and ids required" }, { status: 400 });
  }

  const shopCtx = await getActiveShopForApi();
  const shopId = "error" in shopCtx ? null : shopCtx.activeShop.id;

  const orders = await prisma.order.findMany({
    where: { id: { in: ids }, userId: session.user.id },
    include: { customer: { select: { name: true, phone: true } } },
  });
  if (!orders.length) return NextResponse.json({ error: "No orders found" }, { status: 404 });

  const shop = shopId
    ? await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true, name: true, storeSlug: true } })
    : null;

  if (action === "status" && status) {
    const result = await prisma.order.updateMany({
      where: { id: { in: orders.map(o => o.id) }, userId: session.user.id },
      data: { status },
    });
    if (shopId && result.count > 0) {
      trackForUser(session.user.id, shopId, {
        actionType: "order_status_changed",
        actionLabel: `বাল্ক স্ট্যাটাস: ${result.count} অর্ডার → ${status}`,
        metadata: { order_ids: ids, new_status: status },
      }).catch(() => {});
    }
    return NextResponse.json({ updated: result.count });
  }

  if (action === "confirm") {
    const result = await prisma.order.updateMany({
      where: { id: { in: orders.map(o => o.id) }, userId: session.user.id },
      data: { status: "confirmed", confirmStatus: "confirmed" },
    });
    return NextResponse.json({ updated: result.count });
  }

  if (action === "print") {
    return NextResponse.json({
      slips: orders.map(o => ({ orderId: o.id, url: `/orders/${o.id}/slip` })),
    });
  }

  if (action === "courier" && courierName) {
    let booked = 0;
    const errors: string[] = [];
    for (const order of orders) {
      try {
        await bookCourierForOrder(session.user.id, order.id, courierName);
        booked++;
      } catch (err: unknown) {
        errors.push(`${order.id.slice(-6)}: ${(err as Error).message}`);
      }
    }
    return NextResponse.json({ booked, errors });
  }

  if (action === "send_template" && templateId && shop) {
    const config = await getShopEasyConfig(shop.id);
    const templates = config.orderStatusTemplates?.length
      ? config.orderStatusTemplates
      : DEFAULT_ORDER_STATUS_TEMPLATES;
    const template = templates.find(t => t.id === templateId);
    if (!template) return NextResponse.json({ error: "Template not found" }, { status: 404 });

    const smsSettings = await prisma.smsSettings.findUnique({ where: { userId: session.user.id } });
    const apiKey = smsSettings?.isConnected && smsSettings.apiKey
      ? decryptApiKey(smsSettings.apiKey)
      : null;

    let sent = 0;
    for (const order of orders) {
      const phone = order.customer?.phone;
      if (!phone) continue;
      const trackUrl = shop.storeSlug
        ? `${getAppUrl()}/store/${shop.storeSlug}/track`
        : getAppUrl();
      const msg = renderOrderTemplate(template.message, {
        orderNumber: order.id.slice(-6).toUpperCase(),
        customerName: order.customer?.name ?? "Customer",
        shopName: shop.name,
        trackUrl,
      });
      if (apiKey) {
        const r = await sendSMS(apiKey, phone, msg);
        if (r.success) sent++;
      }
      sendWhatsAppOrderConfirmation({
        userId: session.user.id,
        toPhone: phone,
        message: msg,
      }).catch(() => {});
    }
    return NextResponse.json({ sent, total: orders.length });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
