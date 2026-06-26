import type { PrismaClient } from "@prisma/client";
import { isJournalBalanced, roundMoney, type JournalLineInput } from "@/types/accounting";
import { generateEntryNumber } from "./entry-number";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

export interface CreateJournalParams {
  shopId: string;
  userId: string;
  entryDate: Date;
  description: string;
  lines: JournalLineInput[];
  referenceType?: string;
  referenceId?: string;
  post?: boolean;
}

export async function createJournalEntry(
  tx: Tx,
  params: CreateJournalParams,
) {
  const { shopId, userId, entryDate, description, lines, referenceType, referenceId, post } = params;

  if (!lines.length) throw new Error("Journal must have at least one line");
  if (!isJournalBalanced(lines)) {
    throw new Error("Journal entry is not balanced");
  }

  const entryNumber = await generateEntryNumber(tx, shopId, entryDate);
  const status = post ? "posted" : "draft";

  const entry = await tx.journalEntry.create({
    data: {
      shopId,
      entryNumber,
      entryDate,
      description,
      referenceType: referenceType ?? null,
      referenceId: referenceId ?? null,
      status,
      createdById: userId,
      postedAt: post ? new Date() : null,
      lines: {
        create: lines.map((l, i) => ({
          shopId,
          accountId: l.accountId,
          debitAmount: roundMoney(l.debitAmount || 0),
          creditAmount: roundMoney(l.creditAmount || 0),
          description: l.description ?? null,
          lineOrder: i,
        })),
      },
    },
    include: { lines: { include: { account: true } } },
  });

  return entry;
}

export async function postJournalEntry(
  tx: Tx,
  entryId: string,
  shopId: string,
) {
  const entry = await tx.journalEntry.findFirst({
    where: { id: entryId, shopId },
    include: { lines: true },
  });
  if (!entry) throw new Error("Journal entry not found");
  if (entry.status !== "draft") throw new Error("Only draft entries can be posted");

  const debit = entry.lines.reduce((s, l) => s + l.debitAmount, 0);
  const credit = entry.lines.reduce((s, l) => s + l.creditAmount, 0);
  if (Math.abs(debit - credit) > 0.01) throw new Error("Journal entry is not balanced");

  return tx.journalEntry.update({
    where: { id: entryId },
    data: { status: "posted", postedAt: new Date() },
    include: { lines: { include: { account: true } } },
  });
}

export async function reverseJournalEntry(
  tx: Tx,
  entryId: string,
  shopId: string,
  userId: string,
) {
  const original = await tx.journalEntry.findFirst({
    where: { id: entryId, shopId, status: "posted" },
    include: { lines: true },
  });
  if (!original) throw new Error("Posted journal entry not found");

  const reversalLines: JournalLineInput[] = original.lines.map((l) => ({
    accountId: l.accountId,
    debitAmount: l.creditAmount,
    creditAmount: l.debitAmount,
    description: `Reversal: ${l.description ?? original.description}`,
  }));

  const reversal = await createJournalEntry(tx, {
    shopId,
    userId,
    entryDate: new Date(),
    description: `Reversal of ${original.entryNumber}`,
    lines: reversalLines,
    referenceType: "reversal",
    referenceId: original.id,
    post: true,
  });

  await tx.journalEntry.update({
    where: { id: entryId },
    data: { status: "reversed", reversedEntryId: reversal.id },
  });

  return reversal;
}
