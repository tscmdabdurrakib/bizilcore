import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findFirst({ where: { storeSlug: slug }, select: { name: true } });
  const storeName = shop?.name || "স্টোর";
  return {
    title: `চেকআউট — ${storeName}`,
    description: `${storeName} এ আপনার অর্ডার সম্পন্ন করুন।`,
    robots: { index: false, follow: false },
  };
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
