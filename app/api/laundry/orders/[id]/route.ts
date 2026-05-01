import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["received", "in_process", "ready", "out_for_delivery", "delivered", "cancelled"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;

  const rows = await prisma.$queryRaw<any[]>`
    SELECT lo.*,
      COALESCE(json_agg(loi ORDER BY loi."createdAt") FILTER (WHERE loi.id IS NOT NULL), '[]') AS items,
      COALESCE(json_agg(lp ORDER BY lp."paidAt") FILTER (WHERE lp.id IS NOT NULL), '[]') AS payments
    FROM "LaundryOrder" lo
    LEFT JOIN "LaundryOrderItem" loi ON loi."orderId" = lo.id
    LEFT JOIN "LaundryPayment" lp ON lp."orderId" = lo.id
    WHERE lo.id = ${id} AND lo."shopId" = ${shop.id}
    GROUP BY lo.id
  `;
  if (!rows.length) return NextResponse.json({ error: "পাওয়া যায়নি।" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const body = await req.json();

  // Verify ownership
  const existing = await prisma.$queryRaw<any[]>`
    SELECT id, "shopId", status, "dueAmount" FROM "LaundryOrder"
    WHERE id = ${id} AND "shopId" = ${shop.id}
  `;
  if (!existing.length) return NextResponse.json({ error: "পাওয়া যায়নি।" }, { status: 404 });

  // Status update
  if (body.status) {
    if (!VALID_STATUSES.includes(body.status))
      return NextResponse.json({ error: "অবৈধ status।" }, { status: 400 });
    await prisma.$executeRaw`
      UPDATE "LaundryOrder" SET status = ${body.status}, "updatedAt" = NOW()
      WHERE id = ${id}
    `;
  }

  // Payment collection
  if (body.payment) {
    const amt = Number(body.payment.amount ?? 0);
    if (amt > 0) {
      await prisma.$executeRaw`
        INSERT INTO "LaundryPayment" (id, "orderId", amount, method, "paidAt")
        VALUES (gen_random_uuid()::text, ${id}, ${amt}, ${body.payment.method ?? "cash"}, NOW())
      `;
      // Recalculate due
      const totalPaidRows = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM(amount), 0) AS total FROM "LaundryPayment" WHERE "orderId" = ${id}
      `;
      const totalPaid = Number(totalPaidRows[0]?.total ?? 0);
      const orderRows = await prisma.$queryRaw<any[]>`SELECT "totalAmount" FROM "LaundryOrder" WHERE id = ${id}`;
      const totalAmount = Number(orderRows[0]?.totalAmount ?? 0);
      const due = Math.max(0, totalAmount - totalPaid);
      await prisma.$executeRaw`
        UPDATE "LaundryOrder"
        SET "advancePaid" = ${totalPaid}, "dueAmount" = ${due}, "updatedAt" = NOW()
        WHERE id = ${id}
      `;
    }
  }

  // Notes update
  if (body.notes !== undefined) {
    await prisma.$executeRaw`
      UPDATE "LaundryOrder" SET notes = ${body.notes}, "updatedAt" = NOW() WHERE id = ${id}
    `;
  }

  // Fetch updated
  const rows = await prisma.$queryRaw<any[]>`
    SELECT lo.*,
      COALESCE(json_agg(loi ORDER BY loi."createdAt") FILTER (WHERE loi.id IS NOT NULL), '[]') AS items,
      COALESCE(json_agg(lp ORDER BY lp."paidAt") FILTER (WHERE lp.id IS NOT NULL), '[]') AS payments
    FROM "LaundryOrder" lo
    LEFT JOIN "LaundryOrderItem" loi ON loi."orderId" = lo.id
    LEFT JOIN "LaundryPayment" lp ON lp."orderId" = lo.id
    WHERE lo.id = ${id}
    GROUP BY lo.id
  `;
  return NextResponse.json(rows[0]);
}
