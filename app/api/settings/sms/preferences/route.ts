import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  await prisma.smsNotificationPreferences.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      orderConfirmed: body.orderConfirmed ?? true,
      orderStatusChanged: body.orderStatusChanged ?? false,
      deliveryConfirmed: body.deliveryConfirmed ?? false,
      paymentReceived: body.paymentReceived ?? false,
      lowStockAlert: body.lowStockAlert ?? false,
    },
    update: {
      orderConfirmed: body.orderConfirmed ?? true,
      orderStatusChanged: body.orderStatusChanged ?? false,
      deliveryConfirmed: body.deliveryConfirmed ?? false,
      paymentReceived: body.paymentReceived ?? false,
      lowStockAlert: body.lowStockAlert ?? false,
    },
  });

  return NextResponse.json({ success: true });
}
