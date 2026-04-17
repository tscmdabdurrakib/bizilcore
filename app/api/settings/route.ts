import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeSlugStrict } from "@/lib/slug";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [shop, user] = await Promise.all([
    prisma.shop.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true, name: true, phone: true, email: true, category: true, logoUrl: true,
        address: true, invoiceNote: true, bankAccount: true, bankName: true,
        notifSettings: true, slug: true, businessType: true, salesChannel: true,
        slipPrimaryColor: true, slipAccentColor: true, slipShowBarcode: true,
        slipShowQR: true, slipShowSocialMedia: true, slipCustomMessage: true,
        slipFacebookPage: true, slipWhatsapp: true, slipTemplate: true, slipColorPresets: true,
        slipShowProductPhotos: true, slipHideBrandBadge: true,
      },
    }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
  ]);
  return NextResponse.json({ shop, user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.type === "shop") {
    const shop = await prisma.shop.update({
      where: { userId: session.user.id },
      data: {
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        category: body.category || null,
        address: body.address || null,
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl || null } : {}),
      },
    });
    return NextResponse.json(shop);
  }

  if (body.type === "invoice") {
    const shop = await prisma.shop.update({
      where: { userId: session.user.id },
      data: {
        invoiceNote: body.invoiceNote || null,
        bankAccount: body.bankAccount || null,
        bankName: body.bankName || null,
      },
    });
    return NextResponse.json(shop);
  }

  if (body.type === "user") {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { gender: body.gender || null },
    });
    return NextResponse.json(user);
  }

  if (body.type === "notif") {
    const shop = await prisma.shop.update({
      where: { userId: session.user.id },
      data: { notifSettings: body.settings },
    });
    return NextResponse.json(shop);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
