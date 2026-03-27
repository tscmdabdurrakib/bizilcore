import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ipCache = new Map<string, number>();
const RATE_LIMIT_MS = 30_000;

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    const { slug, path } = await req.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const ip = getIp(req);
    const safePath = typeof path === "string" ? path.slice(0, 200) : "/";
    const cacheKey = `${ip}:${slug}:${safePath}`;
    const now = Date.now();
    const last = ipCache.get(cacheKey) ?? 0;

    if (now - last < RATE_LIMIT_MS) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    ipCache.set(cacheKey, now);

    if (ipCache.size > 10_000) {
      const cutoff = now - RATE_LIMIT_MS * 2;
      for (const [k, v] of ipCache.entries()) {
        if (v < cutoff) ipCache.delete(k);
      }
    }

    const shop = await prisma.shop.findUnique({
      where: { storeSlug: slug },
      select: { id: true, storeEnabled: true },
    });
    if (!shop || !shop.storeEnabled) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    await Promise.all([
      prisma.storePageView.create({
        data: { shopId: shop.id, path: safePath },
      }),
      prisma.shop.update({
        where: { id: shop.id },
        data: { storeVisits: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
