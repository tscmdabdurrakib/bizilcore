import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSSLCommerzSession } from "@/lib/payment/sslcommerz";
import { getAppUrl } from "@/lib/app-url";

export async function POST(req: Request) {
  const { slug, orderNumber, amount, customerName, customerPhone, customerAddress, customerEmail } = await req.json();
  if (!slug || !orderNumber || !amount || !customerName || !customerPhone || !customerAddress) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: {
      storeSslcommerzEnabled: true,
      storeSslcommerzStoreId: true,
      storeSslcommerzStorePass: true,
    },
  });

  if (!shop?.storeSslcommerzEnabled || !shop.storeSslcommerzStoreId || !shop.storeSslcommerzStorePass) {
    return NextResponse.json({ error: "SSLCommerz not configured" }, { status: 400 });
  }

  const base = getAppUrl();
  const result = await createSSLCommerzSession({
    storeId: shop.storeSslcommerzStoreId,
    storePass: shop.storeSslcommerzStorePass,
    amount: parseFloat(String(amount)),
    orderId: orderNumber,
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    successUrl: `${base}/api/payment/sslcommerz/callback?status=success&slug=${slug}`,
    failUrl: `${base}/api/payment/sslcommerz/callback?status=fail&slug=${slug}`,
    cancelUrl: `${base}/store/${slug}/checkout`,
    sandbox: process.env.NODE_ENV !== "production",
  });

  if (!result.success) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ gatewayUrl: result.gatewayUrl });
}
