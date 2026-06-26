import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPrimaryShop } from "@/lib/shops/access";
import { shopApiError } from "@/lib/shops/api-error";

interface TransferItem {
  productId: string;
  quantity: number;
}

type Direction = "main_to_branch" | "branch_to_main" | "branch_to_branch";

export async function POST(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const direction = (body.direction ?? "main_to_branch") as Direction;
  const note: string | undefined = body.note;
  const toBranchId: string | undefined = body.toBranchId;
  const fromBranchId: string | undefined = body.fromBranchId;

  const items: TransferItem[] = body.items?.length
    ? body.items
    : body.productId
      ? [{ productId: body.productId, quantity: body.quantity }]
      : [];

  if (items.length === 0 || items.some(i => !i.productId || !i.quantity || i.quantity < 1)) {
    return NextResponse.json({ error: "পণ্য ও পরিমাণ দিন" }, { status: 400 });
  }

  const mainShop = await getPrimaryShop(session.user.id);
  if (!mainShop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  if (direction === "branch_to_branch") {
    if (!fromBranchId || !toBranchId) {
      return NextResponse.json({ error: "উৎস ও গন্তব্য branch দিন" }, { status: 400 });
    }
    if (fromBranchId === toBranchId) {
      return NextResponse.json({ error: "উৎস ও গন্তব্য আলাদা হতে হবে" }, { status: 400 });
    }
  }

  const sourceBranchId = direction === "main_to_branch" ? null : (direction === "branch_to_branch" ? fromBranchId : fromBranchId);
  const destBranchId = direction === "branch_to_main" ? null : (direction === "branch_to_branch" ? toBranchId : toBranchId);

  const branchIdsToVerify = [sourceBranchId, destBranchId].filter(Boolean) as string[];
  const branches = branchIdsToVerify.length
    ? await prisma.shopBranch.findMany({
        where: { id: { in: branchIdsToVerify }, shopId: mainShop.id, isActive: true },
        select: { id: true, name: true },
      })
    : [];

  const branchMap = new Map(branches.map(b => [b.id, b]));
  const sourceBranch = sourceBranchId ? branchMap.get(sourceBranchId) : null;
  const destBranch = destBranchId ? branchMap.get(destBranchId) : null;

  if (direction !== "main_to_branch" && !sourceBranch) {
    return NextResponse.json({ error: "উৎস branch পাওয়া যায়নি বা নিষ্ক্রিয়" }, { status: 404 });
  }
  if (direction !== "branch_to_main" && !destBranch) {
    return NextResponse.json({ error: "গন্তব্য branch পাওয়া যায়নি বা নিষ্ক্রিয়" }, { status: 404 });
  }

  const productIds = items.map(i => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId: mainShop.id },
    select: { id: true, name: true, stockQty: true },
  });
  const productMap = new Map(products.map(p => [p.id, p]));

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });

    if (direction === "main_to_branch") {
      if (product.stockQty < item.quantity) {
        return NextResponse.json({ error: `${product.name}: স্টক অপর্যাপ্ত (আছে: ${product.stockQty})` }, { status: 400 });
      }
    } else if (direction === "branch_to_main" || direction === "branch_to_branch") {
      const bs = await prisma.branchStock.findUnique({
        where: { branchId_productId: { branchId: sourceBranchId!, productId: item.productId } },
      });
      const avail = bs?.quantity ?? 0;
      if (avail < item.quantity) {
        return NextResponse.json({ error: `${product.name}: উৎস branch-এ স্টক অপর্যাপ্ত (আছে: ${avail})` }, { status: 400 });
      }
    }
  }

  const reasonNote = note ? ` — ${note}` : "";
  const ops = [];

  for (const item of items) {
    const product = productMap.get(item.productId)!;

    if (direction === "main_to_branch") {
      ops.push(
        prisma.product.update({ where: { id: item.productId }, data: { stockQty: { decrement: item.quantity } } }),
        prisma.branchStock.upsert({
          where: { branchId_productId: { branchId: destBranchId!, productId: item.productId } },
          create: { branchId: destBranchId!, productId: item.productId, quantity: item.quantity },
          update: { quantity: { increment: item.quantity } },
        }),
        prisma.stockMovement.create({
          data: {
            productId: item.productId,
            userId: session.user.id,
            type: "branch_transfer",
            quantity: -item.quantity,
            reason: `Transfer to: ${destBranch!.name}${reasonNote}`,
            branchId: destBranchId,
            toBranchId: destBranchId,
            direction,
          },
        }),
      );
    } else if (direction === "branch_to_main") {
      ops.push(
        prisma.branchStock.update({
          where: { branchId_productId: { branchId: sourceBranchId!, productId: item.productId } },
          data: { quantity: { decrement: item.quantity } },
        }),
        prisma.product.update({ where: { id: item.productId }, data: { stockQty: { increment: item.quantity } } }),
        prisma.stockMovement.create({
          data: {
            productId: item.productId,
            userId: session.user.id,
            type: "branch_transfer",
            quantity: item.quantity,
            reason: `Transfer from: ${sourceBranch!.name}${reasonNote}`,
            branchId: sourceBranchId,
            fromBranchId: sourceBranchId,
            direction,
          },
        }),
      );
    } else {
      ops.push(
        prisma.branchStock.update({
          where: { branchId_productId: { branchId: sourceBranchId!, productId: item.productId } },
          data: { quantity: { decrement: item.quantity } },
        }),
        prisma.branchStock.upsert({
          where: { branchId_productId: { branchId: destBranchId!, productId: item.productId } },
          create: { branchId: destBranchId!, productId: item.productId, quantity: item.quantity },
          update: { quantity: { increment: item.quantity } },
        }),
        prisma.stockMovement.create({
          data: {
            productId: item.productId,
            userId: session.user.id,
            type: "branch_transfer",
            quantity: -item.quantity,
            reason: `Transfer ${sourceBranch!.name} → ${destBranch!.name}${reasonNote}`,
            branchId: destBranchId,
            fromBranchId: sourceBranchId,
            toBranchId: destBranchId,
            direction,
          },
        }),
      );
    }
  }

  await prisma.$transaction(ops);

  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const label =
    direction === "main_to_branch" ? `${destBranch!.name}-এ ${totalQty}টি পণ্য পাঠানো হয়েছে`
    : direction === "branch_to_main" ? `${sourceBranch!.name} থেকে ${totalQty}টি পণ্য ফেরত নেওয়া হয়েছে`
    : `${sourceBranch!.name} → ${destBranch!.name}: ${totalQty}টি পণ্য স্থানান্তর`;

  return NextResponse.json({ success: true, message: label });
  } catch (error) {
    return shopApiError(error, "shops/transfer POST");
  }
}
