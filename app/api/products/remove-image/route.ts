import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary, ProductImage } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, imageId } = await req.json();
  if (!productId || !imageId)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const shop = await prisma.shop.findUnique({ where: { userId: session.user.id } });
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: shop.id },
    select: { images: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const images: ProductImage[] = (product.images as unknown as ProductImage[]) ?? [];
  const target = images.find((img) => img.id === imageId);

  if (!target) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  if (target.type === "upload" && target.publicId) {
    await deleteFromCloudinary(target.publicId);
  }

  const updated = images
    .filter((img) => img.id !== imageId)
    .map((img, i) => ({ ...img, order: i, isPrimary: i === 0 }));

  await prisma.product.update({
    where: { id: productId },
    data: {
      images: updated,
      imageUrl: updated[0]?.src ?? null,
    },
  });

  return NextResponse.json({ success: true, images: updated });
}
