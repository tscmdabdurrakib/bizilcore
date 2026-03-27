import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findFirst({ where: { storeSlug: slug }, select: { name: true } });
  const storeName = shop?.name || "স্টোর";
  return {
    title: `অর্ডার ট্র্যাক — ${storeName}`,
    description: `${storeName} এ আপনার অর্ডারের বর্তমান অবস্থান জানুন।`,
    robots: { index: false, follow: true },
  };
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
