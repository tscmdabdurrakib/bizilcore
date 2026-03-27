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
        notifSettings: true, slug: true, catalogEnabled: true, catalogTagline: true,
        catalogShowInStockOnly: true, businessType: true, salesChannel: true,
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

  if (body.type === "catalog") {
    const sourceSlug = body.slug ?? "";
    if (!sourceSlug || sourceSlug.trim().length < 3) {
      return NextResponse.json({ error: "Slug কমপক্ষে ৩ অক্ষর হতে হবে" }, { status: 400 });
    }
    const rawSlug = normalizeSlugStrict(sourceSlug);
    if (rawSlug.length < 3) {
      return NextResponse.json({ error: "Slug-এ বৈধ অক্ষর নেই। শুধু ইংরেজি অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন" }, { status: 400 });
    }
    const existing = await prisma.shop.findUnique({ where: { slug: rawSlug } });
    const myShop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
    if (existing && existing.id !== myShop?.id) {
      return NextResponse.json({ error: "এই slug ইতিমধ্যে ব্যবহৃত হচ্ছে" }, { status: 409 });
    }
    const rawTagline = body.catalogTagline?.trim() || null;
    if (rawTagline && rawTagline.length > 200) {
      return NextResponse.json({ error: "ট্যাগলাইন সর্বোচ্চ ২০০ অক্ষর হতে পারবে" }, { status: 400 });
    }
    const shop = await prisma.shop.update({
      where: { userId: session.user.id },
      data: {
        slug: rawSlug,
        catalogEnabled: Boolean(body.catalogEnabled),
        catalogTagline: rawTagline,
        catalogShowInStockOnly: Boolean(body.catalogShowInStockOnly),
      },
    });
    return NextResponse.json(shop);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
