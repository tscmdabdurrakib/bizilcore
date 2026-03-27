import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, quantity, toBranchId, note } = await req.json();

  if (!productId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "পণ্য ও পরিমাণ দিন" }, { status: 400 });
  }

  // Verify product belongs to this user's shop
  const product = await prisma.product.findFirst({
    where: { id: productId, shop: { userId: session.user.id } },
    select: { id: true, name: true, stockQty: true },
  });
  if (!product) return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });

  if (product.stockQty < quantity) {
    return NextResponse.json({ error: `স্টক অপর্যাপ্ত (আছে: ${product.stockQty})` }, { status: 400 });
  }

  // Verify branch belongs to this user's shop (if toBranchId given)
  let branchName = "অন্য শাখা";
  if (toBranchId) {
    const branch = await prisma.shopBranch.findFirst({
      where: { id: toBranchId, shop: { userId: session.user.id } },
      select: { name: true },
    });
    if (!branch) return NextResponse.json({ error: "শাখা পাওয়া যায়নি" }, { status: 404 });
    branchName = branch.name;
  }

  // Deduct stock from main shop + record transfer movement
  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { stockQty: { decrement: quantity } },
    }),
    prisma.stockMovement.create({
      data: {
        productId,
        userId: session.user.id,
        type: "branch_transfer",
        quantity: -quantity,
        reason: `Transfer to: ${branchName}${note ? ` — ${note}` : ""}`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, message: `${quantity}টি ${product.name} ${branchName}-এ স্থানান্তর করা হয়েছে` });
}
