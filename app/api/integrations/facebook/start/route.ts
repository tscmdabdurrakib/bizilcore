import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signState } from "@/lib/crypto";
import { NONCE_COOKIE, getBaseUrl, isMetaConfigured } from "@/lib/social/meta";
import { buildFacebookOAuthUrl } from "@/lib/social/facebook";

export const dynamic = "force-dynamic";

/**
 * Starts the Facebook OAuth flow. Also used for Instagram
 * (?platform=instagram) — IG Business accounts connect via their
 * linked Facebook Page, so the dialog is the same with extra scopes.
 */
export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl();

  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(`${baseUrl}/login`);

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.redirect(`${baseUrl}/onboarding`);

  if (!isMetaConfigured()) {
    return NextResponse.redirect(`${baseUrl}/integrations?error=config`);
  }

  const platformParam = req.nextUrl.searchParams.get("platform");
  const platform = platformParam === "instagram" ? "instagram" : "facebook";

  const { state, nonce } = signState({ shopId: shop.id, platform });

  const oauthUrl = buildFacebookOAuthUrl({
    state,
    redirectUri: `${baseUrl}/api/integrations/facebook/callback`,
    includeInstagramScopes: platform === "instagram",
  });

  const res = NextResponse.redirect(oauthUrl);
  res.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: baseUrl.startsWith("https"),
    maxAge: 15 * 60,
    path: "/",
  });
  return res;
}
