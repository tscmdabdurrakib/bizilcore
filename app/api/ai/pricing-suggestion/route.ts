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

interface PriceSuggestion {
  suggestedMin: number;
  suggestedMax: number;
  reasoning: string;
  profitMargin: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await getUserPlan(session.user.id);
  const limit = await checkAILimit(session.user.id, plan);
  if (!limit.allowed) return NextResponse.json({ error: limit.message }, { status: 429 });

  const { productName, category, costPrice, currentStock, monthlySales } = await req.json();
  if (!productName?.trim() || !costPrice) return NextResponse.json({ error: "পণ্যের নাম ও ক্রয় মূল্য দিন" }, { status: 400 });

  const systemPrompt = `তুমি একজন বাংলাদেশী ব্যবসায়িক মূল্য নির্ধারণ বিশেষজ্ঞ।
বাংলাদেশের বাজার, চাহিদা ও প্রতিযোগিতা মাথায় রেখে মূল্য suggest করো।
সবসময় শুধু এই JSON format এ respond করো, অন্য কিছু লিখবে না:
{"suggestedMin":450,"suggestedMax":550,"reasoning":"কারণ এখানে লিখো","profitMargin":"২০-৩০%"}`;

  const userPrompt = `পণ্যের নাম: ${productName}
ক্যাটাগরি: ${category || "সাধারণ"}
ক্রয়/উৎপাদন মূল্য: ৳${costPrice}
বর্তমান স্টক: ${currentStock || "অজানা"} টি
মাসিক বিক্রয়: ${monthlySales || "অজানা"} টি

সঠিক বিক্রয় মূল্য suggest করো।`;

  try {
    let result = await askAI("pricing_suggestion", systemPrompt, userPrompt);
    let parsed = safeParseJSON<PriceSuggestion>(result);

    if (!parsed) {
      result = await askAI("pricing_suggestion", systemPrompt, userPrompt + "\n\nRemember: respond ONLY with JSON, nothing else.");
      parsed = safeParseJSON<PriceSuggestion>(result);
    }

    if (!parsed) return NextResponse.json({ error: "AI সঠিক উত্তর দিতে পারেনি। আবার চেষ্টা করুন।" }, { status: 500 });

    await logAIUsage(session.user.id, "pricing_suggestion", getModelForFeature("pricing_suggestion"));
    return NextResponse.json({ ...parsed, remaining: (limit.remaining ?? 1) - 1 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("429")) return NextResponse.json({ error: "AI এখন ব্যস্ত। ১ মিনিট পরে চেষ্টা করুন।" }, { status: 503 });
    return NextResponse.json({ error: "AI সঠিক উত্তর দিতে পারেনি। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
