import type { PrismaClient } from "@prisma/client";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

interface CoaAccountDef {
  code: string;
  name: string;
  category: string;
  accountType: "asset" | "liability" | "equity" | "revenue" | "expense";
  normalBalance: "debit" | "credit";
}

const DEFAULT_COA: CoaAccountDef[] = [
  { code: "1000", name: "Cash in Hand", category: "Current Assets", accountType: "asset", normalBalance: "debit" },
  { code: "1001", name: "bKash Account", category: "Current Assets", accountType: "asset", normalBalance: "debit" },
  { code: "1002", name: "Nagad Account", category: "Current Assets", accountType: "asset", normalBalance: "debit" },
  { code: "1003", name: "Bank Account (Current)", category: "Current Assets", accountType: "asset", normalBalance: "debit" },
  { code: "1100", name: "Accounts Receivable", category: "Current Assets", accountType: "asset", normalBalance: "debit" },
  { code: "1200", name: "Inventory", category: "Current Assets", accountType: "asset", normalBalance: "debit" },
  { code: "1300", name: "Prepaid Expenses", category: "Current Assets", accountType: "asset", normalBalance: "debit" },
  { code: "2000", name: "Accounts Payable", category: "Current Liabilities", accountType: "liability", normalBalance: "credit" },
  { code: "2100", name: "VAT Payable (15%)", category: "Current Liabilities", accountType: "liability", normalBalance: "credit" },
  { code: "2200", name: "Short-term Loans", category: "Current Liabilities", accountType: "liability", normalBalance: "credit" },
  { code: "2300", name: "Accrued Expenses", category: "Current Liabilities", accountType: "liability", normalBalance: "credit" },
  { code: "3000", name: "Owner's Equity", category: "Equity", accountType: "equity", normalBalance: "credit" },
  { code: "3100", name: "Retained Earnings", category: "Equity", accountType: "equity", normalBalance: "credit" },
  { code: "3200", name: "Drawings", category: "Equity", accountType: "equity", normalBalance: "credit" },
  { code: "4000", name: "Sales Revenue", category: "Revenue", accountType: "revenue", normalBalance: "credit" },
  { code: "4100", name: "Service Revenue", category: "Revenue", accountType: "revenue", normalBalance: "credit" },
  { code: "4200", name: "Other Income", category: "Revenue", accountType: "revenue", normalBalance: "credit" },
  { code: "4300", name: "Delivery Charge Revenue", category: "Revenue", accountType: "revenue", normalBalance: "credit" },
  { code: "5000", name: "Cost of Goods Sold (COGS)", category: "Operating Expenses", accountType: "expense", normalBalance: "debit" },
  { code: "5100", name: "Rent Expense", category: "Operating Expenses", accountType: "expense", normalBalance: "debit" },
  { code: "5200", name: "Salary Expense", category: "Operating Expenses", accountType: "expense", normalBalance: "debit" },
  { code: "5300", name: "Utility Expense", category: "Operating Expenses", accountType: "expense", normalBalance: "debit" },
  { code: "5400", name: "Marketing & Advertising", category: "Operating Expenses", accountType: "expense", normalBalance: "debit" },
  { code: "5500", name: "SMS & Communication", category: "Operating Expenses", accountType: "expense", normalBalance: "debit" },
  { code: "5600", name: "Packaging & Delivery", category: "Operating Expenses", accountType: "expense", normalBalance: "debit" },
  { code: "5700", name: "Bank & Payment Charges", category: "Operating Expenses", accountType: "expense", normalBalance: "debit" },
  { code: "5800", name: "Miscellaneous Expense", category: "Operating Expenses", accountType: "expense", normalBalance: "debit" },
];

export async function createDefaultCoa(shopId: string, tx?: Tx): Promise<void> {
  const client = tx ?? (await import("@/lib/prisma")).prisma;

  const categoryCache = new Map<string, string>();

  for (const def of DEFAULT_COA) {
    let categoryId = categoryCache.get(`${def.accountType}:${def.category}`);
    if (!categoryId) {
      const existing = await client.accountCategory.findFirst({
        where: { shopId, name: def.category, type: def.accountType },
      });
      if (existing) {
        categoryId = existing.id;
      } else {
        const created = await client.accountCategory.create({
          data: { shopId, name: def.category, type: def.accountType },
        });
        categoryId = created.id;
      }
      categoryCache.set(`${def.accountType}:${def.category}`, categoryId);
    }

    const exists = await client.account.findUnique({
      where: { shopId_code: { shopId, code: def.code } },
    });
    if (exists) continue;

    await client.account.create({
      data: {
        shopId,
        categoryId,
        code: def.code,
        name: def.name,
        accountType: def.accountType,
        normalBalance: def.normalBalance,
        isSystem: true,
        isActive: true,
      },
    });
  }

  const expenseLinks = [
    { name: "Rent", code: "5100" },
    { name: "Salary", code: "5200" },
    { name: "Utility", code: "5300" },
    { name: "Marketing", code: "5400" },
    { name: "SMS & Communication", code: "5500" },
    { name: "Packaging & Delivery", code: "5600" },
    { name: "Bank Charges", code: "5700" },
    { name: "Miscellaneous", code: "5800" },
  ];

  for (const exp of expenseLinks) {
    const acct = await client.account.findUnique({
      where: { shopId_code: { shopId, code: exp.code } },
    });
    if (!acct) continue;
    const exists = await client.expenseCategory.findFirst({
      where: { shopId, name: exp.name },
    });
    if (exists) continue;
    await client.expenseCategory.create({
      data: { shopId, name: exp.name, accountId: acct.id },
    });
  }
}

export async function getAccountByCode(
  shopId: string,
  code: string,
  tx?: Tx,
) {
  const client = tx ?? (await import("@/lib/prisma")).prisma;
  return client.account.findUnique({
    where: { shopId_code: { shopId, code } },
  });
}

export const COA_CODES = {
  CASH: "1000",
  BKASH: "1001",
  NAGAD: "1002",
  BANK: "1003",
  AR: "1100",
  INVENTORY: "1200",
  AP: "2000",
  VAT_PAYABLE: "2100",
  SALES: "4000",
  DELIVERY_REV: "4300",
  COGS: "5000",
} as const;

export async function backfillAllShopsCoa(): Promise<number> {
  const { prisma } = await import("@/lib/prisma");
  const shops = await prisma.shop.findMany({ select: { id: true } });
  for (const shop of shops) {
    await createDefaultCoa(shop.id);
  }
  return shops.length;
}
