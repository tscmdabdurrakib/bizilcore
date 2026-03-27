import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { askAI, getModelForFeature } from "@/lib/ai";
import { checkAILimit, logAIUsage } from "@/lib/ai-limiter";
import { prisma } from "@/lib/prisma";

async function getUserPlan(userId: string): Promise<string> {
  const sub = await prisma.subscription.findUnique({ where: { userId }, select: { plan: true, status: true } });
  if (sub?.status === "active" && sub.plan) return sub.plan;
  return "free";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await getUserPlan(session.user.id);
  const limit = await checkAILimit(session.user.id, plan);
  if (!limit.allowed) return NextResponse.json({ error: limit.message }, { status: 429 });

  const { productName, category, price, keywords } = await req.json();
  if (!productName?.trim()) return NextResponse.json({ error: "পণ্যের নাম দিন" }, { status: 400 });

  const systemPrompt = `তুমি একজন বাংলাদেশী ecommerce বিশেষজ্ঞ কপিরাইটার।
তোমার কাজ হলো পণ্যের আকর্ষণীয় ও বিক্রয়মুখী বাংলা বিবরণ লেখা।
বিবরণ হবে ৩-৫ লাইন, সহজ বাংলায়।
পণ্যের গুণমান, সুবিধা ও ক্রেতার উপকার তুলে ধরবে।
শুধু বিবরণের টেক্সট লিখবে, JSON বা অন্য কিছু না।`;

  const userPrompt = `পণ্যের নাম: ${productName}
ক্যাটাগরি: ${category || "সাধারণ"}
মূল্য: ৳${price || "উল্লেখ নেই"}
বিশেষ বৈশিষ্ট্য: ${keywords || "নেই"}

এই পণ্যের জন্য একটি আকর্ষণীয় বাংলা বিবরণ লিখো।`;

  try {
    const result = await askAI("product_description", systemPrompt, userPrompt);
    await logAIUsage(session.user.id, "product_description", getModelForFeature("product_description"));
    return NextResponse.json({ description: result.trim(), remaining: (limit.remaining ?? 1) - 1 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("401") || msg.includes("invalid")) return NextResponse.json({ error: "AI সেটআপে সমস্যা আছে। অ্যাডমিনকে জানান।" }, { status: 500 });
    if (msg.includes("429") || msg.includes("rate")) return NextResponse.json({ error: "AI এখন ব্যস্ত। ১ মিনিট পরে চেষ্টা করুন।" }, { status: 503 });
    return NextResponse.json({ error: "AI সঠিক উত্তর দিতে পারেনি। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
