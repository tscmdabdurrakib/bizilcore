import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "laundry")
    return NextResponse.json({ error: "শুধুমাত্র লন্ড্রি শপের জন্য।" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";
  const today = searchParams.get("today");

  let orders: any[];

  if (today === "1") {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    orders = await prisma.$queryRaw<any[]>`
      SELECT lo.*, 
        COALESCE(json_agg(loi ORDER BY loi."createdAt") FILTER (WHERE loi.id IS NOT NULL), '[]') AS items,
        COALESCE(json_agg(lp ORDER BY lp."paidAt") FILTER (WHERE lp.id IS NOT NULL), '[]') AS payments
      FROM "LaundryOrder" lo
      LEFT JOIN "LaundryOrderItem" loi ON loi."orderId" = lo.id
      LEFT JOIN "LaundryPayment" lp ON lp."orderId" = lo.id
      WHERE lo."shopId" = ${shop.id}
        AND lo."createdAt" >= ${todayStart} AND lo."createdAt" <= ${todayEnd}
      GROUP BY lo.id
      ORDER BY lo."createdAt" DESC
    `;
  } else if (status) {
    orders = await prisma.$queryRaw<any[]>`
      SELECT lo.*,
        COALESCE(json_agg(loi ORDER BY loi."createdAt") FILTER (WHERE loi.id IS NOT NULL), '[]') AS items,
        COALESCE(json_agg(lp ORDER BY lp."paidAt") FILTER (WHERE lp.id IS NOT NULL), '[]') AS payments
      FROM "LaundryOrder" lo
      LEFT JOIN "LaundryOrderItem" loi ON loi."orderId" = lo.id
      LEFT JOIN "LaundryPayment" lp ON lp."orderId" = lo.id
      WHERE lo."shopId" = ${shop.id} AND lo.status = ${status}
        AND (${search} = '' OR lo."clientName" ILIKE ${'%' + search + '%'} OR lo."clientPhone" ILIKE ${'%' + search + '%'} OR lo."orderNumber" ILIKE ${'%' + search + '%'})
      GROUP BY lo.id
      ORDER BY lo."deliveryDate" ASC, lo."createdAt" DESC
    `;
  } else {
    orders = await prisma.$queryRaw<any[]>`
      SELECT lo.*,
        COALESCE(json_agg(loi ORDER BY loi."createdAt") FILTER (WHERE loi.id IS NOT NULL), '[]') AS items,
        COALESCE(json_agg(lp ORDER BY lp."paidAt") FILTER (WHERE lp.id IS NOT NULL), '[]') AS payments
      FROM "LaundryOrder" lo
      LEFT JOIN "LaundryOrderItem" loi ON loi."orderId" = lo.id
      LEFT JOIN "LaundryPayment" lp ON lp."orderId" = lo.id
      WHERE lo."shopId" = ${shop.id}
        AND (${search} = '' OR lo."clientName" ILIKE ${'%' + search + '%'} OR lo."clientPhone" ILIKE ${'%' + search + '%'} OR lo."orderNumber" ILIKE ${'%' + search + '%'})
      GROUP BY lo.id
      ORDER BY lo."createdAt" DESC
      LIMIT 200
    `;
  }

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "laundry")
    return NextResponse.json({ error: "শুধুমাত্র লন্ড্রি শপের জন্য।" }, { status: 403 });

  const body = await req.json();
  const { clientName, clientPhone, clientAddress, orderType, pickupDate, deliveryDate,
          isExpress, totalAmount, advancePaid, notes, items } = body;

  if (!clientName?.trim()) return NextResponse.json({ error: "কাস্টমারের নাম আবশ্যিক।" }, { status: 400 });
  if (!clientPhone?.trim()) return NextResponse.json({ error: "ফোন নম্বর আবশ্যিক।" }, { status: 400 });
  if (!deliveryDate) return NextResponse.json({ error: "ডেলিভারির তারিখ আবশ্যিক।" }, { status: 400 });
  if (!items?.length) return NextResponse.json({ error: "কমপক্ষে একটি আইটেম দিন।" }, { status: 400 });

  // Generate order number
  const countRows = await prisma.$queryRaw<{ cnt: bigint }[]>`
    SELECT COUNT(*) AS cnt FROM "LaundryOrder" WHERE "shopId" = ${shop.id}
  `;
  const count = Number(countRows[0]?.cnt ?? 0) + 1;
  const year = new Date().getFullYear();
  const orderNumber = `LDR-${year}-${String(count).padStart(3, "0")}`;

  const total = Number(totalAmount ?? 0);
  const advance = Number(advancePaid ?? 0);
  const due = Math.max(0, total - advance);
  const express = Boolean(isExpress);

  const orderRows = await prisma.$queryRaw<any[]>`
    INSERT INTO "LaundryOrder"
      (id, "shopId", "orderNumber", "clientName", "clientPhone", "clientAddress",
       "orderType", "pickupDate", "deliveryDate", "isExpress", "totalAmount",
       "advancePaid", "dueAmount", status, notes, "smsSent", "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid()::text, ${shop.id}, ${orderNumber}, ${clientName.trim()},
      ${clientPhone.trim()}, ${clientAddress?.trim() ?? null},
      ${orderType ?? "drop_in"},
      ${pickupDate ? new Date(pickupDate) : null},
      ${new Date(deliveryDate)},
      ${express}, ${total}, ${advance}, ${due},
      'received', ${notes?.trim() ?? null}, false, NOW(), NOW()
    )
    RETURNING *
  `;
  const order = orderRows[0];

  // Insert items
  for (const item of items) {
    const qty = Number(item.quantity ?? 1);
    const up = Number(item.unitPrice ?? 0);
    await prisma.$executeRaw`
      INSERT INTO "LaundryOrderItem"
        (id, "orderId", "serviceId", "itemName", quantity, "unitPrice", subtotal, condition, tag, "createdAt")
      VALUES (
        gen_random_uuid()::text, ${order.id},
        ${item.serviceId ?? null}, ${item.itemName ?? ""},
        ${qty}, ${up}, ${qty * up},
        ${item.condition ?? null}, ${item.tag ?? null}, NOW()
      )
    `;
  }

  // Record advance payment if any
  if (advance > 0) {
    await prisma.$executeRaw`
      INSERT INTO "LaundryPayment" (id, "orderId", amount, method, "paidAt")
      VALUES (gen_random_uuid()::text, ${order.id}, ${advance}, ${body.paymentMethod ?? "cash"}, NOW())
    `;
  }

  // Fetch full order with items
  const full = await prisma.$queryRaw<any[]>`
    SELECT lo.*,
      COALESCE(json_agg(loi ORDER BY loi."createdAt") FILTER (WHERE loi.id IS NOT NULL), '[]') AS items,
      COALESCE(json_agg(lp ORDER BY lp."paidAt") FILTER (WHERE lp.id IS NOT NULL), '[]') AS payments
    FROM "LaundryOrder" lo
    LEFT JOIN "LaundryOrderItem" loi ON loi."orderId" = lo.id
    LEFT JOIN "LaundryPayment" lp ON lp."orderId" = lo.id
    WHERE lo.id = ${order.id}
    GROUP BY lo.id
  `;

  return NextResponse.json(full[0], { status: 201 });
}
