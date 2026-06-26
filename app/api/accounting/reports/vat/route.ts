import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccountingShop } from "@/lib/accounting/auth";
import { getAccountBalance } from "@/lib/accounting/balance";
import { COA_CODES } from "@/lib/accounting/seed-coa";
import { roundMoney } from "@/types/accounting";

export async function GET(req: NextRequest) {
  const ctx = await requireAccountingShop();
  if ("error" in ctx) return ctx.error;
  const { shop } = ctx;

  const startDate = req.nextUrl.searchParams.get("start_date");
  const endDate = req.nextUrl.searchParams.get("end_date");
  const from = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = endDate ? new Date(endDate) : new Date();

  const vatAcct = await prisma.account.findUnique({
    where: { shopId_code: { shopId: shop.id, code: COA_CODES.VAT_PAYABLE } },
  });

  const outputVat = vatAcct ? await getAccountBalance(vatAcct.id, shop.id, from, to) : 0;

  const orders = await prisma.order.findMany({
    where: {
      user: { shop: { id: shop.id } },
      vatAmount: { gt: 0 },
      createdAt: { gte: from, lte: to },
    },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const rows = orders.map((o) => ({
    date: o.createdAt.toISOString().split("T")[0],
    orderId: o.id.slice(-6).toUpperCase(),
    customer: o.customer?.name ?? "—",
    totalAmount: o.totalAmount,
    vatAmount: o.vatAmount,
    vatRate: shop.vatRate ?? 15,
  }));

  return NextResponse.json({
    outputVat: roundMoney(outputVat),
    inputVat: 0,
    netVatPayable: roundMoney(outputVat),
    rows,
  });
}
