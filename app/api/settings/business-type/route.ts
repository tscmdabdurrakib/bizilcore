import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidBusinessType, isValidSalesChannel, getModules } from "@/lib/modules";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { businessType?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { businessType } = body;
  if (!businessType || !isValidBusinessType(businessType)) {
    return NextResponse.json({ error: "Invalid business type" }, { status: 400 });
  }

  const existing = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { id: true, salesChannel: true },
  });
  if (!existing) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const salesCh = existing.salesChannel && isValidSalesChannel(existing.salesChannel)
    ? existing.salesChannel : "both";
  const activeModules = getModules(businessType, salesCh);

  const shop = await prisma.shop.update({
    where: { userId: session.user.id },
    data: { businessType, activeModules },
    select: { id: true, businessType: true, activeModules: true },
  });

  return NextResponse.json(shop);
}
