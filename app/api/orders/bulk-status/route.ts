import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";
import { trackForUser } from "@/lib/activity/trackFromSession";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids, status } = await req.json();
  if (!ids?.length || !status) return NextResponse.json({ error: "ids and status required" }, { status: 400 });

  const shopCtx = await getActiveShopForApi();
  const shopId = "error" in shopCtx ? null : shopCtx.activeShop.id;

  const result = await prisma.order.updateMany({
    where: { id: { in: ids }, userId: session.user.id },
    data: { status },
  });

  if (shopId && result.count > 0) {
    trackForUser(session.user.id, shopId, {
      actionType: "order_status_changed",
      actionLabel: `বাল্ক স্ট্যাটাস পরিবর্তন: ${result.count} অর্ডার → ${status}`,
      metadata: { order_ids: ids, new_status: status, count: result.count },
    }).catch(() => {});
  }

  return NextResponse.json({ updated: result.count });
}
