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

interface Prediction {
  productName: string;
  currentStock: number;
  daysUntilStockout: number;
  urgency: "urgent" | "warning" | "ok";
  action: string;
}
interface PredictionResult {
  predictions: Prediction[];
  summary: string;
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

  // Check cache (6 hours)
  const cacheKey = `ai_inv_pred_${shop.id}`;
  if (!force) {
    const cached = await prisma.aiUsage.findFirst({
      where: { userId: session.user.id, feature: "inventory_prediction_cache", date: new Date().toISOString().split("T")[0] },
      orderBy: { createdAt: "desc" },
      select: { model: true, createdAt: true },
    });
    if (cached) {
      const ageMs = Date.now() - cached.createdAt.getTime();
      if (ageMs < 6 * 60 * 60 * 1000) {
        try {
          const parsed = JSON.parse(cached.model) as PredictionResult;
          return NextResponse.json({ ...parsed, cached: true, cachedAt: cached.createdAt });
        } catch {}
      }
    }
  }

  const plan = await getUserPlan(session.user.id);
  const limit = await checkAILimit(session.user.id, plan);
  if (!limit.allowed) return NextResponse.json({ error: limit.message }, { status: 429 });

  // Get top 15 products by stock movement
  const products = await prisma.product.findMany({
    where: { shopId: shop.id, stockQty: { gt: 0 } },
    select: { name: true, stockQty: true, sellPrice: true, category: true },
    orderBy: { stockQty: "asc" },
    take: 15,
  });

  // Get monthly sales per product
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { userId: session.user.id, createdAt: { gte: thirtyDaysAgo } } },
    select: { productId: true, quantity: true, product: { select: { name: true } } },
  });

  const salesMap: Record<string, number> = {};
  orderItems.forEach(item => {
    if (item.product?.name) salesMap[item.product.name] = (salesMap[item.product.name] || 0) + item.quantity;
  });

  const productData = products.map(p => ({
    নাম: p.name,
    স্টক: p.stockQty,
    মাসিক_বিক্রয়: salesMap[p.name] || 0,
    ক্যাটাগরি: p.category || "সাধারণ",
  }));

  const systemPrompt = `তুমি একজন inventory বিশেষজ্ঞ।
পণ্যের স্টক ও বিক্রয় ডেটা দেখে predict করো কোনটা কতদিনে শেষ হবে।
শুধু এই JSON format এ respond করো:
{
  "predictions": [
    {
      "productName": "নাম",
      "currentStock": 10,
      "daysUntilStockout": 5,
      "urgency": "urgent",
      "action": "আজই অর্ডার করুন"
    }
  ],
  "summary": "সামগ্রিক অবস্থা ১-২ লাইনে"
}
urgency values: "urgent" (0-7 days) | "warning" (8-15 days) | "ok" (15+ days)`;

  const userPrompt = `নিচের পণ্যগুলোর ডেটা বিশ্লেষণ করো:
${JSON.stringify(productData)}
কোনটা কতদিনে শেষ হবে এবং কী করতে হবে বলো।`;

  try {
    const result = await askAI("inventory_prediction", systemPrompt, userPrompt);
    const parsed = safeParseJSON<PredictionResult>(result);

    if (!parsed) return NextResponse.json({ error: "AI সঠিক উত্তর দিতে পারেনি। আবার চেষ্টা করুন।" }, { status: 500 });

    // Cache: store result as JSON string in `model` field
    await Promise.all([
      logAIUsage(session.user.id, "inventory_prediction", getModelForFeature("inventory_prediction")),
      prisma.aiUsage.create({
        data: {
          userId: session.user.id,
          feature: "inventory_prediction_cache",
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
