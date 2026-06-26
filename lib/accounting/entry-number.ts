import type { PrismaClient } from "@prisma/client";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">;

export async function generateEntryNumber(
  tx: Tx,
  shopId: string,
  entryDate: Date,
): Promise<string> {
  const year = entryDate.getFullYear();
  const prefix = `JE-${year}-`;

  const last = await tx.journalEntry.findFirst({
    where: { shopId, entryNumber: { startsWith: prefix } },
    orderBy: { entryNumber: "desc" },
    select: { entryNumber: true },
  });

  let seq = 1;
  if (last?.entryNumber) {
    const part = last.entryNumber.slice(prefix.length);
    const n = parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}
