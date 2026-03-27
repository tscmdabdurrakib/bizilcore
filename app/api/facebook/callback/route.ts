import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForToken, getLongLivedToken, getUserPages } from "@/lib/facebook";
import { getAppUrl } from "@/lib/app-url";

export async function GET(req: NextRequest) {
  const session = await auth();
  const appUrl = getAppUrl();

  if (!session?.user?.id) return NextResponse.redirect(`${appUrl}/login`);

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/settings?tab=facebook&error=cancelled`);
  }

  try {
    const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
    if (!shop) return NextResponse.redirect(`${appUrl}/settings?tab=facebook&error=no-shop`);

    const redirectUri = `${appUrl}/api/facebook/callback`;
    const shortToken = await exchangeCodeForToken(code, redirectUri);
    const longToken = await getLongLivedToken(shortToken);
    const pages = await getUserPages(longToken);

    if (pages.length === 0) {
      return NextResponse.redirect(`${appUrl}/settings?tab=facebook&error=no-pages`);
    }

    // Use the first page (in a real flow, show a page selection modal)
    const page = pages[0];

    await prisma.facebookConnection.upsert({
      where: { shopId: shop.id },
      create: {
        shopId: shop.id,
        pageId: page.id,
        pageName: page.name,
        accessToken: page.access_token,
        isActive: true,
      },
      update: {
        pageId: page.id,
        pageName: page.name,
        accessToken: page.access_token,
        isActive: true,
        connectedAt: new Date(),
      },
    });

    return NextResponse.redirect(`${appUrl}/settings?tab=facebook&success=1`);
  } catch (err) {
    console.error("Facebook callback error:", err);
    return NextResponse.redirect(`${appUrl}/settings?tab=facebook&error=auth-failed`);
  }
}
