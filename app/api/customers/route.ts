import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/logActivity";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");
  const skip = (page - 1) * limit;
  const all = searchParams.get("all") === "1";

  const group = searchParams.get("group");
  const dueOnly = searchParams.get("dueOnly") === "1";

  const where = {
    shopId: shop.id,
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
      ],
    } : {}),
    ...(group ? { group } : {}),
    ...(dueOnly ? { dueAmount: { gt: 0 } } : {}),
  };

  if (all) {
    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { orders: true } },
        ...(dueOnly ? {
          orders: {
            where: { dueAmount: { gt: 0 } },
            select: { id: true, dueAmount: true, createdAt: true, status: true },
            orderBy: { createdAt: "asc" },
          }
        } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customers);
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const body = await req.json();
  const customer = await prisma.customer.create({
    data: {
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      fbProfile: body.fbProfile || null,
      group: ["vip", "wholesale", "regular"].includes(body.group) ? body.group : "regular",
      shopId: shop.id,
    },
  });
  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "নতুন কাস্টমার যোগ",
    detail: `${customer.name}${customer.phone ? ` · ${customer.phone}` : ""}`,
  });
  return NextResponse.json(customer, { status: 201 });
}
