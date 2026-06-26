import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { expenseBaseWhere, getShopForUser } from "@/lib/expenses/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const { ids, action, category } = body as {
    ids: string[];
    action: "delete" | "category";
    category?: string;
  };

  if (!ids?.length || !action) {
    return NextResponse.json({ error: "ids and action required" }, { status: 400 });
  }

  const where = {
    id: { in: ids },
    ...expenseBaseWhere(shop.id, session.user.id),
  };

  if (action === "delete") {
    const result = await prisma.transaction.deleteMany({ where });
    await logActivity({
      userId: session.user.id,
      shopId: shop.id,
      action: "expense_bulk_delete",
      detail: `${result.count}টি খরচ মুছে ফেলা হয়েছে`,
    });
    return NextResponse.json({ deleted: result.count });
  }

  if (action === "category" && category) {
    const result = await prisma.transaction.updateMany({
      where,
      data: { category },
    });
    return NextResponse.json({ updated: result.count });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
