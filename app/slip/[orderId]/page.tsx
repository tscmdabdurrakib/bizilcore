import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderSlip, { type SlipSettings } from "@/components/OrderSlip";

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } });
  if (!order) return { title: "স্লিপ পাওয়া যায়নি" };
  const shop = await prisma.shop.findUnique({ where: { userId: order.userId }, select: { name: true } });
  return { title: `${shop?.name ?? "Shop"} — অর্ডার স্লিপ` };
}

export default async function PublicSlipPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { name: true, phone: true, address: true } },
      items: { include: { product: { select: { name: true, imageUrl: true } }, combo: { select: { name: true } } } },
    },
  });
  if (!order) return notFound();

  const shop = await prisma.shop.findUnique({
    where: { userId: order.userId },
    select: {
      name: true, phone: true, logoUrl: true,
      slipPrimaryColor: true, slipAccentColor: true,
      slipShowBarcode: true, slipShowQR: true,
      slipShowSocialMedia: true, slipShowProductPhotos: true,
      slipCustomMessage: true,
      slipFacebookPage: true, slipWhatsapp: true, slipTemplate: true,
      slipHideBrandBadge: true,
    },
  });
  if (!shop) return notFound();

  const settings: SlipSettings = {
    template:        shop.slipTemplate        ?? "classic",
    primaryColor:    shop.slipPrimaryColor    ?? "#0d2d1a",
    accentColor:     shop.slipAccentColor     ?? "#00e676",
    showBarcode:      shop.slipShowBarcode      ?? true,
    showQR:           shop.slipShowQR           ?? true,
    showSocialMedia:  shop.slipShowSocialMedia  ?? true,
    showProductPhotos: shop.slipShowProductPhotos ?? true,
    customMessage:    shop.slipCustomMessage    ?? "ধন্যবাদ আপনার কেনাকাটার জন্য! পণ্য পেয়ে সমস্যা হলে যোগাযোগ করুন।",
    facebookPage:     shop.slipFacebookPage     ?? "",
    whatsapp:         shop.slipWhatsapp         ?? "",
    hideBrandBadge:   shop.slipHideBrandBadge   ?? false,
  };

  return (
    <OrderSlip
      order={{
        id: order.id,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        dueAmount: order.dueAmount,
        deliveryCharge: order.deliveryCharge,
        createdAt: order.createdAt.toISOString(),
        note: order.note,
        customer: order.customer,
        items: order.items.map(item => {
          let name: string;
          if (item.comboId) {
            if (item.comboSnapshot) {
              try { name = (JSON.parse(item.comboSnapshot) as { name: string }).name; }
              catch { name = item.combo?.name ?? "কমবো"; }
            } else {
              name = item.combo?.name ?? "কমবো";
            }
          } else {
            name = item.product?.name ?? "পণ্য";
          }
          let comboItems: { name: string; quantity: number }[] | undefined;
          if (item.comboId && item.comboSnapshot) {
            try {
              const snap = JSON.parse(item.comboSnapshot) as { items?: { name: string; quantity: number }[] };
              if (Array.isArray(snap.items)) comboItems = snap.items.map(ci => ({ name: ci.name, quantity: ci.quantity }));
            } catch { /* ignore parse errors */ }
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
      }}
      shop={{ name: shop.name, phone: shop.phone, logoUrl: shop.logoUrl }}
      settings={settings}
    />
  );
}
