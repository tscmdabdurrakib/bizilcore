"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";

export default function LiveCommercePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; streamUrl: string | null; status: string; pinnedProductIds: string[] | null }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string; sellPrice: number; imageUrl: string | null; stockQty: number; hasVariants: boolean; storeFeatured: boolean; storeVisible: boolean; description: string | null; category: string | null; images: unknown }>>([]);

  useEffect(() => {
    fetch(`/api/store/live?slug=${slug}`).then(r => r.json()).then(setSessions);
    fetch(`/api/store/recommendations?slug=${slug}`).then(r => r.json()).then(d => setProducts(d.products ?? []));
  }, [slug]);

  const live = sessions.find(s => s.status === "live") ?? sessions[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href={`/store/${slug}`} className="text-sm text-gray-500 mb-4 inline-block">← Back to store</Link>
      <h1 className="text-2xl font-black mb-2">Live Shopping</h1>
      {!live ? (
        <p className="text-gray-500">No live sessions scheduled right now.</p>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-4">
              {live.streamUrl ? (
                <iframe src={live.streamUrl} className="w-full h-full" allowFullScreen title={live.title} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">{live.title}</div>
              )}
            </div>
            <h2 className="font-bold">{live.title}</h2>
            <p className="text-sm text-gray-500 capitalize">{live.status}</p>
          </div>
          <div>
            <h3 className="font-bold mb-4">Shop While Watching</h3>
            <div className="space-y-4">
              {products.slice(0, 6).map(p => (
                <DynamicProductCard key={p.id} product={{ ...p, images: p.images ?? [] }} slug={slug} fullWidth />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
