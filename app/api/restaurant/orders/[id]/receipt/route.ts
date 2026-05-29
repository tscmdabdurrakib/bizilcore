import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true, name: true, phone: true, address: true, logoUrl: true,
      restVatPct: true, restServiceChargePct: true,
      receiptLogo: true, receiptHeaderLine1: true, receiptHeaderLine2: true,
      receiptFooter: true, receiptPaperSize: true,
      receiptShowVat: true, receiptShowQr: true, receiptShowLogo: true,
    },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const order = await prisma.restaurantOrder.findFirst({
    where: { id, shopId: shop.id },
    include: {
      items: {
        include: { menuItem: { select: { name: true, category: true } } },
      },
      table: { select: { number: true, floor: true } },
      waiter: { select: { user: { select: { name: true } } } },
      splits: { select: { payerName: true, amount: true, paymentMethod: true } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const host = req.headers.get("host") ?? "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") ?? "http";
  const verifyUrl = `${protocol}://${host}/api/restaurant/orders/verify/${order.orderNumber}`;

  let qrDataUrl: string | null = null;
  if (shop.receiptShowQr) {
    try {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 100, margin: 1 });
    } catch {}
  }

  return NextResponse.json({ order, shop, qrDataUrl, verifyUrl });
}
