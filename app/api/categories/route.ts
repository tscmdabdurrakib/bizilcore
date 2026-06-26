import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getApiShop } from "@/lib/shops/api-shop";
import { getCachedCategories } from "@/lib/data/cached-queries";
import { revalidateCategories } from "@/lib/cache/revalidate";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getApiShop();
  if ("error" in ctx) return ctx.error;
  const shopId = ctx.activeShop.id;

  const categories = await getCachedCategories(shopId);
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error("No session found");
      return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 });
    }

    const ctx = await getApiShop();
    if ("error" in ctx) return ctx.error;
    const shopId = ctx.activeShop.id;

    const body = await req.json();
    const { name, description, position } = body;

    console.log("Creating category:", { name, shopId });

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (!shopId) {
      return NextResponse.json({
        error: "আপনার কোনো শপ নেই। দয়া করে প্রথমে একটি শপ তৈরি করুন।",
      }, { status: 404 });
    }

    try {
      const existing = await prisma.category.findFirst({
        where: { shopId, name: { equals: name.trim(), mode: "insensitive" } },
      });

      if (existing) {
        return NextResponse.json({ error: "এই নামে ক্যাটাগরি আগে থেকেই আছে" }, { status: 409 });
      }

      const maxPos = await prisma.category.aggregate({
        where: { shopId },
        _max: { position: true },
      });

      const category = await prisma.category.create({
        data: {
          shopId,
          name: name.trim(),
          description: description?.trim() || null,
          position: position ?? (maxPos._max.position ?? 0) + 1,
        },
      });

      console.log("Category created successfully:", category.id);
      revalidateCategories(shopId);

      return NextResponse.json(category, { status: 201 });
    } catch (dbError) {
      console.error("Database error creating category:", dbError);
      return NextResponse.json({ error: "ক্যাটাগরি তৈরি করা যায়নি - Database error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/categories:", error);
    return NextResponse.json({ error: "দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।" }, { status: 500 });
  }
}
