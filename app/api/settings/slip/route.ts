import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const shop = await prisma.shop.update({
    where: { userId: session.user.id },
    data: {
      slipPrimaryColor:    body.slipPrimaryColor    ?? undefined,
      slipAccentColor:     body.slipAccentColor     ?? undefined,
      slipShowBarcode:     body.slipShowBarcode     ?? undefined,
      slipShowQR:          body.slipShowQR          ?? undefined,
      slipShowSocialMedia: body.slipShowSocialMedia ?? undefined,
      slipCustomMessage:   body.slipCustomMessage   ?? undefined,
      slipFacebookPage:    body.slipFacebookPage    ?? undefined,
      slipWhatsapp:        body.slipWhatsapp        ?? undefined,
      slipTemplate:             body.slipTemplate             ?? undefined,
      slipColorPresets:         body.slipColorPresets         ?? undefined,
      slipShowProductPhotos:    body.slipShowProductPhotos    ?? undefined,
      slipHideBrandBadge:       body.slipHideBrandBadge      ?? undefined,
    },
    select: {
      slipPrimaryColor: true, slipAccentColor: true,
      slipShowBarcode: true, slipShowQR: true,
      slipShowSocialMedia: true, slipCustomMessage: true,
      slipFacebookPage: true, slipWhatsapp: true, slipTemplate: true, slipColorPresets: true,
      slipShowProductPhotos: true, slipHideBrandBadge: true,
    },
  });

  return NextResponse.json(shop);
}
