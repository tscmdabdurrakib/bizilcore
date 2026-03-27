import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const orderNumber = searchParams.get("orderNumber");
  const slug = searchParams.get("slug");

  if (!phone || !orderNumber || !slug) {
    return NextResponse.json({ error: "ফোন নম্বর, অর্ডার নম্বর ও স্টোর স্লাগ প্রয়োজন।" }, { status: 400 });
  }

  const shop = await prisma.shop.findFirst({
    where: { storeSlug: slug.trim().toLowerCase(), storeEnabled: true },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "স্টোর পাওয়া যায়নি।" }, { status: 404 });

  const order = await prisma.storeOrder.findFirst({
    where: {
      shopId: shop.id,
      orderNumber: orderNumber.trim().toUpperCase(),
      customerPhone: { endsWith: phone.replace(/[^0-9]/g, "").slice(-11) },
    },
    select: {
      id: true, orderNumber: true, status: true, paymentMethod: true, paymentStatus: true,
      customerName: true, customerPhone: true, customerAddress: true, customerDistrict: true,
      totalAmount: true, shippingFee: true, discountAmount: true, subtotal: true,
      createdAt: true, updatedAt: true,
      shop: { select: { name: true, storeSlug: true } },
      items: { select: { productName: true, variantName: true, quantity: true, unitPrice: true, subtotal: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি।" }, { status: 404 });

  const STATUS_TIMELINE = ["pending", "confirmed", "packed", "shipped", "delivered"];
  const currentIdx = STATUS_TIMELINE.indexOf(order.status);

  const timeline = STATUS_TIMELINE.map((s, i) => ({
    status: s,
    label: s === "pending" ? "অর্ডার গ্রহণ" :
           s === "confirmed" ? "নিশ্চিত করা হয়েছে" :
           s === "packed" ? "প্যাক করা হচ্ছে" :
           s === "shipped" ? "পাঠানো হয়েছে" :
           "পৌঁছে গেছে",
    done: i <= currentIdx,
    active: i === currentIdx,
  }));

  return NextResponse.json({ order, timeline });
}
