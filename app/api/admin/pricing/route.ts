import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PRICING = [
  { planKey: "free",     monthlyPrice: 0,   yearlyPrice: 0,   discountEnabled: false, discountPercent: 0, discountLabel: "" },
  { planKey: "pro",      monthlyPrice: 199,  yearlyPrice: 165, discountEnabled: false, discountPercent: 0, discountLabel: "" },
  { planKey: "business", monthlyPrice: 699,  yearlyPrice: 579, discountEnabled: false, discountPercent: 0, discountLabel: "" },
];

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isAdmin: true } });
  return user?.isAdmin ? session : null;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let configs = await prisma.pricingConfig.findMany({ orderBy: { planKey: "asc" } });
  if (configs.length < 3) {
    for (const d of DEFAULT_PRICING) {
      await prisma.pricingConfig.upsert({ where: { planKey: d.planKey }, create: d, update: {} });
    }
    configs = await prisma.pricingConfig.findMany({ orderBy: { planKey: "asc" } });
  }
  return NextResponse.json(configs);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body: Array<{
    planKey: string;
    monthlyPrice: number;
    yearlyPrice: number;
    discountEnabled: boolean;
    discountPercent: number;
    discountLabel: string;
  }> = await req.json();

  const results = await Promise.all(
    body.map((item) =>
      prisma.pricingConfig.upsert({
        where: { planKey: item.planKey },
        create: item,
        update: {
          monthlyPrice:    item.monthlyPrice,
          yearlyPrice:     item.yearlyPrice,
          discountEnabled: item.discountEnabled,
          discountPercent: item.discountPercent,
          discountLabel:   item.discountLabel,
        },
      })
    )
  );
  return NextResponse.json(results);
}
