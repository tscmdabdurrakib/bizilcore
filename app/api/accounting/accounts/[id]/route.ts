import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { getAccountBalance } from "@/lib/accounting/balance";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;
  const { id } = await params;
  const body = await req.json();

  const account = await prisma.account.findFirst({ where: { id, shopId: shop.id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.isActive !== undefined && !account.isSystem) data.isActive = body.isActive;
  if (!account.isSystem) {
    if (body.code !== undefined) data.code = body.code;
    if (body.accountType !== undefined) data.accountType = body.accountType;
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;
  }

  const updated = await prisma.account.update({
    where: { id },
    data,
    include: { category: true },
  });
  const balance = await getAccountBalance(id, shop.id);
  return NextResponse.json({ ...updated, balance });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;
  const { id } = await params;

  const account = await prisma.account.findFirst({ where: { id, shopId: shop.id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (account.isSystem) {
    return NextResponse.json({ error: "System accounts cannot be deleted" }, { status: 403 });
  }

  await prisma.account.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
