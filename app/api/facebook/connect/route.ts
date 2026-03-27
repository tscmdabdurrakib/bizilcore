import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFacebookOAuthURL } from "@/lib/facebook";
import { getAppUrl } from "@/lib/app-url";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/facebook/callback`;

  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    return NextResponse.json({ error: "FACEBOOK_APP_ID এবং FACEBOOK_APP_SECRET সেট করুন।" }, { status: 503 });
  }

  const oauthUrl = getFacebookOAuthURL(redirectUri);
  return NextResponse.redirect(oauthUrl);
}
