import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAndAwardBadges } from "@/lib/badges";
import { markSetupTask } from "@/lib/setupProgress";
import { getApiShop } from "@/lib/shops/api-shop";

const SHOP_SELECT = {
  id: true, name: true, phone: true, email: true, category: true, logoUrl: true,
  address: true, invoiceNote: true, bankAccount: true, bankName: true,
  notifSettings: true, slug: true, businessType: true, salesChannel: true,
  slipPrimaryColor: true, slipAccentColor: true, slipShowBarcode: true,
  slipShowQR: true, slipShowSocialMedia: true, slipCustomMessage: true,
  slipFacebookPage: true, slipWhatsapp: true, slipTemplate: true, slipColorPresets: true,
  slipShowProductPhotos: true, slipHideBrandBadge: true,
} as const;

async function getActiveShopRecord() {
  const ctx = await getApiShop();
  if ("error" in ctx) return { ok: false as const, error: ctx.error };
  const shop = await prisma.shop.findUnique({
    where: { id: ctx.activeShop.id },
    select: SHOP_SELECT,
  });
  if (!shop) return { ok: false as const, error: NextResponse.json({ error: "Shop not found" }, { status: 404 }) };
  return { ok: true as const, ctx, shop };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const resolved = await getActiveShopRecord();
  if (!resolved.ok) return resolved.error;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return NextResponse.json({ shop: resolved.shop, user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const resolved = await getActiveShopRecord();
  if (!resolved.ok) return resolved.error;
  const shopId = resolved.ctx.activeShop.id;

  if (body.type === "shop") {
    const shop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        category: body.category || null,
        address: body.address || null,
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl || null } : {}),
      },
    });
    checkAndAwardBadges(session.user.id, "profile_complete").catch(() => {});
    markSetupTask(session.user.id, "profile_complete").catch(() => {});
    return NextResponse.json(shop);
  }

  if (body.type === "invoice") {
    const shop = await prisma.shop.update({
      where: { id: shopId },
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
      where: { id: shopId },
      data: { notifSettings: body.settings },
    });
    return NextResponse.json(shop);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
