import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveActiveShop } from "@/lib/shops/access";
import { shopApiError } from "@/lib/shops/api-error";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { accessibleShops } = await resolveActiveShop(
      session.user.id,
      (session.user as { activeShopId?: string }).activeShopId,
    );

    return NextResponse.json({ shops: accessibleShops });
  } catch (error) {
    return shopApiError(error, "shops/list GET");
  }
}
