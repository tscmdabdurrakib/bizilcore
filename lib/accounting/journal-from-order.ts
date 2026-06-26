import type { PrismaClient } from "@prisma/client";
import { roundMoney } from "@/types/accounting";
import { COA_CODES, getAccountByCode } from "./seed-coa";
import { createJournalEntry } from "./journal";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

interface OrderForJournal {
  id: string;
  totalAmount: number;
  vatAmount?: number;
  paymentMethod?: string | null;
  dueAmount?: number;
  paidAmount?: number;
  deliveryCharge?: number;
  items: Array<{
    quantity: number;
    product?: { buyPrice: number } | null;
  }>;
}

interface ShopVatSettings {
  vatEnabled: boolean;
  vatRate: number;
  vatMethod: string;
}

function resolvePaymentCode(method: string | null | undefined, dueAmount: number): string {
  if (dueAmount > 0) return COA_CODES.AR;
  const m = (method ?? "cash").toLowerCase();
  if (m === "bkash") return COA_CODES.BKASH;
  if (m === "nagad") return COA_CODES.NAGAD;
  if (m === "bank") return COA_CODES.BANK;
  if (m === "cod" || m === "due") return COA_CODES.AR;
  return COA_CODES.CASH;
}

export async function createSaleJournalFromOrder(
  tx: Tx,
  shopId: string,
  userId: string,
  order: OrderForJournal,
  shop: ShopVatSettings,
  entryDate: Date = new Date(),
): Promise<string | null> {
  const existing = await tx.journalEntry.findFirst({
    where: { shopId, referenceType: "order", referenceId: order.id },
  });
  if (existing) return existing.id;

  const paymentCode = resolvePaymentCode(order.paymentMethod, order.dueAmount ?? 0);
  const paymentAcct = await getAccountByCode(shopId, paymentCode, tx);
  const salesAcct = await getAccountByCode(shopId, COA_CODES.SALES, tx);
  if (!paymentAcct || !salesAcct) return null;

  const total = roundMoney(order.totalAmount);
  const lines: Array<{ accountId: string; debitAmount: number; creditAmount: number; description?: string }> = [];

  if (shop.vatEnabled && shop.vatMethod === "inclusive" && shop.vatRate > 0) {
    const vatAcct = await getAccountByCode(shopId, COA_CODES.VAT_PAYABLE, tx);
    if (vatAcct) {
      const rate = shop.vatRate;
      const netSales = roundMoney(total * (100 / (100 + rate)));
      const vatPart = roundMoney(total - netSales);
      lines.push({ accountId: paymentAcct.id, debitAmount: total, creditAmount: 0, description: "Sale collection" });
      lines.push({ accountId: salesAcct.id, debitAmount: 0, creditAmount: netSales, description: "Sales revenue (net)" });
      lines.push({ accountId: vatAcct.id, debitAmount: 0, creditAmount: vatPart, description: "VAT payable" });
    } else {
      lines.push({ accountId: paymentAcct.id, debitAmount: total, creditAmount: 0 });
      lines.push({ accountId: salesAcct.id, debitAmount: 0, creditAmount: total });
    }
  } else {
    lines.push({ accountId: paymentAcct.id, debitAmount: total, creditAmount: 0, description: "Sale collection" });
    lines.push({ accountId: salesAcct.id, debitAmount: 0, creditAmount: total, description: "Sales revenue" });
  }

  if ((order.deliveryCharge ?? 0) > 0) {
    const delAcct = await getAccountByCode(shopId, COA_CODES.DELIVERY_REV, tx);
    if (delAcct) {
      // delivery already in totalAmount — skip separate line unless split needed
    }
  }

  const cogsAcct = await getAccountByCode(shopId, COA_CODES.COGS, tx);
  const invAcct = await getAccountByCode(shopId, COA_CODES.INVENTORY, tx);
  if (cogsAcct && invAcct) {
    let cogsTotal = 0;
    for (const item of order.items) {
      const cost = item.product?.buyPrice ?? 0;
      cogsTotal += cost * item.quantity;
    }
    cogsTotal = roundMoney(cogsTotal);
    if (cogsTotal > 0) {
      lines.push({ accountId: cogsAcct.id, debitAmount: cogsTotal, creditAmount: 0, description: "COGS" });
      lines.push({ accountId: invAcct.id, debitAmount: 0, creditAmount: cogsTotal, description: "Inventory reduction" });
    }
  }

  const entry = await createJournalEntry(tx, {
    shopId,
    userId,
    entryDate,
    description: `Sale order ${order.id.slice(-6).toUpperCase()}`,
    lines,
    referenceType: "order",
    referenceId: order.id,
    post: true,
  });

  return entry.id;
}
