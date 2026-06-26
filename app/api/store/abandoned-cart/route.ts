import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/courier-fraud";

interface CartItemInput {
  productId?: string;
  productName?: string;
  variantId?: string | null;
  variantName?: string | null;
  quantity?: number;
  unitPrice?: number;
}

/**
 * Public begin-checkout capture. Called (debounced) from the storefront
 * checkout page as soon as the shopper enters a usable phone number, so we can
 * recover the cart if they don't complete the order. Upserted per (shop, phone)
 * so repeated keystrokes don't create duplicates.
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`abandoned-cart:${ip}`, 30, 60_000);
    if (!rl.allowed) return NextResponse.json({ ok: false }, { status: 429 });

    const body = await req.json();
    const { slug, phone: rawPhone, customerName, items, subtotal } = body as {
      slug?: string;
      phone?: string;
      customerName?: string;
      items?: CartItemInput[];
      subtotal?: number;
    };

    const phone = normalizePhone(rawPhone || "");
    if (!slug || !phone || phone.length < 11) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { storeSlug: slug },
      select: { id: true, storeEnabled: true },
    });
    if (!shop || !shop.storeEnabled) return NextResponse.json({ ok: false }, { status: 404 });

    const cleanItems = items.slice(0, 50).map((i) => ({
      productId: i.productId ?? null,
      productName: i.productName ?? null,
      variantId: i.variantId ?? null,
      variantName: i.variantName ?? null,
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.unitPrice) || 0,
    }));
    const computedSubtotal = Number(subtotal) || cleanItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    await prisma.abandonedCart.upsert({
      where: { shopId_phone: { shopId: shop.id, phone } },
      create: {
        shopId: shop.id,
        storeSlug: slug,
        customerName: customerName?.trim() || null,
        phone,
        items: cleanItems,
        subtotal: computedSubtotal,
        status: "open",
      },
      update: {
        // Only refresh an active cart; never resurrect a recovered one.
        storeSlug: slug,
        customerName: customerName?.trim() || null,
        items: cleanItems,
        subtotal: computedSubtotal,
        status: "open",
        remindedAt: null,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

/** Authenticated seller list of abandoned carts + recovered revenue metric. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const carts = await prisma.abandonedCart.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const recovered = carts.filter((c) => c.status === "recovered");
  const recoveredRevenue = recovered.reduce((s, c) => s + c.subtotal, 0);
  const openCount = carts.filter((c) => c.status === "open" || c.status === "reminded").length;

  return NextResponse.json({
    carts,
    metrics: {
      total: carts.length,
      open: openCount,
      reminded: carts.filter((c) => c.status === "reminded").length,
      recovered: recovered.length,
      recoveredRevenue,
    },
  });
}
