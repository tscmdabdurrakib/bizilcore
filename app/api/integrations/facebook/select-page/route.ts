import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PENDING_FB_COOKIE } from "@/lib/social/meta";
import {
  FACEBOOK_SCOPES,
  INSTAGRAM_EXTRA_SCOPES,
  getUserPages,
  parsePendingFbCookie,
  saveFacebookConnection,
} from "@/lib/social/facebook";
import { getLinkedInstagramAccount, saveInstagramConnection } from "@/lib/social/instagram";
import { revalidateFbPages } from "@/lib/cache/revalidate";

export const dynamic = "force-dynamic";

/** Saves the connection for the page the user picked in the picker modal. */
export async function POST(req: NextRequest) {
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

    const { pageId } = (await req.json()) as { pageId?: string };
    if (!pageId) {
      return NextResponse.json({ error: "পেজ সিলেক্ট করুন।" }, { status: 400 });
    }

    // Re-fetch from Graph (never trust client-sent page data)
    const pages = await getUserPages(pending.token);
    const page = pages.find((p) => p.id === pageId);
    if (!page) {
      return NextResponse.json({ error: "এই পেজটি আপনার তালিকায় পাওয়া যায়নি।" }, { status: 404 });
    }

    const platform = pending.platform;
    const scopes =
      platform === "instagram" ? [...FACEBOOK_SCOPES, ...INSTAGRAM_EXTRA_SCOPES] : FACEBOOK_SCOPES;

    if (platform === "instagram") {
      const ig = await getLinkedInstagramAccount(page.id, page.access_token);
      if (!ig) {
        return NextResponse.json(
          {
            error:
              "এই Facebook Page-এর সাথে কোনো Instagram Business অ্যাকাউন্ট লিংক করা নেই। অনুগ্রহ করে আপনার Instagram অ্যাকাউন্টকে Professional/Business করে Facebook Page-এর সাথে লিংক করুন।",
          },
          { status: 422 },
        );
      }
      await saveInstagramConnection({
        shopId: shop.id,
        igAccount: ig,
        page,
        scopes,
        tokenExpiresIn: pending.expiresIn ?? undefined,
      });
    } else {
      await saveFacebookConnection({
        shopId: shop.id,
        page,
        scopes,
        tokenExpiresIn: pending.expiresIn ?? undefined,
      });
    }

    revalidateFbPages(shop.id);
    const res = NextResponse.json({ success: true, platform });
    res.cookies.delete(PENDING_FB_COOKIE);
    return res;
  } catch (err) {
    console.error("POST /api/integrations/facebook/select-page failed:", err);
    return NextResponse.json(
      { error: "কানেকশন সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" },
      { status: 500 },
    );
  }
}
