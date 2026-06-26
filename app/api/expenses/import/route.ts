import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";
import { getShopForUser } from "@/lib/expenses/server";

interface ImportRow {
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  paymentMethod?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await getShopForUser(session.user.id);
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const rows = body.rows as ImportRow[];

  if (!rows?.length) {
    return NextResponse.json({ error: "No rows to import" }, { status: 400 });
  }

  let created = 0;
  for (const row of rows) {
    if (!row.title || !row.amount || !row.category || !row.date) continue;
    await prisma.transaction.create({
      data: {
        shopId: shop.id,
        userId: session.user.id,
        type: "expense",
        title: row.title,
        amount: parseFloat(String(row.amount)),
        category: row.category,
        date: new Date(row.date),
        note: row.notes || null,
        paymentMethod: row.paymentMethod || null,
      },
    });
    created++;
  }

  await logActivity({
    userId: session.user.id,
    shopId: shop.id,
    action: "expense_import",
    detail: `CSV থেকে ${created}টি খরচ ইমপোর্ট`,
  });

  return NextResponse.json({ created });
}
