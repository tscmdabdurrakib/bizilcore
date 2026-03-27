import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { clientId, clientSecret, username, password, storeId, sandboxMode } = body as {
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    storeId?: string;
    sandboxMode?: boolean;
  };

  if (!clientId || !clientSecret || !username || !password || !storeId) {
    return NextResponse.json({ error: "সব তথ্য পূরণ করুন" }, { status: 400 });
  }

  const baseUrl = sandboxMode
    ? "https://hermes-sandbox.pathao.com"
    : "https://hermes.pathao.com";

  try {
    const res = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        username: username.trim(),
        password: password.trim(),
        grant_type: "password",
      }),
    });

    const data = await res.json();
    if (!data.access_token) {
      const msg = data.message ?? data.error ?? "অবৈধ credentials";
      return NextResponse.json({ error: `Pathao সংযোগ ব্যর্থ: ${msg}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Pathao সংযোগ সফল! (${sandboxMode ? "Sandbox" : "Production"})`,
    });
  } catch {
    return NextResponse.json({ error: "Pathao সার্ভারে পৌঁছানো যাচ্ছে না" }, { status: 502 });
  }
}
