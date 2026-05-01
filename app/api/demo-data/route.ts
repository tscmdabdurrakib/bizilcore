import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markSetupTask } from "@/lib/setupProgress";

async function getShopId(userId: string) {
  const shop = await prisma.shop.findUnique({ where: { userId }, select: { id: true } });
  return shop?.id;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ hasDemo: false });
  const count = await prisma.$queryRaw<{ cnt: bigint }[]>`
    SELECT COUNT(*) as cnt FROM "Product" WHERE "shopId" = ${shopId} AND "isDemoData" = true
    UNION ALL
    SELECT COUNT(*) FROM "Customer" WHERE "shopId" = ${shopId} AND "isDemoData" = true
    UNION ALL
    SELECT COUNT(*) FROM "Order" WHERE "userId" = ${session.user.id} AND "isDemoData" = true
  `;
  const total = count.reduce((s, r) => s + Number(r.cnt), 0);
  return NextResponse.json({ hasDemo: total > 0, count: total });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  const { type } = await req.json().catch(() => ({ type: "products" }));

  if (type === "products" || type === "all") {
    await prisma.$executeRaw`
      INSERT INTO "Product" ("id","name","buyPrice","sellPrice","stockQty","lowStockAt","category","shopId","isDemoData","createdAt")
      VALUES
        (gen_random_uuid()::text, 'থ্রি-পিস কটন', 450, 650, 20, 5, 'পোশাক', ${shopId}, true, NOW()),
        (gen_random_uuid()::text, 'সিল্ক শাড়ি', 800, 1200, 8, 3, 'পোশাক', ${shopId}, true, NOW()),
        (gen_random_uuid()::text, 'কুর্তি সেট', 350, 550, 15, 5, 'পোশাক', ${shopId}, true, NOW()),
        (gen_random_uuid()::text, 'পাঞ্জাবি', 300, 480, 12, 5, 'পোশাক', ${shopId}, true, NOW()),
        (gen_random_uuid()::text, 'শার্ট', 250, 400, 25, 5, 'পোশাক', ${shopId}, true, NOW())
    `;
    markSetupTask(session.user.id, "first_product").catch(() => {});
  }

  if (type === "customers" || type === "all") {
    await prisma.$executeRaw`
      INSERT INTO "Customer" ("id","name","phone","address","group","shopId","isDemoData","createdAt")
      VALUES
        (gen_random_uuid()::text, 'রহিমা বেগম (Demo)', '01711-000001', 'ঢাকা', 'regular', ${shopId}, true, NOW()),
        (gen_random_uuid()::text, 'করিম সাহেব (Demo)', '01822-000002', 'চট্টগ্রাম', 'regular', ${shopId}, true, NOW()),
        (gen_random_uuid()::text, 'নাসরিন আক্তার (Demo)', '01933-000003', 'সিলেট', 'vip', ${shopId}, true, NOW())
    `;
    markSetupTask(session.user.id, "first_customer").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ ok: true });

  await prisma.$executeRaw`
    DELETE FROM "OrderItem" WHERE "orderId" IN (
      SELECT id FROM "Order" WHERE "userId" = ${session.user.id} AND "isDemoData" = true
    )
  `;
  await prisma.$executeRaw`DELETE FROM "Order" WHERE "userId" = ${session.user.id} AND "isDemoData" = true`;
  await prisma.$executeRaw`DELETE FROM "Customer" WHERE "shopId" = ${shopId} AND "isDemoData" = true`;
  await prisma.$executeRaw`DELETE FROM "Product" WHERE "shopId" = ${shopId} AND "isDemoData" = true`;

  return NextResponse.json({ ok: true });
}
