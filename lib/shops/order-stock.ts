import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export type RegularOrderItem = { productId: string; quantity: number };
export type ComboComponent = { productId: string; variantId?: string | null; quantity: number };
export type ComboOrderItem = { comboId: string; quantity: number; comboSnapshot?: string | null };

export function parseComboComponents(
  comboSnapshot: string | null | undefined,
  fallback?: ComboComponent[] | null
): ComboComponent[] {
  if (comboSnapshot) {
    try {
      const snap = JSON.parse(comboSnapshot) as { items?: ComboComponent[] };
      if (snap.items?.length) return snap.items;
    } catch {
      /* fall through */
    }
  }
  return fallback ?? [];
}

export async function assertBranchStockAvailable(
  tx: Tx,
  branchId: string,
  regularItems: RegularOrderItem[],
  comboItems: ComboOrderItem[],
  comboMap: Record<string, { items: ComboComponent[] }>
): Promise<string | null> {
  const needed = new Map<string, number>();

  for (const item of regularItems) {
    needed.set(item.productId, (needed.get(item.productId) ?? 0) + item.quantity);
  }

  for (const item of comboItems) {
    const combo = comboMap[item.comboId];
    if (!combo) continue;
    for (const ci of combo.items) {
      // Branch stock is tracked at product level (variants share branch qty)
      needed.set(ci.productId, (needed.get(ci.productId) ?? 0) + ci.quantity * item.quantity);
    }
  }

  if (needed.size === 0) return null;

  const stocks = await tx.branchStock.findMany({
    where: { branchId, productId: { in: [...needed.keys()] } },
    include: { product: { select: { name: true } } },
  });
  const stockMap = new Map(stocks.map(s => [s.productId, s]));

  for (const [productId, qty] of needed) {
    const row = stockMap.get(productId);
    if (!row || row.quantity < qty) {
      const name = row?.product.name ?? productId;
      return `${name}: branch stock insufficient (need ${qty}, have ${row?.quantity ?? 0})`;
    }
  }

  return null;
}

async function incrementBranchStock(tx: Tx, branchId: string, productId: string, qty: number) {
  await tx.branchStock.upsert({
    where: { branchId_productId: { branchId, productId } },
    create: { branchId, productId, quantity: qty },
    update: { quantity: { increment: qty } },
  });
}

async function decrementBranchStock(tx: Tx, branchId: string, productId: string, qty: number) {
  await tx.branchStock.update({
    where: { branchId_productId: { branchId, productId } },
    data: { quantity: { decrement: qty } },
  });
}

export async function deductOrderStock(
  tx: Tx,
  branchId: string | null | undefined,
  regularItems: RegularOrderItem[],
  comboItems: ComboOrderItem[],
  comboMap: Record<string, { items: ComboComponent[] }>
) {
  if (!branchId) {
    for (const item of regularItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { decrement: item.quantity } },
      });
    }
    for (const item of comboItems) {
      const combo = comboMap[item.comboId];
      if (!combo) continue;
      for (const ci of combo.items) {
        if (ci.variantId) {
          await tx.productVariant.update({
            where: { id: ci.variantId },
            data: { stockQty: { decrement: ci.quantity * item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: ci.productId },
            data: { stockQty: { decrement: ci.quantity * item.quantity } },
          });
        }
      }
    }
    return;
  }

  for (const item of regularItems) {
    await decrementBranchStock(tx, branchId, item.productId, item.quantity);
  }
  for (const item of comboItems) {
    const combo = comboMap[item.comboId];
    if (!combo) continue;
    for (const ci of combo.items) {
      await decrementBranchStock(tx, branchId, ci.productId, ci.quantity * item.quantity);
    }
  }
}

export async function restoreOrderStock(
  tx: Tx,
  branchId: string | null | undefined,
  items: Array<{
    productId: string | null;
    comboId: string | null;
    comboSnapshot: string | null;
    quantity: number;
    combo?: { items: ComboComponent[] } | null;
  }>
) {
  for (const item of items) {
    if (item.productId) {
      if (branchId) {
        await incrementBranchStock(tx, branchId, item.productId, item.quantity);
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
      }
    } else if (item.comboId) {
      const components = parseComboComponents(item.comboSnapshot, item.combo?.items ?? null);
      for (const ci of components) {
        if (branchId) {
          await incrementBranchStock(tx, branchId, ci.productId, ci.quantity * item.quantity);
        } else if (ci.variantId) {
          await tx.productVariant.updateMany({
            where: { id: ci.variantId },
            data: { stockQty: { increment: ci.quantity * item.quantity } },
          });
        } else {
          await tx.product.updateMany({
            where: { id: ci.productId },
            data: { stockQty: { increment: ci.quantity * item.quantity } },
          });
        }
      }
    }
  }
}
