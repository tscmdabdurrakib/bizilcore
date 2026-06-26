import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json([]);

  const suggestions = await prisma.suggestedOrder.findMany({
    where: { shopId: shop.id, status: "pending" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(suggestions);
}

// POST — one-click convert a suggested (comment) order into a draft Order
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const suggestion = await prisma.suggestedOrder.findFirst({ where: { id, shopId: shop.id } });
  if (!suggestion) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (suggestion.status === "converted") {
    return NextResponse.json({ error: "ইতিমধ্যে কনভার্ট করা হয়েছে।" }, { status: 400 });
  }

  // Create a draft order pre-filled with the commenter context. The merchant
  // edits items/amount afterwards; this surfaces the lead in the orders list.
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId: session.user.id,
        source: "facebook",
        status: "pending",
        totalAmount: 0,
        dueAmount: 0,
        note: [
          `💬 Facebook কমেন্ট থেকে`,
          `👤 ${suggestion.commenterName}`,
          suggestion.fbProfile ? `🔗 ${suggestion.fbProfile}` : null,
          `📝 "${suggestion.commentText}"`,
        ].filter(Boolean).join("\n"),
      },
    });
    await tx.suggestedOrder.update({ where: { id }, data: { status: "converted" } });
    const orderRef = created.id.slice(-6).toUpperCase();
    return { order: created, orderRef };
  });

  const replyMessage = `অর্ডার কনফার্ম! #${order.orderRef}\n${suggestion.commenterName}, আমরা শীঘ্রই যোগাযোগ করব। ধন্যবাদ! 🙏`;

  return NextResponse.json({
    success: true,
    orderId: order.order.id,
    orderRef: order.orderRef,
    replyMessage,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !["converted", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const updated = await prisma.suggestedOrder.updateMany({
    where: { id, shopId: shop.id },
    data: { status },
  });

  return NextResponse.json({ success: updated.count > 0 });
}
