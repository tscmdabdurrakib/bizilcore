import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cacheDel, CK } from "@/lib/cache";

async function getShopId(userId: string) {
  const shop = await prisma.shop.findUnique({ where: { userId }, select: { id: true } });
  return shop?.id;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const category = await prisma.category.findFirst({
    where: { id, shopId },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          sellPrice: true,
          stockQty: true,
          imageUrl: true,
        },
      },
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();
  const { name, description, position, isDefault } = body;

  // Verify category belongs to this shop
  const existing = await prisma.category.findFirst({
    where: { id, shopId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Cannot change isDefault from true to false if it's the only default
  if (isDefault === false && existing.isDefault) {
    const defaultCount = await prisma.category.count({
      where: { shopId, isDefault: true },
    });
    if (defaultCount <= 1) {
      return NextResponse.json({ error: "At least one default category is required" }, { status: 400 });
    }
  }

  // Check for duplicate name (if name is being changed)
  if (name && name.trim() !== existing.name) {
    const duplicate = await prisma.category.findFirst({
      where: {
        shopId,
        name: { equals: name.trim(), mode: "insensitive" },
        id: { not: id },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: "এই নামে ক্যাটাগরি আগে থেকেই আছে" }, { status: 409 });
    }
  }

  try {
    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description?.trim(),
        position: position ?? undefined,
        isDefault: isDefault ?? undefined,
      },
    });

    // Clear cache
    cacheDel(CK.categories(shopId));

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "ক্যাটাগরি আপডেট করা যায়নি" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const { id } = await params;

  // Verify category exists and belongs to this shop
  const category = await prisma.category.findFirst({
    where: { id, shopId },
  });

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Cannot delete the last category
  const count = await prisma.category.count({ where: { shopId } });
  if (count <= 1) {
    return NextResponse.json({ 
      error: "সর্বশেষ ক্যাটাগরি মুছে ফেলা যাবে না। নতুন ক্যাটাগরি তৈরি করে তারপর মুছুন।" 
    }, { status: 400 });
  }

  // Cannot delete default category if it has products
  if (category.isDefault) {
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });
    
    if (productCount > 0) {
      return NextResponse.json({ 
        error: "ডিফল্ট ক্যাটাগরি মুছে ফেলা যাবে না যখন এতে পণ্য আছে" 
      }, { status: 400 });
    }
  }

  try {
    // Find another category to move products to (prefer default)
    const targetCategory = await prisma.category.findFirst({
      where: { shopId, isDefault: true, id: { not: id } },
    }) || await prisma.category.findFirst({
      where: { shopId, id: { not: id } },
    });

    if (targetCategory) {
      // Move all products from this category to target
      await prisma.product.updateMany({
        where: { categoryId: id },
        data: { categoryId: targetCategory.id },
      });
    }

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    // Clear cache
    cacheDel(CK.categories(shopId));

    return NextResponse.json({ success: true, message: "ক্যাটাগরি মুছে ফেলা হয়েছে" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "ক্যাটাগরি মুছে ফেলা যায়নি" }, { status: 500 });
  }
}
