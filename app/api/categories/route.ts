import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheDel, CK, TTL, cacheGet, cacheSet } from "@/lib/cache";

async function getShopId(userId: string) {
  const shop = await prisma.shop.findUnique({ where: { userId }, select: { id: true } });
  return shop?.id;
}

async function ensureDefaultCategory(shopId: string) {
  const count = await prisma.category.count({ where: { shopId } });
  if (count === 0) {
    return prisma.category.create({
      data: { shopId, name: "অন্যান্য", isDefault: true, position: 0 },
    });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  // Check cache first
  const cached = cacheGet<typeof categories>(CK.categories(shopId));
  if (cached) {
    return NextResponse.json(cached);
  }

  const categories = await prisma.category.findMany({
    where: { shopId },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  // Ensure default category exists
  await ensureDefaultCategory(shopId);

  // Cache the result
  cacheSet(CK.categories(shopId), categories, TTL.CATEGORIES);

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error("No session found");
      return NextResponse.json({ error: "Unauthorized - Please login" }, { status: 401 });
    }
    
    const shopId = await getShopId(session.user.id);
    if (!shopId) {
      console.error("No shop found for user:", session.user.id);
      return NextResponse.json({ error: "Shop not found - Please create a shop first" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, position } = body;

    console.log("Creating category:", { name, shopId });

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    if (!shopId) {
      return NextResponse.json({ 
        error: "আপনার কোনো শপ নেই। দয়া করে প্রথমে একটি শপ তৈরি করুন।" 
      }, { status: 404 });
    }

    try {
      // Check for duplicate category name in the same shop
      const existing = await prisma.category.findFirst({
        where: { shopId, name: { equals: name.trim(), mode: "insensitive" } },
      });

      if (existing) {
        return NextResponse.json({ error: "এই নামে ক্যাটাগরি আগে থেকেই আছে" }, { status: 409 });
      }

      // Get max position to add at the end
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

      // Clear cache
      cacheDel(CK.categories(shopId));

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
