import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminRole("shops");
  if ("error" in authResult) return authResult.error;

  const { id } = await params;
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          accountStatus: true,
          createdAt: true,
          subscription: true,
        },
      },
      _count: {
        select: {
          products: true,
          customers: true,
          staffMembers: true,
          storeOrders: true,
        },
      },
    },
  });

  if (!shop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(shop);
}
