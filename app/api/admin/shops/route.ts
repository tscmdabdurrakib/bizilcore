import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/admin/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAdminRole("shops");
  if ("error" in authResult) return authResult.error;

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const status = req.nextUrl.searchParams.get("status") ?? "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  async function fetchShops(statusFilter?: string) {
    const w = statusFilter ? { ...where, shopStatus: statusFilter } : where;
    return Promise.all([
      prisma.shop.findMany({
        where: w,
        orderBy: { id: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              accountStatus: true,
              subscription: { select: { plan: true, status: true, endDate: true } },
            },
          },
          _count: { select: { products: true, customers: true, staffMembers: true } },
        },
      }),
      prisma.shop.count({ where: w }),
    ]);
  }

  let shops, total;
  try {
    [shops, total] = await fetchShops(status || undefined);
  } catch {
    [shops, total] = await fetchShops(undefined);
  }

  return NextResponse.json({ shops, total, page, pages: Math.ceil(total / limit) });
}
