import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findFirst({ where: { storeSlug: slug }, select: { name: true } });
  const storeName = shop?.name || "স্টোর";
  return {
    title: `কার্ট — ${storeName}`,
    description: `${storeName} এর কার্ট পর্যালোচনা করুন এবং অর্ডার করুন।`,
    robots: { index: false, follow: false },
  };
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
