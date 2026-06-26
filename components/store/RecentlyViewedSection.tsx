"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { getRecentlyViewed, type RecentlyViewedProduct } from "@/lib/store/recently-viewed";

interface Props {
  slug: string;
  excludeId?: string;
}

export function RecentlyViewedSection({ slug, excludeId }: Props) {
  const [items, setItems] = useState<RecentlyViewedProduct[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed(slug, excludeId));
  }, [slug, excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="py-10 border-t border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-black uppercase tracking-tight">Recently Viewed</h2>
        <Link href={`/store/${slug}/products`} className="text-sm font-medium border border-black px-5 py-2 rounded-full hover:bg-black hover:text-white transition-colors">
          View All
        </Link>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        {items.map((p) => (
          <DynamicProductCard
            key={p.id}
            slug={slug}
            product={{
              id: p.id,
              name: p.name,
              sellPrice: p.sellPrice,
              imageUrl: p.imageUrl,
              stockQty: 1,
              hasVariants: false,
              storeFeatured: false,
              storeVisible: true,
              description: null,
              category: null,
              images: p.imageUrl ? [p.imageUrl] : [],
            }}
          />
        ))}
      </div>
    </section>
  );
}
