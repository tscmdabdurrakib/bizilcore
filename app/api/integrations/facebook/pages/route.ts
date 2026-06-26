import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PENDING_FB_COOKIE } from "@/lib/social/meta";
import { getUserPages, parsePendingFbCookie } from "@/lib/social/facebook";

export const dynamic = "force-dynamic";

/** Lists the user's FB Pages during the page-picker step (pending cookie). */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const pending = parsePendingFbCookie(req.cookies.get(PENDING_FB_COOKIE)?.value, shop.id);
    if (!pending) {
      return NextResponse.json(
        { error: "সেশন মেয়াদোত্তীর্ণ হয়েছে। আবার কানেক্ট করার চেষ্টা করুন।" },
        { status: 410 },
      );
    }

    const pages = await getUserPages(pending.token);
    return NextResponse.json({
      platform: pending.platform,
      pages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category ?? null,
        pictureUrl:
          p.picture?.data?.url ??
          `https://graph.facebook.com/${p.id}/picture?type=square&width=80&height=80`,
      })),
    });
  } catch (err) {
    console.error("GET /api/integrations/facebook/pages failed:", err);
    return NextResponse.json(
      { error: "পেজ লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" },
      { status: 500 },
    );
  }
}
