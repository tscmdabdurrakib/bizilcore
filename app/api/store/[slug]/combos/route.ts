import { NextResponse } from "next/server";
import { getStoreCombos } from "@/lib/store/combos";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug, storeEnabled: true },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "Store not found" }, { status: 404 });
  const combos = await getStoreCombos(shop.id);
  return NextResponse.json(combos);
}
