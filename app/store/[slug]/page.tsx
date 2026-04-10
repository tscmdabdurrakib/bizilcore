import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StoreHomeClient } from "./StoreHomeClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: { name: true, storeTagline: true, storeBannerUrl: true, logoUrl: true },
  });
  if (!shop) return { title: "স্টোর পাওয়া যায়নি" };
  return {
    title: `${shop.name} — অনলাইন শপ`,
    description: shop.storeTagline ?? `${shop.name} এর অনলাইন শপে স্বাগতম`,
    openGraph: {
      title: `${shop.name} — অনলাইন শপ`,
      description: shop.storeTagline ?? `${shop.name} এর অনলাইন শপে স্বাগতম`,
      images: shop.storeBannerUrl ? [shop.storeBannerUrl] : shop.logoUrl ? [shop.logoUrl] : [],
    },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: {
      id: true, name: true, logoUrl: true, phone: true, storeSlug: true,
      storeEnabled: true, storeTheme: true, storePrimaryColor: true, storeAccentColor: true,
      storeBannerUrl: true, storeTagline: true, storeAbout: true,
      storeShowReviews: true, storeShowStock: true,
      storeCODEnabled: true, storeBkashNumber: true, storeNagadNumber: true,
      storeMinOrder: true, storeFreeShipping: true, storeShippingFee: true, storeDhakaFee: true,
      storeSocialFB: true, storeSocialIG: true, storeSocialWA: true,
    },
  });

  if (!shop || !shop.storeEnabled) notFound();

  const [products, categoryRows, totalOrders, reviewRows] = await Promise.all([
    prisma.product.findMany({
      where: { shopId: shop.id, storeVisible: true },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true, name: true, description: true, category: true,
        sellPrice: true, stockQty: true, imageUrl: true, images: true,
        hasVariants: true, storeVisible: true, storeFeatured: true,
      },
    }),
    prisma.product.findMany({
      where: { shopId: shop.id, storeVisible: true, category: { not: null } },
      distinct: ["category"],
      select: { category: true },
    }),
    prisma.storeOrder.count({ where: { shopId: shop.id } }),
    shop.storeShowReviews
      ? prisma.storeReview.findMany({
          where: { shopId: shop.id, isApproved: true, comment: { not: null } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, reviewerName: true, rating: true, comment: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const reviews = reviewRows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));

  return (
    <StoreHomeClient
      shop={{ ...shop, storeSlug: shop.storeSlug! }}
      products={products}
      categories={categoryRows.map(c => c.category!)}
      totalOrders={totalOrders}
      reviews={reviews}
    />
  );
}
