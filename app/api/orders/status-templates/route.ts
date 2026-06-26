import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActiveShopForApi } from "@/lib/shops/access";
import { getShopEasyConfig, updateShopEasyConfig } from "@/lib/store/shop-easy-config";
import { DEFAULT_ORDER_STATUS_TEMPLATES } from "@/lib/store/order-templates";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const config = await getShopEasyConfig(shopCtx.activeShop.id);
  return NextResponse.json({
    templates: config.orderStatusTemplates?.length
      ? config.orderStatusTemplates
      : DEFAULT_ORDER_STATUS_TEMPLATES,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: 401 });

  const { templates } = await req.json();
  if (!Array.isArray(templates)) {
    return NextResponse.json({ error: "templates array required" }, { status: 400 });
  }

  await updateShopEasyConfig(shopCtx.activeShop.id, { orderStatusTemplates: templates });
  return NextResponse.json({ ok: true });
}
