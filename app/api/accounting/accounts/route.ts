import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { getAccountBalance } from "@/lib/accounting/balance";

export async function GET(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const activeOnly = searchParams.get("active") !== "false";

  const accounts = await prisma.account.findMany({
    where: {
      shopId: shop.id,
      ...(activeOnly ? { isActive: true } : {}),
      ...(type ? { accountType: type } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: { code: "asc" },
  });

  const withBalance = await Promise.all(
    accounts.map(async (a) => ({
      ...a,
      balance: await getAccountBalance(a.id, shop.id),
    })),
  );

  const summary = {
    asset: 0,
    liability: 0,
    equity: 0,
    revenue: 0,
    expense: 0,
  };
  for (const a of withBalance) {
    summary[a.accountType as keyof typeof summary] += a.balance;
  }

  return NextResponse.json({ accounts: withBalance, summary });
}

export async function POST(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;
  const body = await req.json();
  const { code, name, accountType, categoryId, parentAccountId, description, normalBalance } = body;

  if (!code || !name || !accountType || !categoryId) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  const existing = await prisma.account.findUnique({
    where: { shopId_code: { shopId: shop.id, code } },
  });
  if (existing) return NextResponse.json({ error: "Account code already exists" }, { status: 409 });

  const nb =
    normalBalance ??
    (["asset", "expense"].includes(accountType) ? "debit" : "credit");

  const account = await prisma.account.create({
    data: {
      shopId: shop.id,
      categoryId,
      code,
      name,
      accountType,
      normalBalance: nb,
      parentAccountId: parentAccountId ?? null,
      description: description ?? null,
      isSystem: false,
    },
    include: { category: true },
  });

  return NextResponse.json(account, { status: 201 });
}
