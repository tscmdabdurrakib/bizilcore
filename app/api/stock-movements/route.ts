import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { createAutoTask } from "@/lib/autoTasks";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const movements = await prisma.stockMovement.findMany({
    where: { productId, userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(movements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, type, quantity, reason } = await req.json();
  if (!productId || !type || !quantity) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, shopId: true, stockQty: true, lowStockAt: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const qty = parseInt(quantity);
  const delta = type === "out" ? -Math.abs(qty) : Math.abs(qty);

  const [movement] = await Promise.all([
    prisma.stockMovement.create({
      data: {
        productId,
        userId: session.user.id,
        type,
        quantity: delta,
        reason: reason || null,
      },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { stockQty: { increment: delta } },
    }),
  ]);

  await logActivity({
    shopId: product.shopId,
    userId: session.user.id,
    action: type === "in" ? "স্টক বৃদ্ধি" : "স্টক হ্রাস",
    detail: `${product.name} · ${type === "in" ? "+" : "-"}${Math.abs(qty)}${reason ? ` · ${reason}` : ""}`,
  });

  const newStock = product.stockQty + delta;
  if (type === "out" && newStock <= product.lowStockAt) {
    createAutoTask({
      shopId: product.shopId,
      userId: session.user.id,
      title: `স্টক রিঅর্ডার: ${product.name} (বাকি: ${newStock})`,
      category: "supplier",
      priority: newStock <= 0 ? "urgent" : "high",
      dueDaysFromNow: 1,
    }).catch(() => {});
  }

  return NextResponse.json(movement, { status: 201 });
}
