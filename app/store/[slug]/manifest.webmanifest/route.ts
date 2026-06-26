import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug, storeEnabled: true },
    select: { name: true, storeSlug: true, storePwaEnabled: true, logoUrl: true, storePrimaryColor: true },
  });
  if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    name: shop.name,
    short_name: shop.name.slice(0, 12),
    start_url: `/store/${slug}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: shop.storePrimaryColor || "#000000",
    icons: shop.logoUrl ? [{ src: shop.logoUrl, sizes: "512x512", type: "image/png" }] : [],
  }, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
