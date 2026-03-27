import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const recentInvoices = await prisma.invoice.findMany({
    where: { shopId: shop.id, customerId: id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const seen = new Set<string>();
  const items: { description: string; unitPrice: number; quantity: number }[] = [];

  for (const inv of recentInvoices) {
    for (const item of inv.items) {
      const key = item.description.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ description: item.description, unitPrice: item.unitPrice, quantity: item.quantity });
      }
    }
  }

  return NextResponse.json({ items: items.slice(0, 8) });
}
