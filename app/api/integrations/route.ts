import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isMetaConfigured } from "@/lib/social/meta";
import { getWhatsAppConfigId } from "@/lib/social/whatsapp";

export const dynamic = "force-dynamic";

const PLATFORMS = ["facebook", "instagram", "whatsapp"] as const;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const connections = await prisma.socialConnection.findMany({
      where: { shopId: shop.id, platform: { in: [...PLATFORMS] } },
    });

    const EXPIRY_WARNING_MS = 10 * 24 * 60 * 60 * 1000; // 10 days
    const now = Date.now();

    const result = PLATFORMS.map((platform) => {
      const conn = connections.find((c) => c.platform === platform);
      if (!conn || conn.status !== "connected") {
        return { platform, status: conn?.status ?? "not_connected" };
      }
      const meta = (conn.metadata ?? {}) as Record<string, unknown>;
      const expiresAt = conn.tokenExpiresAt ? conn.tokenExpiresAt.getTime() : null;
      const expiringSoon = expiresAt != null && expiresAt - now < EXPIRY_WARNING_MS;
      return {
        platform,
        status: "connected",
        accountId: conn.accountId,
        accountName: conn.accountName,
        accountAvatarUrl: conn.accountAvatarUrl,
        connectedAt: conn.connectedAt,
        tokenExpiresAt: conn.tokenExpiresAt,
        expiringSoon,
        // safe, non-secret extras for the UI
        displayPhoneNumber: meta.display_phone_number ?? null,
        pageName: meta.page_name ?? null,
      };
    });

    return NextResponse.json({
      connections: result,
      configured: isMetaConfigured(),
      whatsappConfigured: isMetaConfigured() && Boolean(getWhatsAppConfigId()),
    });
  } catch (err) {
    console.error("GET /api/integrations failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
