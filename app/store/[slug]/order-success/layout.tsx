import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const shop = await prisma.shop.findFirst({ where: { storeSlug: slug }, select: { name: true } });
  const storeName = shop?.name || "স্টোর";
  return {
    title: `অর্ডার সফল — ${storeName}`,
    description: `${storeName} এ আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে।`,
    robots: { index: false, follow: false },
  };
}

export default function OrderSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
