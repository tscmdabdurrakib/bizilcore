import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyState } from "@/lib/crypto";
import {
  MetaApiError,
  NONCE_COOKIE,
  exchangeCodeForToken,
  getBaseUrl,
  isMetaConfigured,
} from "@/lib/social/meta";
import {
  discoverWhatsAppBusinessAccount,
  saveWhatsAppConnection,
} from "@/lib/social/whatsapp";

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

  if (params.get("error") || !code) {
    return redirectWithError(baseUrl, "cancelled");
  }

  const state = stateParam ? verifyState(stateParam) : null;
  const cookieNonce = req.cookies.get(NONCE_COOKIE)?.value;
  if (
    !state ||
    !cookieNonce ||
    state.nonce !== cookieNonce ||
    state.shopId !== shop.id ||
    state.platform !== "whatsapp"
  ) {
    return redirectWithError(baseUrl, "state");
  }

  try {
    const redirectUri = `${baseUrl}/api/integrations/whatsapp/callback`;
    const tokenData = await exchangeCodeForToken(code, redirectUri);

    const { waba, scopes, expiresAt } = await discoverWhatsAppBusinessAccount(
      tokenData.access_token,
    );

    if (waba.phoneNumbers.length === 0) {
      // Signup finished but no phone number added/verified yet
      return redirectWithError(baseUrl, "wa_no_phone");
    }

    await saveWhatsAppConnection({
      shopId: shop.id,
      userId: session.user.id,
      accessToken: tokenData.access_token,
      waba,
      scopes,
      expiresAt,
    });

    const phone = waba.phoneNumbers[0];
    const verified = phone.code_verification_status === "VERIFIED";
    const res = NextResponse.redirect(
      `${baseUrl}/integrations?connected=whatsapp${verified ? "" : "&warn=wa_unverified"}`,
    );
    res.cookies.delete(NONCE_COOKIE);
    return res;
  } catch (err) {
    console.error("WhatsApp signup callback failed:", err);
    if (err instanceof MetaApiError && err.message.includes("No WhatsApp Business Account")) {
      return redirectWithError(baseUrl, "wa_no_waba");
    }
    return redirectWithError(baseUrl, "token");
  }
}
