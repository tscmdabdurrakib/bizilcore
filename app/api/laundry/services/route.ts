import { NextRequest, NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { shop } = await requireShop();
  if (shop.businessType !== "laundry")
    return NextResponse.json({ error: "শুধুমাত্র লন্ড্রি শপের জন্য।" }, { status: 403 });

  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "LaundryService" WHERE "shopId" = ${shop.id}
    ORDER BY category, name
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "laundry")
    return NextResponse.json({ error: "শুধুমাত্র লন্ড্রি শপের জন্য।" }, { status: 403 });

  const body = await req.json();
  const { name, category, itemType, price, expressPrice } = body;

  if (!name?.trim()) return NextResponse.json({ error: "নাম আবশ্যিক।" }, { status: 400 });
  if (!price || isNaN(Number(price))) return NextResponse.json({ error: "মূল্য আবশ্যিক।" }, { status: 400 });

  const ep = expressPrice != null && expressPrice !== "" ? Number(expressPrice) : null;

  const rows = await prisma.$queryRaw<any[]>`
    INSERT INTO "LaundryService" (id, "shopId", name, category, "itemType", price, "expressPrice", "isActive", "createdAt")
    VALUES (gen_random_uuid()::text, ${shop.id}, ${name.trim()}, ${category ?? "wash_iron"},
            ${itemType ?? "other"}, ${Number(price)}, ${ep}, true, NOW())
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "laundry")
    return NextResponse.json({ error: "শুধুমাত্র লন্ড্রি শপের জন্য।" }, { status: 403 });

  const body = await req.json();
  const { id, name, category, itemType, price, expressPrice, isActive } = body;
  if (!id) return NextResponse.json({ error: "ID আবশ্যিক।" }, { status: 400 });

  const ep = expressPrice != null && expressPrice !== "" ? Number(expressPrice) : null;

  const rows = await prisma.$queryRaw<any[]>`
    UPDATE "LaundryService"
    SET name = ${name ?? ""}, category = ${category ?? "wash_iron"},
        "itemType" = ${itemType ?? "other"}, price = ${Number(price ?? 0)},
        "expressPrice" = ${ep},
        "isActive" = ${isActive ?? true}
    WHERE id = ${id} AND "shopId" = ${shop.id}
    RETURNING *
  `;
  if (!rows.length) return NextResponse.json({ error: "পাওয়া যায়নি।" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(req: NextRequest) {
  const { shop } = await requireShop();
  if (shop.businessType !== "laundry")
    return NextResponse.json({ error: "শুধুমাত্র লন্ড্রি শপের জন্য।" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID আবশ্যিক।" }, { status: 400 });

  await prisma.$executeRaw`DELETE FROM "LaundryService" WHERE id = ${id} AND "shopId" = ${shop.id}`;
  return NextResponse.json({ ok: true });
}
