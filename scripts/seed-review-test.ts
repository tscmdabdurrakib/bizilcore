/**
 * Review/NPS Test Seed
 * ----------------------
 * Run:    npx tsx scripts/seed-review-test.ts
 * Revert: npx tsx scripts/revert-review-test.ts
 *
 * Sets the most-recently-created user up so that:
 *   - they're an admin (can access /admin/reviews)
 *   - account looks 31 days old + 11 totalOrders (review modal eligible)
 *   - any prior NPS surveys are removed (NPS banner eligible)
 *   - any prior AppReview is removed (review modal eligible)
 *
 * Also inserts a demo review (approved + showOnSite) under a stub user
 * so the public landing page testimonials section renders something.
 */
import { prisma } from "../lib/prisma";

const DEMO_REVIEW_FLAG = "__demo_review__";

async function main() {
  // Pick the most recent real user (excluding our demo stub if present)
  const user = await prisma.user.findFirst({
    where: { email: { not: { contains: DEMO_REVIEW_FLAG } } },
    orderBy: { createdAt: "desc" },
  });
  if (!user) {
    console.log("❌ No user found. Sign up first, then re-run.");
    return;
  }

  // Snapshot original values so we can restore them
  const snapshot = {
    id: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
    totalOrders: user.totalOrders,
  };

  // 1) Make user admin + tweak eligibility fields
  const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isAdmin: true,
      createdAt: oldDate,
      totalOrders: Math.max(11, user.totalOrders ?? 0),
    },
  });

  // 2) Wipe any existing reviews / NPS surveys for this user
  await prisma.appReview.deleteMany({ where: { userId: user.id } });
  await prisma.nPSSurvey.deleteMany({ where: { userId: user.id } });

  // 3) Insert a demo approved+showOnSite review under a stub user (for landing page)
  const stubEmail = `demo-rina+${DEMO_REVIEW_FLAG}@bizilcore.local`;
  let stub = await prisma.user.findUnique({ where: { email: stubEmail } });
  if (!stub) {
    stub = await prisma.user.create({
      data: {
        name: "Rina Begum",
        email: stubEmail,
        password: "demo-not-loginable",
        onboarded: false,
      },
    });
  }
  await prisma.appReview.deleteMany({ where: { userId: stub.id } });
  await prisma.appReview.create({
    data: {
      userId: stub.id,
      rating: 5,
      title: null,
      body: "BizilCore use korar por amar dokan-er hisab onek easy hoye gechhe. Stock alert, customer due, sob ek jaygay. Highly recommend!",
      businessType: "fcommerce",
      isApproved: true,
      showOnSite: true,
    },
  });

  // 4) Save snapshot to a JSON file so revert can restore exactly
  const fs = await import("fs/promises");
  await fs.writeFile(
    ".local/review-test-snapshot.json",
    JSON.stringify({ user: snapshot, demoEmail: stubEmail }, null, 2),
  );

  console.log("\n✅ Test mode active.");
  console.log("─────────────────────────────────────────");
  console.log(`User: ${user.email}`);
  console.log(`  → isAdmin: true`);
  console.log(`  → createdAt: ${oldDate.toISOString()} (31 days ago)`);
  console.log(`  → totalOrders: ${Math.max(11, user.totalOrders ?? 0)}`);
  console.log(`Demo review: 1 approved + showOnSite (Rina B.)`);
  console.log("─────────────────────────────────────────");
  console.log("\nNow do this in the browser:");
  console.log("  1. Open / (landing page) — testimonials grid above FAQ");
  console.log("  2. Open /admin/reviews — admin moderation panel");
  console.log("  3. Open /dashboard — review modal popup (after ~1.5s)");
  console.log("     (clear localStorage if you dismissed before:");
  console.log("      localStorage.clear() in devtools console)");
  console.log("  4. NPS banner — shows on dashboard top after the review modal");
  console.log("\nWhen done, run: npx tsx scripts/revert-review-test.ts\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
