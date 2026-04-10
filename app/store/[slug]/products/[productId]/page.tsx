import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "./ProductDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; productId: string }> }): Promise<Metadata> {
  const { slug, productId } = await params;
  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { id: true, name: true } });
  if (!shop) return { title: "পণ্য পাওয়া যায়নি" };
  const product = await prisma.product.findFirst({ where: { id: productId, shopId: shop.id }, select: { name: true, imageUrl: true, description: true } });
  if (!product) return { title: "পণ্য পাওয়া যায়নি" };
  return {
    title: `${product.name} — ${shop.name}`,
    description: product.description ?? `${product.name} কিনুন ${shop.name} থেকে`,
    openGraph: { images: product.imageUrl ? [product.imageUrl] : [] },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params;

  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: {
      id: true, name: true, storeSlug: true, storeEnabled: true,
      storeShowStock: true, storeShowReviews: true,
      storeSocialWA: true, phone: true,
    },
  });
  if (!shop || !shop.storeEnabled) notFound();

  const product = await prisma.product.findFirst({
    where: { id: productId, shopId: shop.id, storeVisible: true },
    select: {
      id: true, name: true, description: true, category: true,
      sellPrice: true, stockQty: true, imageUrl: true, images: true, hasVariants: true,
      variants: { select: { id: true, name: true, size: true, color: true, price: true, stockQty: true } },
      storeReviews: shop.storeShowReviews ? {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        select: { id: true, reviewerName: true, rating: true, comment: true, createdAt: true },
        take: 20,
      } : false,
    },
  });
  if (!product) notFound();

  const relatedProducts = product.category ? await prisma.product.findMany({
    where: {
      shopId: shop.id,
      storeVisible: true,
      category: product.category,
      id: { not: productId },
    },
    select: { id: true, name: true, sellPrice: true, imageUrl: true, stockQty: true, hasVariants: true, storeFeatured: true },
    take: 6,
    orderBy: { storeFeatured: "desc" },
  }) : [];

  return (
    <ProductDetailClient
      product={{
        ...product,
        storeReviews: (product.storeReviews || []).map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
      }}
      shop={{ ...shop, storeSlug: shop.storeSlug! }}
      relatedProducts={relatedProducts}
    />
  );
}
