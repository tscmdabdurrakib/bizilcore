import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_PRICING = [
  { planKey: "free",     monthlyPrice: 0,   yearlyPrice: 0,   discountEnabled: false, discountPercent: 0, discountLabel: "" },
  { planKey: "pro",      monthlyPrice: 199,  yearlyPrice: 165, discountEnabled: false, discountPercent: 0, discountLabel: "" },
  { planKey: "business", monthlyPrice: 699,  yearlyPrice: 579, discountEnabled: false, discountPercent: 0, discountLabel: "" },
];

export async function GET() {
  try {
    let configs = await prisma.pricingConfig.findMany({ orderBy: { planKey: "asc" } });
    if (configs.length < 3) {
      for (const d of DEFAULT_PRICING) {
        await prisma.pricingConfig.upsert({ where: { planKey: d.planKey }, create: d, update: {} });
      }
      configs = await prisma.pricingConfig.findMany({ orderBy: { planKey: "asc" } });
    }
    return NextResponse.json(configs, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(DEFAULT_PRICING);
  }
}
