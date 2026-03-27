import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const rows: { name: string; phone?: string; address?: string; group?: string }[] = body.rows;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows" }, { status: 400 });
  }

  const valid = rows.filter((r) => r.name?.trim());
  const created = await prisma.customer.createMany({
    data: valid.map((r) => ({
      name: r.name.trim(),
      phone: r.phone?.trim() || null,
      address: r.address?.trim() || null,
      group: ["vip", "wholesale", "regular"].includes(r.group?.toLowerCase() ?? "")
        ? r.group!.toLowerCase()
        : "regular",
      shopId: shop.id,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ imported: created.count });
}
