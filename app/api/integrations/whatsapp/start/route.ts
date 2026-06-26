import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signState } from "@/lib/crypto";
import { NONCE_COOKIE, getBaseUrl, isMetaConfigured } from "@/lib/social/meta";
import { buildWhatsAppSignupUrl, getWhatsAppConfigId } from "@/lib/social/whatsapp";

export const dynamic = "force-dynamic";

/** Starts the WhatsApp Embedded Signup flow (redirect-based). */
export async function GET() {
  const baseUrl = getBaseUrl();

  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(`${baseUrl}/login`);

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.redirect(`${baseUrl}/onboarding`);

  if (!isMetaConfigured() || !getWhatsAppConfigId()) {
    return NextResponse.redirect(`${baseUrl}/integrations?error=wa_config`);
  }

  const { state, nonce } = signState({ shopId: shop.id, platform: "whatsapp" });

  const signupUrl = buildWhatsAppSignupUrl({
    state,
    redirectUri: `${baseUrl}/api/integrations/whatsapp/callback`,
  });

  const res = NextResponse.redirect(signupUrl);
  res.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: baseUrl.startsWith("https"),
    maxAge: 15 * 60,
    path: "/",
  });
  return res;
}
