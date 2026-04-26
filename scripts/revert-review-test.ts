/**
 * Revert review test seed.
 * Restores user fields from snapshot, deletes demo stub user + their review,
 * and deletes any reviews/NPS surveys created during testing.
 */
import { prisma } from "../lib/prisma";

async function main() {
  const fs = await import("fs/promises");
  let snap: { user: { id: string; email: string; isAdmin: boolean; createdAt: string; totalOrders: number }; demoEmail: string };
  try {
    const raw = await fs.readFile(".local/review-test-snapshot.json", "utf-8");
    snap = JSON.parse(raw);
  } catch {
    console.log("⚠️  No snapshot file found at .local/review-test-snapshot.json");
    console.log("Nothing to revert.");
    return;
  }

  // Restore user
  await prisma.user.update({
    where: { id: snap.user.id },
    data: {
      isAdmin: snap.user.isAdmin,
      createdAt: new Date(snap.user.createdAt),
      totalOrders: snap.user.totalOrders,
    },
  });

  // Wipe any reviews / NPS that were created during testing
  await prisma.appReview.deleteMany({ where: { userId: snap.user.id } });
  await prisma.nPSSurvey.deleteMany({ where: { userId: snap.user.id } });

  // Remove demo stub user (cascade removes its review)
  const stub = await prisma.user.findUnique({ where: { email: snap.demoEmail } });
  if (stub) {
    await prisma.user.delete({ where: { id: stub.id } });
  }

  // Remove snapshot
  await fs.unlink(".local/review-test-snapshot.json").catch(() => {});

  console.log("\n✅ Reverted.");
  console.log(`User ${snap.user.email} restored to original state.`);
  console.log("Demo review + stub user deleted.\n");
  console.log("Don't forget to run localStorage.clear() in browser to reset dismiss flags.\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
