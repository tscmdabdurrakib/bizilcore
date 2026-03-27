import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CatalogPageClient from "./CatalogPageClient";

interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sellPrice: number;
  stockQty: number;
  imageUrl: string | null;
  hasVariants: boolean;
}

interface CatalogShop {
  name: string;
  phone: string | null;
  category: string | null;
  logoUrl: string | null;
  tagline: string | null;
}

interface CatalogData {
  shop: CatalogShop;
  products: CatalogProduct[];
}

async function getCatalogData(slug: string): Promise<CatalogData | null> {
  try {
    const shop = await prisma.shop.findUnique({
      where: { slug },
      select: {
        name: true,
        phone: true,
        category: true,
        logoUrl: true,
        catalogEnabled: true,
        catalogTagline: true,
        catalogShowInStockOnly: true,
        products: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            sellPrice: true,
            stockQty: true,
            imageUrl: true,
            hasVariants: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!shop || !shop.catalogEnabled) return null;

    const products: CatalogProduct[] = shop.catalogShowInStockOnly
      ? shop.products.filter((p) => p.stockQty > 0)
      : shop.products;

    return {
      shop: {
        name: shop.name,
        phone: shop.phone,
        category: shop.category,
        logoUrl: shop.logoUrl,
        tagline: shop.catalogTagline,
      },
      products,
    };
  } catch (err) {
    console.error("[catalog] Error loading catalog data for slug:", slug, err);
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let data: CatalogData | null = null;
  try { data = await getCatalogData(slug); } catch { /* DB error - metadata falls back */ }
  if (!data) return { title: "Shop Not Found" };
  return {
    title: `${data.shop.name} — পণ্য ক্যাটালগ`,
    description:
      data.shop.tagline ??
      `${data.shop.name} এর সকল পণ্য দেখুন এবং অর্ডার করুন।`,
    openGraph: {
      title: `${data.shop.name} — পণ্য ক্যাটালগ`,
      description:
        data.shop.tagline ??
        `${data.shop.name} এর সকল পণ্য দেখুন এবং অর্ডার করুন।`,
    },
  };
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCatalogData(slug);
  if (!data) notFound();

  return <CatalogPageClient shop={data.shop} products={data.products} />;
}
