import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/lib/invoice-pdf";
import React from "react";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: { select: { name: true } }, combo: { select: { name: true } } } },
      user: { include: { shop: true } },
    },
  });

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const resolvedItems = order.items.map(item => {
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
    return { ...item, resolvedName: name };
  });

  const data = {
    orderId: order.id,
    createdAt: order.createdAt.toISOString(),
    shop: { name: order.user.shop?.name ?? "Shop", phone: order.user.shop?.phone },
    customer: order.customer,
    items: resolvedItems,
    totalAmount: order.totalAmount,
    paidAmount: order.paidAmount,
    dueAmount: order.dueAmount,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(InvoiceDocument, { data }) as any);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="INV-${id.slice(-8).toUpperCase()}.pdf"`,
    },
  });
}
