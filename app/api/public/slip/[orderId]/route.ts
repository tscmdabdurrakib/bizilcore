import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { name: true, phone: true, address: true } },
      items: { include: { product: { select: { name: true, imageUrl: true } }, combo: { select: { name: true } } } },
    },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const shop = await prisma.shop.findUnique({
    where: { userId: order.userId },
    select: {
      name: true, phone: true, logoUrl: true,
      slipPrimaryColor: true, slipAccentColor: true,
      slipShowBarcode: true, slipShowQR: true,
      slipShowSocialMedia: true, slipCustomMessage: true,
      slipFacebookPage: true, slipWhatsapp: true, slipTemplate: true,
    },
  });

  const transformedOrder = {
    ...order,
    items: order.items.map(item => {
      let name: string;
      let comboItems: { name: string; quantity: number }[] | undefined;
      if (item.comboId) {
        if (item.comboSnapshot) {
          try {
            const snap = JSON.parse(item.comboSnapshot) as { name: string; items: { name: string; quantity: number }[] };
            name = snap.name;
            if (Array.isArray(snap.items)) comboItems = snap.items.map(ci => ({ name: ci.name, quantity: ci.quantity }));
          } catch { name = item.combo?.name ?? "কমবো"; }
        } else {
          name = item.combo?.name ?? "কমবো";
        }
      } else {
        name = item.product?.name ?? "পণ্য";
      }
      return {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        comboId: item.comboId,
        comboSnapshot: item.comboSnapshot,
        comboItems,
        product: { name, imageUrl: item.product?.imageUrl ?? null },
      };
    }),
  };

  return NextResponse.json({ order: transformedOrder, shop });
}
