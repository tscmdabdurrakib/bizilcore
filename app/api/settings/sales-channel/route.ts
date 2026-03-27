import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSalesChannel, getModules } from "@/lib/modules";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { salesChannel?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { salesChannel } = body;
  if (!salesChannel || !isValidSalesChannel(salesChannel)) {
    return NextResponse.json({ error: "Invalid sales channel" }, { status: 400 });
  }

  const existing = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { id: true, businessType: true },
  });
  if (!existing) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const activeModules = getModules(existing.businessType, salesChannel);

  const shop = await prisma.shop.update({
    where: { userId: session.user.id },
    data: { salesChannel, activeModules },
    select: { id: true, salesChannel: true, activeModules: true },
  });

  return NextResponse.json(shop);
}
