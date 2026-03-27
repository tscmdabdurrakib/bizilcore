import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { askAI, safeParseJSON, getModelForFeature } from "@/lib/ai";
import { checkAILimit, logAIUsage } from "@/lib/ai-limiter";
import { prisma } from "@/lib/prisma";

async function getUserPlan(userId: string): Promise<string> {
  const sub = await prisma.subscription.findUnique({ where: { userId }, select: { plan: true, status: true } });
  if (sub?.status === "active" && sub.plan) return sub.plan;
  return "free";
}

interface SalesInsight {
  insights: string[];
  recommendations: string[];
  topOpportunity: string;
  alert: string | null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "1";

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  // Check cache (1 hour)
  if (!force) {
    const cached = await prisma.aiUsage.findFirst({
      where: { userId: session.user.id, feature: "sales_insight_cache", date: new Date().toISOString().split("T")[0] },
      orderBy: { createdAt: "desc" },
      select: { model: true, createdAt: true },
    });
    if (cached) {
      const ageMs = Date.now() - cached.createdAt.getTime();
      if (ageMs < 60 * 60 * 1000) {
        try {
          const parsed = JSON.parse(cached.model) as SalesInsight;
          return NextResponse.json({ ...parsed, cached: true, cachedAt: cached.createdAt });
        } catch {}
      }
    }
  }

  const plan = await getUserPlan(session.user.id);
  const limit = await checkAILimit(session.user.id, plan);
  if (!limit.allowed) return NextResponse.json({ error: limit.message }, { status: 429 });

  // Gather 30-day data
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

  const [orders, orderItems] = await Promise.all([
    prisma.order.findMany({
      where: { userId: session.user.id, createdAt: { gte: thirtyDaysAgo } },
      select: { totalAmount: true, status: true, createdAt: true, customerId: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { userId: session.user.id, createdAt: { gte: thirtyDaysAgo } } },
      select: { productId: true, quantity: true, unitPrice: true, product: { select: { name: true } } },
    }),
  ]);
  const customers: any[] = [];

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const totalOrders  = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const newCustomers = customers.filter(c => c.createdAt >= thirtyDaysAgo).length;
  const returningCustomers = 0;

  // Top 5 products
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  orderItems.forEach(item => {
    const name = item.product?.name ?? "অজানা";
    if (!productMap[name]) productMap[name] = { name, qty: 0, revenue: 0 };
    productMap[name].qty += item.quantity;
    productMap[name].revenue += item.quantity * item.unitPrice;
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Weekly trend (last 4 weeks)
  const weeklyTrend = [3, 2, 1, 0].map(weeksAgo => {
    const from = new Date(Date.now() - (weeksAgo + 1) * 7 * 24 * 60 * 60 * 1000);
    const to   = new Date(Date.now() - weeksAgo * 7 * 24 * 60 * 60 * 1000);
    const weekOrders = orders.filter(o => o.createdAt >= from && o.createdAt < to);
    return { সপ্তাহ: `${weeksAgo + 1} সপ্তাহ আগে`, অর্ডার: weekOrders.length, আয়: Math.round(weekOrders.reduce((s, o) => s + o.totalAmount, 0)) };
  });

  const systemPrompt = `তুমি একজন বাংলাদেশী ব্যবসায়িক বিশ্লেষক।
বিক্রয় ডেটা বিশ্লেষণ করে সহজ বাংলায় কার্যকর পরামর্শ দাও।
ব্যবহারকারী সাধারণ ব্যবসায়ী — জটিল ভাষা ব্যবহার করবে না।
শুধু এই JSON format এ respond করো:
{
  "insights": ["insight 1", "insight 2", "insight 3"],
  "recommendations": ["পরামর্শ 1", "পরামর্শ 2"],
  "topOpportunity": "সবচেয়ে বড় সুযোগ এখানে লিখো",
  "alert": "কোনো সমস্যা থাকলে এখানে, না থাকলে null"
}`;

  const userPrompt = `ব্যবসার গত ৩০ দিনের ডেটা:
মোট অর্ডার: ${totalOrders}
মোট আয়: ৳${Math.round(totalRevenue)}
গড় অর্ডার মূল্য: ৳${avgOrderValue}
শীর্ষ ৫ পণ্য: ${JSON.stringify(topProducts)}
নতুন কাস্টমার: ${newCustomers}
ফেরত কাস্টমার: ${returningCustomers}
সাপ্তাহিক ট্রেন্ড: ${JSON.stringify(weeklyTrend)}

এই ডেটা বিশ্লেষণ করে গুরুত্বপূর্ণ insight ও পরামর্শ দাও।`;

  try {
    const result = await askAI("sales_insight", systemPrompt, userPrompt);
    const parsed = safeParseJSON<SalesInsight>(result);

    if (!parsed) return NextResponse.json({ error: "AI সঠিক উত্তর দিতে পারেনি। আবার চেষ্টা করুন।" }, { status: 500 });

    await Promise.all([
      logAIUsage(session.user.id, "sales_insight", getModelForFeature("sales_insight")),
      prisma.aiUsage.create({
        data: {
          userId: session.user.id,
          feature: "sales_insight_cache",
          model: JSON.stringify(parsed),
          date: new Date().toISOString().split("T")[0],
        },
      }),
    ]);

    return NextResponse.json({ ...parsed, cached: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("429")) return NextResponse.json({ error: "AI এখন ব্যস্ত। ১ মিনিট পরে চেষ্টা করুন।" }, { status: 503 });
    return NextResponse.json({ error: "AI সঠিক উত্তর দিতে পারেনি। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
