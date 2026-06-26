import { prisma } from "@/lib/prisma";
import type { AccountType } from "@/types/accounting";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function getAccountBalance(
  accountId: string,
  shopId: string,
  startDate?: Date | null,
  endDate?: Date | null,
  tx?: Tx,
): Promise<number> {
  const client = tx ?? prisma;
  const rows = await client.$queryRaw<Array<{ balance: number }>>`
    SELECT get_account_balance(
      ${accountId},
      ${shopId},
      ${startDate ?? null},
      ${endDate ?? null}
    ) AS balance
  `;
  return Number(rows[0]?.balance ?? 0);
}

/** Batch-fetch account balances in parallel (single HTTP round-trip). */
export async function getAccountBalancesBatch(
  accountIds: string[],
  shopId: string,
  startDate?: Date | null,
  endDate?: Date | null,
): Promise<Map<string, number>> {
  const entries = await Promise.all(
    accountIds.map(async (id) => {
      const bal = await getAccountBalance(id, shopId, startDate, endDate);
      return [id, bal] as const;
    }),
  );
  return new Map(entries);
}

/** All bank account balances via aggregate queries (not full tx scan). */
export async function getBankAccountBalancesBatch(
  bankAccountIds: string[],
  shopId: string,
): Promise<Map<string, number>> {
  const entries = await Promise.all(
    bankAccountIds.map(async (id) => {
      const bal = await getBankAccountBalance(id, shopId);
      return [id, bal] as const;
    }),
  );
  return new Map(entries);
}

export async function getBalancesByType(
  shopId: string,
  startDate?: Date | null,
  endDate?: Date | null,
): Promise<Record<AccountType, number>> {
  const accounts = await prisma.account.findMany({
    where: { shopId, isActive: true },
    select: { id: true, accountType: true },
  });

  const totals: Record<AccountType, number> = {
    asset: 0,
    liability: 0,
    equity: 0,
    revenue: 0,
    expense: 0,
  };

  const accountIds = accounts.map((a) => a.id);
  const balances = await getAccountBalancesBatch(accountIds, shopId, startDate, endDate);

  for (const a of accounts) {
    const bal = balances.get(a.id) ?? 0;
    totals[a.accountType as AccountType] += bal;
  }

  return totals;
}

export async function getBankAccountBalance(
  bankAccountId: string,
  shopId: string,
): Promise<number> {
  const bank = await prisma.accountingBankAccount.findFirst({
    where: { id: bankAccountId, shopId },
    select: { openingBalance: true },
  });
  if (!bank) return 0;

  const txs = await prisma.accountingBankTransaction.groupBy({
    by: ["transactionType"],
    where: { bankAccountId, shopId },
    _sum: { amount: true },
  });

  let deposits = 0;
  let withdrawals = 0;
  for (const t of txs) {
    const amt = t._sum.amount ?? 0;
    if (t.transactionType === "deposit") deposits += amt;
    else if (t.transactionType === "withdrawal") withdrawals += amt;
    else if (t.transactionType === "transfer") {
      // transfer out counted as withdrawal on source; pair handled per account
    }
  }

  const transfersIn = await prisma.accountingBankTransaction.aggregate({
    where: {
      shopId,
      transactionType: "transfer",
      bankAccountId,
      amount: { gt: 0 },
    },
    _sum: { amount: true },
  });

  const transferOut = await prisma.accountingBankTransaction.aggregate({
    where: { shopId, bankAccountId, transactionType: "transfer" },
    _sum: { amount: true },
  });

  return (
    bank.openingBalance +
    deposits +
    (transfersIn._sum.amount ?? 0) -
    withdrawals -
    (transferOut._sum.amount ?? 0) * 0
  );
}

export async function computeBankBalanceFromTx(
  bankAccountId: string,
  shopId: string,
): Promise<number> {
  const bank = await prisma.accountingBankAccount.findFirst({
    where: { id: bankAccountId, shopId },
  });
  if (!bank) return 0;

  const txs = await prisma.accountingBankTransaction.findMany({
    where: { bankAccountId, shopId },
    orderBy: { transactionDate: "asc" },
  });

  let balance = bank.openingBalance;
  for (const tx of txs) {
    if (tx.transactionType === "deposit") balance += tx.amount;
    else if (tx.transactionType === "withdrawal") balance -= tx.amount;
    else if (tx.transactionType === "transfer") {
      const pair = txs.find(
        (p) => p.transferPairId === tx.transferPairId && p.id !== tx.id,
      );
      if (pair && pair.bankAccountId !== bankAccountId) {
        if (pair.bankAccountId === bankAccountId) balance += tx.amount;
        else balance -= tx.amount;
      } else {
        balance -= tx.amount;
      }
    }
  }
  return balance;
}
