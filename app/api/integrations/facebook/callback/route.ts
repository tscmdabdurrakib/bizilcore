import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptToken, verifyState } from "@/lib/crypto";
import {
  NONCE_COOKIE,
  PENDING_FB_COOKIE,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  getBaseUrl,
  isMetaConfigured,
} from "@/lib/social/meta";
import { getUserPages, saveFacebookConnection, FACEBOOK_SCOPES, INSTAGRAM_EXTRA_SCOPES } from "@/lib/social/facebook";
import { getLinkedInstagramAccount, saveInstagramConnection } from "@/lib/social/instagram";
import { trackForUser } from "@/lib/activity/trackFromSession";
import { revalidateFbPages } from "@/lib/cache/revalidate";

export const dynamic = "force-dynamic";

function redirectWithError(baseUrl: string, error: string) {
  const res = NextResponse.redirect(`${baseUrl}/integrations?error=${error}`);
  res.cookies.delete(NONCE_COOKIE);
  return res;
}

export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl();

  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(`${baseUrl}/login`);

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.redirect(`${baseUrl}/onboarding`);

  if (!isMetaConfigured()) return redirectWithError(baseUrl, "config");

  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const stateParam = params.get("state");

  // User denied permissions or Meta returned an error
  if (params.get("error") || !code) {
    return redirectWithError(baseUrl, "cancelled");
  }

  // CSRF: verify signed state + nonce cookie + tenant match
  const state = stateParam ? verifyState(stateParam) : null;
  const cookieNonce = req.cookies.get(NONCE_COOKIE)?.value;
  if (!state || !cookieNonce || state.nonce !== cookieNonce || state.shopId !== shop.id) {
    return redirectWithError(baseUrl, "state");
  }
  const platform = state.platform === "instagram" ? "instagram" : "facebook";

  try {
    // Code → short-lived token → long-lived token (~60 days)
    const redirectUri = `${baseUrl}/api/integrations/facebook/callback`;
    const shortToken = await exchangeCodeForToken(code, redirectUri);
    const longToken = await exchangeForLongLivedToken(shortToken.access_token);

    const pages = await getUserPages(longToken.access_token);
    if (pages.length === 0) {
      return redirectWithError(baseUrl, "no_pages");
    }

    const grantedScopes =
      platform === "instagram" ? [...FACEBOOK_SCOPES, ...INSTAGRAM_EXTRA_SCOPES] : FACEBOOK_SCOPES;

    if (pages.length === 1) {
      const page = pages[0];

      if (platform === "instagram") {
        const ig = await getLinkedInstagramAccount(page.id, page.access_token);
        if (!ig) return redirectWithError(baseUrl, "no_instagram");
        await saveInstagramConnection({
          shopId: shop.id,
          igAccount: ig,
          page,
          scopes: grantedScopes,
          tokenExpiresIn: longToken.expires_in,
        });
      } else {
        await saveFacebookConnection({
          shopId: shop.id,
          page,
          scopes: grantedScopes,
          tokenExpiresIn: longToken.expires_in,
        });
      }

      trackForUser(session.user.id, shop.id, {
        actionType: "facebook_connected",
        actionLabel: `Facebook সংযুক্ত: ${page.name}`,
        metadata: { page_id: page.id, page_name: page.name, platform },
      }).catch(() => {});

      if (platform === "facebook") revalidateFbPages(shop.id);

      const res = NextResponse.redirect(`${baseUrl}/integrations?connected=${platform}`);
      res.cookies.delete(NONCE_COOKIE);
      return res;
    }

    // Multiple pages → stash the long-lived user token (encrypted) in a
    // short-lived cookie and let the user pick a page in the UI.
    const pending = encryptToken(
      JSON.stringify({
        token: longToken.access_token,
        platform,
        expiresIn: longToken.expires_in ?? null,
        shopId: shop.id,
      }),
    );
    const res = NextResponse.redirect(`${baseUrl}/integrations?picker=${platform}`);
    res.cookies.delete(NONCE_COOKIE);
    res.cookies.set(PENDING_FB_COOKIE, pending, {
      httpOnly: true,
      sameSite: "lax",
      secure: baseUrl.startsWith("https"),
      maxAge: 15 * 60,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("Facebook OAuth callback failed:", err);
    return redirectWithError(baseUrl, "token");
  }
}
