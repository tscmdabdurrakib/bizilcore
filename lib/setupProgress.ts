import { prisma } from "@/lib/prisma";
export { SETUP_TASKS, type SetupTaskKey, type SetupProgress } from "@/lib/setupTasks";
import type { SetupTaskKey, SetupProgress } from "@/lib/setupTasks";
import { SETUP_TASKS } from "@/lib/setupTasks";

const DEFAULT: SetupProgress = {
  account_created: true,
  profile_complete: false,
  first_product: false,
  first_customer: false,
  first_order: false,
  first_transaction: false,
  dismissed: false,
};

export async function getSetupProgress(userId: string): Promise<SetupProgress> {
  try {
    const rows = await prisma.$queryRaw<{ setupProgress: unknown }[]>`
      SELECT "setupProgress" FROM "User" WHERE id = ${userId} LIMIT 1
    `;
    if (!rows.length) return DEFAULT;
    const raw = rows[0].setupProgress;
    if (!raw || typeof raw !== "object") return DEFAULT;
    return { ...DEFAULT, ...(raw as object) };
  } catch {
    return DEFAULT;
  }
}

export async function markSetupTask(userId: string, key: SetupTaskKey): Promise<void> {
  try {
    const current = await getSetupProgress(userId);
    if (current[key]) return;
    const updated = { ...current, [key]: true };
    await prisma.$executeRaw`
      UPDATE "User" SET "setupProgress" = ${JSON.stringify(updated)}::jsonb WHERE id = ${userId}
    `;
  } catch {}
}

export async function updateSetupProgress(userId: string, update: Partial<SetupProgress>): Promise<void> {
  try {
    const current = await getSetupProgress(userId);
    const updated = { ...current, ...update };
    await prisma.$executeRaw`
      UPDATE "User" SET "setupProgress" = ${JSON.stringify(updated)}::jsonb WHERE id = ${userId}
    `;
  } catch {}
}

export function calcPercent(progress: SetupProgress): number {
  const done = SETUP_TASKS.filter(t => progress[t.key]).length;
  return Math.round((done / SETUP_TASKS.length) * 100);
}
