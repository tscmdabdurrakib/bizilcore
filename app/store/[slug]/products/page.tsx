import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductsPageClient } from "./ProductsPageClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({ where: { storeSlug: slug }, select: { name: true, logoUrl: true, storeBannerUrl: true } });
  if (!shop) return { title: "পণ্য তালিকা" };
  const ogImage = shop.storeBannerUrl || shop.logoUrl;
  return {
    title: `${shop.name} — সব পণ্য`,
    description: `${shop.name} এর সকল পণ্য দেখুন। অনলাইনে অর্ডার করুন।`,
    openGraph: {
      title: `${shop.name} — সব পণ্য`,
      description: `${shop.name} এর সকল পণ্য দেখুন।`,
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: { id: true, name: true, storeSlug: true, storeEnabled: true, storeShowStock: true, storePrimaryColor: true, storeTheme: true },
  });
  if (!shop || !shop.storeEnabled) notFound();

  const products = await prisma.product.findMany({
    where: { shopId: shop.id, storeVisible: true },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true, name: true, description: true, category: true,
      sellPrice: true, stockQty: true, imageUrl: true, images: true,
      hasVariants: true, storeVisible: true, storeFeatured: true,
    },
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

  return <ProductsPageClient shop={{ ...shop, storeSlug: shop.storeSlug! }} products={products} categories={categories} initialQ={sp.q} initialCategory={sp.category} />;
}
