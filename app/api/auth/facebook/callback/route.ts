import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const APP_ID     = process.env.FACEBOOK_APP_ID ?? "";
const APP_SECRET = process.env.FACEBOOK_APP_SECRET ?? "";
const BASE_URL   = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(`${BASE_URL}/login`);

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.redirect(`${BASE_URL}/onboarding`);

  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${BASE_URL}/fb-connect?error=cancelled`);
  }

  const redirectUri = `${BASE_URL}/api/auth/facebook/callback`;

  const tokenRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    new URLSearchParams({ client_id: APP_ID, client_secret: APP_SECRET, redirect_uri: redirectUri, code }),
  );
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${BASE_URL}/fb-connect?error=token`);
  }

  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}&fields=id,name,access_token,category,fan_count`,
  );
  const pagesData = await pagesRes.json();
  const pages: Array<{ id: string; name: string; access_token: string; category?: string; fan_count?: number }> =
    pagesData.data ?? [];

  for (const p of pages) {
    await prisma.facebookPage.upsert({
      where: { shopId_pageId: { shopId: shop.id, pageId: p.id } },
      create: {
        shopId: shop.id,
        pageId: p.id,
        pageName: p.name,
        accessToken: p.access_token,
        category: p.category,
        followers: p.fan_count,
        isActive: true,
      },
      update: {
        pageName: p.name,
        accessToken: p.access_token,
        category: p.category,
        followers: p.fan_count,
        isActive: true,
      },
    });
  }

  return NextResponse.redirect(`${BASE_URL}/fb-connect?success=1`);
}
