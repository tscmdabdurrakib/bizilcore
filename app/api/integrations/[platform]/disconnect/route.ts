import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/crypto";
import { revokePermissions } from "@/lib/social/meta";
import { disconnectFacebook } from "@/lib/social/facebook";
import { disconnectInstagram } from "@/lib/social/instagram";
import { disconnectWhatsApp } from "@/lib/social/whatsapp";
import { revalidateFbPages } from "@/lib/cache/revalidate";

export const dynamic = "force-dynamic";

const PLATFORMS = ["facebook", "instagram", "whatsapp"];

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  try {
    const { platform } = await params;
    if (!PLATFORMS.includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const conn = await prisma.socialConnection.findUnique({
      where: { shopId_platform: { shopId: shop.id, platform } },
    });
    if (!conn || conn.status !== "connected") {
      return NextResponse.json({ error: "কোনো অ্যাক্টিভ কানেকশন পাওয়া যায়নি।" }, { status: 404 });
    }

    // Best-effort token revoke at Meta (don't block local disconnect on failure)
    if (conn.accessToken) {
      const token = decryptToken(conn.accessToken);
      if (token) await revokePermissions(token);
    }

    if (platform === "facebook") {
      await disconnectFacebook(shop.id);
      revalidateFbPages(shop.id);
    } else if (platform === "instagram") {
      await disconnectInstagram(shop.id);
    } else {
      await disconnectWhatsApp(shop.id, session.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/integrations/[platform]/disconnect failed:", err);
    return NextResponse.json(
      { error: "ডিসকানেক্ট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" },
      { status: 500 },
    );
  }
}
