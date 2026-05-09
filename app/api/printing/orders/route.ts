import { NextResponse } from "next/server";
import { requireShop } from "@/lib/getShop";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { shop } = await requireShop();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const urgent = searchParams.get("urgent");
  const search = searchParams.get("search");

  const orders = await prisma.printOrder.findMany({
    where: {
      shopId: shop.id,
      ...(status && status !== "all" ? { status } : {}),
      ...(urgent === "1" ? { isUrgent: true, status: { not: "delivered" } } : {}),
      ...(search ? {
        OR: [
          { orderNumber: { contains: search, mode: "insensitive" } },
          { clientName: { contains: search, mode: "insensitive" } },
          { clientPhone: { contains: search } },
        ],
      } : {}),
    },
    include: {
      items: { include: { service: { select: { name: true } } } },
      payments: true,
      customer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const { shop, user } = await requireShop();
  const body = await req.json();
  const { clientName, clientPhone, customerId, deliveryDate, isUrgent, notes, items, advancePaid } = body;

  if (!clientName || !clientPhone || !deliveryDate || !items?.length) {
    return NextResponse.json({ error: "ক্লায়েন্টের তথ্য ও আইটেম আবশ্যক" }, { status: 400 });
  }

  const prefix = shop.printOrderPrefix ?? "PRT";
  const prtYear = new Date().getFullYear();
  const count = await prisma.printOrder.count({ where: { shopId: shop.id } });
  const orderNumber = `${prefix}-${prtYear}-${String(count + 1).padStart(3, "0")}`;

  const totalAmount = items.reduce((s: number, i: { subtotal: number }) => s + Number(i.subtotal), 0);
  const advance = Number(advancePaid ?? 0);
  const dueAmount = totalAmount - advance;

  const order = await prisma.printOrder.create({
    data: {
      shopId: shop.id,
      orderNumber,
      clientName,
      clientPhone,
      customerId: customerId ?? null,
      totalAmount,
      costAmount: 0,
      advancePaid: advance,
      dueAmount,
      deliveryDate: new Date(deliveryDate),
      isUrgent: !!isUrgent,
      notes: notes ?? null,
      status: "received",
      designApproved: !(shop.printRequireApproval ?? true),
      designFiles: [],
      items: {
        create: items.map((item: {
          serviceId?: string;
          itemName: string;
          size?: string;
          quantity: number;
          unitPrice: number;
          subtotal: number;
          paperType?: string;
          colorMode?: string;
          sides?: string;
          designNote?: string;
        }) => ({
          serviceId: item.serviceId ?? null,
          itemName: item.itemName,
          size: item.size ?? null,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          paperType: item.paperType ?? null,
          colorMode: item.colorMode ?? null,
          sides: item.sides ?? null,
          designNote: item.designNote ?? null,
        })),
      },
      ...(advance > 0 ? {
        payments: {
          create: [{ amount: advance, method: "cash" }],
        },
      } : {}),
    },
    include: { items: true, payments: true },
  });

  // SMS notification
  if (shop.printAutoSms) {
    const delivDate = new Date(deliveryDate).toLocaleDateString("bn-BD");
    console.log(`SMS to ${clientPhone}: আপনার প্রিন্টিং অর্ডার পেয়েছি। অর্ডার নং: ${orderNumber}। ডেলিভারি: ${delivDate}। মোট: ৳${totalAmount} | অগ্রিম: ৳${advance} - ${shop.name}`);
  }

  await prisma.activityLog.create({
    data: { userId: user.id, shopId: shop.id, action: "print_order_created", details: `Order ${orderNumber} created` },
  }).catch(() => {});

  return NextResponse.json(order);
}
