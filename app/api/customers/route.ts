import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveShopForApi } from "@/lib/shops/access";
import { logActivity } from "@/lib/logActivity";
import { trackForUser } from "@/lib/activity/trackFromSession";
import { markSetupTask } from "@/lib/setupProgress";
import { ALL_ROWS_CAP } from "@/lib/api-limits";
import { getCachedCustomersPage1 } from "@/lib/data/cached-queries";
import { revalidateCustomers } from "@/lib/cache/revalidate";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: shopCtx.error === "Unauthorized" ? 401 : 404 });
  const shop = shopCtx.activeShop;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "30");
  const skip = (page - 1) * limit;
  const all = searchParams.get("all") === "1";
  const group = searchParams.get("group");
  const dueOnly = searchParams.get("dueOnly") === "1";

  if (page === 1 && !search && !all && !group && !dueOnly) {
    const cached = await getCachedCustomersPage1(shop.id, limit);
    return NextResponse.json(cached);
  }

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
          },
        } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: ALL_ROWS_CAP,
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

  const shopCtx = await getActiveShopForApi();
  if ("error" in shopCtx) return NextResponse.json({ error: shopCtx.error }, { status: shopCtx.error === "Unauthorized" ? 401 : 404 });
  const shop = shopCtx.activeShop;

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
  revalidateCustomers(shop.id);
  await logActivity({
    shopId: shop.id,
    userId: session.user.id,
    action: "নতুন কাস্টমার যোগ",
    detail: `${customer.name}${customer.phone ? ` · ${customer.phone}` : ""}`,
  });
  trackForUser(session.user.id, shop.id, {
    actionType: "customer_added",
    actionLabel: `নতুন কাস্টমার যোগ: ${customer.name}`,
    metadata: { customer_id: customer.id, customer_name: customer.name },
  }).catch(() => {});
  markSetupTask(session.user.id, "first_customer").catch(() => {});
  return NextResponse.json(customer, { status: 201 });
}
