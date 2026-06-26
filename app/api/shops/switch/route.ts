import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userCanAccessShop } from "@/lib/shops/access";
import { shopApiError } from "@/lib/shops/api-error";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body: { shopId?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { shopId } = body;
    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

    const allowed = await userCanAccessShop(session.user.id, shopId);
    if (!allowed) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    return NextResponse.json({ ok: true, shopId });
  } catch (error) {
    return shopApiError(error, "shops/switch POST");
  }
}
