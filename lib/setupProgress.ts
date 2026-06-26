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

/** Infer completed tasks from live shop data (not just stored JSON). */
export async function detectSetupProgressFromData(userId: string): Promise<{
  detected: Partial<SetupProgress>;
  orderCount: number;
}> {
  const [shop, orderCount, txCount] = await Promise.all([
    prisma.shop.findUnique({
      where: { userId },
      select: {
        name: true,
        phone: true,
        address: true,
        _count: { select: { products: true, customers: true } },
      },
    }),
    prisma.order.count({ where: { userId } }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return {
    orderCount,
    detected: {
      account_created: true,
      profile_complete: !!(shop?.name && (shop.phone || shop.address)),
      first_product: (shop?._count.products ?? 0) >= 1,
      first_customer: (shop?._count.customers ?? 0) >= 1,
      first_order: orderCount >= 1,
      first_transaction: txCount >= 1,
    },
  };
}

/** User already runs the business — onboarding checklist is noise. */
export function isEstablishedUser(
  detected: Partial<SetupProgress>,
  orderCount: number,
): boolean {
  if (orderCount >= 3) return true;
  if (orderCount >= 1 && detected.first_product) return true;
  if (detected.first_product && detected.first_customer && detected.first_order) return true;
  return false;
}

export function shouldShowSetupChecklist(progress: SetupProgress): boolean {
  if (progress.dismissed) return false;
  if (progress.snoozedUntil && new Date(progress.snoozedUntil) > new Date()) return false;
  return true;
}

/** Merge stored JSON with live DB state; auto-dismiss mature accounts. */
export async function syncSetupProgress(
  userId: string,
): Promise<SetupProgress & { shouldShow: boolean }> {
  const stored = await getSetupProgress(userId);
  const { detected, orderCount } = await detectSetupProgressFromData(userId);

  const merged: SetupProgress = {
    ...stored,
    account_created: true,
    profile_complete: stored.profile_complete || !!detected.profile_complete,
    first_product: stored.first_product || !!detected.first_product,
    first_customer: stored.first_customer || !!detected.first_customer,
    first_order: stored.first_order || !!detected.first_order,
    first_transaction: stored.first_transaction || !!detected.first_transaction,
  };

  if (isEstablishedUser(detected, orderCount) && !merged.dismissed) {
    merged.dismissed = true;
    merged.dismissedAt = new Date().toISOString();
  }

  const changed =
    SETUP_TASKS.some((t) => merged[t.key] !== stored[t.key]) ||
    (merged.dismissed && !stored.dismissed);

  if (changed) {
    await updateSetupProgress(userId, merged);
  }

  return { ...merged, shouldShow: shouldShowSetupChecklist(merged) };
}
