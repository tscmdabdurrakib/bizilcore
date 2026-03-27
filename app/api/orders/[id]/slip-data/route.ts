import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: { select: { name: true, imageUrl: true } },
          combo: {
            include: {
              items: {
                include: { product: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: {
      name: true, phone: true, logoUrl: true,
      slipPrimaryColor: true, slipAccentColor: true,
      slipShowBarcode: true, slipShowQR: true,
      slipShowSocialMedia: true, slipCustomMessage: true,
      slipFacebookPage: true, slipWhatsapp: true, slipTemplate: true, slipColorPresets: true,
      slipShowProductPhotos: true, slipHideBrandBadge: true,
    },
  });

  let relatedOrders: object[] = [];
  if (order.customerId) {
    const others = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        customerId: order.customerId,
        id: { not: id },
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrl: true } },
            combo: {
              include: {
                items: {
                  include: { product: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    relatedOrders = others.map(o => ({
      id: o.id,
      totalAmount: o.totalAmount,
      paidAmount: o.paidAmount,
      dueAmount: o.dueAmount,
      deliveryCharge: o.deliveryCharge,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map(it => {
        let comboName2: string | undefined;
        let comboItemsList2: { name: string; quantity: number }[] | undefined;
        if (it.comboId) {
          if (it.comboSnapshot) {
            try {
              const snap = JSON.parse(it.comboSnapshot) as { name: string; items: { name: string; quantity: number }[] };
              comboName2 = snap.name;
              comboItemsList2 = snap.items.map(ci => ({ name: ci.name, quantity: ci.quantity }));
            } catch { comboName2 = it.combo?.name; }
          } else if (it.combo) {
            comboName2 = it.combo.name;
            comboItemsList2 = it.combo.items.map(ci => ({ name: ci.product.name, quantity: ci.quantity }));
          }
        }
        return {
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          subtotal: it.subtotal,
          product: {
            name: it.comboId ? (comboName2 ?? "") : (it.product?.name ?? ""),
            imageUrl: it.comboId ? null : (it.product?.imageUrl ?? null),
          },
          comboId: it.comboId,
          comboItems: comboItemsList2,
        };
      }),
    }));
  }

  const mappedOrder = {
    id: order.id,
    totalAmount: order.totalAmount,
    paidAmount: order.paidAmount,
    dueAmount: order.dueAmount,
    deliveryCharge: order.deliveryCharge,
    createdAt: order.createdAt.toISOString(),
    note: order.note,
    customer: order.customer ? {
      name: order.customer.name,
      phone: order.customer.phone,
      address: order.customer.address,
    } : null,
    items: order.items.map(it => {
      let comboName: string | undefined;
      let comboItemsList: { name: string; quantity: number }[] | undefined;
      if (it.comboId) {
        if (it.comboSnapshot) {
          try {
            const snap = JSON.parse(it.comboSnapshot) as { name: string; items: { name: string; quantity: number }[] };
            comboName = snap.name;
            comboItemsList = snap.items.map(ci => ({ name: ci.name, quantity: ci.quantity }));
          } catch { comboName = it.combo?.name; }
        } else if (it.combo) {
          comboName = it.combo.name;
          comboItemsList = it.combo.items.map(ci => ({ name: ci.product.name, quantity: ci.quantity }));
        }
      }
      return {
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        product: {
          name: it.comboId ? (comboName ?? "") : (it.product?.name ?? ""),
          imageUrl: it.comboId ? null : (it.product?.imageUrl ?? null),
        },
        comboId: it.comboId,
        comboItems: comboItemsList,
      };
    }),
  };

  return NextResponse.json({ order: mappedOrder, shop, relatedOrders });
}
