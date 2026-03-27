"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Star, ChevronLeft, Package, Minus, Plus, Zap, ImageIcon } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useStoreTheme } from "@/components/store/ThemeProvider";
import { useRouter } from "next/navigation";

interface Variant {
  id: string; name: string; size: string | null; color: string | null;
  price: number | null; stockQty: number;
}

interface Review {
  id: string; reviewerName: string; rating: number; comment: string | null; createdAt: string;
}

interface Product {
  id: string; name: string; description: string | null; category: string | null;
  sellPrice: number; stockQty: number; imageUrl: string | null; images: unknown;
  hasVariants: boolean; variants: Variant[];
  storeReviews?: Review[];
}

interface Props {
  product: Product;
  shop: { id: string; name: string; storeSlug: string; storeShowStock: boolean; storeShowReviews: boolean };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} fill={i <= rating ? "#F59E0B" : "none"} stroke={i <= rating ? "#F59E0B" : "#D1D5DB"} />
      ))}
    </span>
  );
}

export function ProductDetailClient({ product, shop }: Props) {
  const { primary, theme, accent, defaults } = useStoreTheme();
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();
  const slug = shop.storeSlug;

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.length === 1 ? product.variants[0] : null
  );
  const [qty, setQty] = useState(1);
  const [mainImage, setMainImage] = useState(product.imageUrl);

  const images: string[] = (() => {
    try {
      const imgs = product.images as string[] | null;
      if (Array.isArray(imgs) && imgs.length > 0) return imgs;
    } catch {}
    return product.imageUrl ? [product.imageUrl] : [];
  })();

  const effectivePrice = selectedVariant?.price ?? product.sellPrice;
  const effectiveStock = selectedVariant ? selectedVariant.stockQty : product.stockQty;
  const inStock = effectiveStock > 0;

  const sizeVariants = product.variants.filter(v => v.size);
  const colorVariants = product.variants.filter(v => v.color);
  const requiresVariant = product.hasVariants && product.variants.length > 0;
  const variantSelected = !requiresVariant || selectedVariant !== null;
  const canAddToCart = inStock && variantSelected;

  function addToCart(): boolean {
    if (!inStock) return false;
    if (!variantSelected) return false;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      unitPrice: effectivePrice,
      quantity: qty,
    }, slug);
    return true;
  }

  function buyNow() {
    if (!addToCart()) return;
    router.push(`/store/${slug}/checkout`);
  }

  const text = defaults.text;
  const muted = defaults.muted;
  const border = defaults.border;
  const surface = defaults.surface;

  const avgRating = product.storeReviews?.length
    ? product.storeReviews.reduce((s, r) => s + r.rating, 0) / product.storeReviews.length
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href={`/store/${slug}/products`} className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: muted }}>
        <ChevronLeft size={14} /> সব পণ্য
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden border mb-3" style={{ borderColor: border, backgroundColor: surface }}>
            {mainImage ? (
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><ImageIcon size={48} style={{ color: muted }} /></div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setMainImage(img)}
                  className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2"
                  style={{ borderColor: mainImage === img ? primary : border }}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {product.category && (
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: muted }}>{product.category}</p>
          )}
          <h1 className="text-2xl font-bold mb-2" style={{ color: text }}>{product.name}</h1>

          {avgRating !== null && (
            <div className="flex items-center gap-2 mb-3">
              <StarRating rating={Math.round(avgRating)} />
              <span className="text-xs" style={{ color: muted }}>({product.storeReviews?.length} রিভিউ)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold" style={{ color: primary }}>৳{effectivePrice.toLocaleString()}</span>
          </div>

          {shop.storeShowStock && (
            <p className="text-sm mb-4 font-medium" style={{ color: inStock ? "#10B981" : "#EF4444" }}>
              {inStock ? `✓ স্টক আছে${effectiveStock < 10 ? ` (মাত্র ${effectiveStock}টি)` : ""}` : "✗ স্টক শেষ"}
            </p>
          )}
          {!shop.storeShowStock && (
            <p className="text-sm mb-4 font-medium" style={{ color: inStock ? "#10B981" : "#EF4444" }}>
              {inStock ? "✓ স্টক আছে" : "✗ স্টক শেষ"}
            </p>
          )}

          {/* Size variants */}
          {sizeVariants.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2" style={{ color: text }}>সাইজ</p>
              <div className="flex gap-2 flex-wrap">
                {sizeVariants.map(v => (
                  <button key={v.id} onClick={() => setSelectedVariant(v)}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all"
                    style={{
                      borderColor: selectedVariant?.id === v.id ? primary : border,
                      backgroundColor: selectedVariant?.id === v.id ? primary + "15" : "transparent",
                      color: selectedVariant?.id === v.id ? primary : text,
                      opacity: v.stockQty === 0 ? 0.4 : 1,
                    }}>
                    {v.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color variants */}
          {colorVariants.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2" style={{ color: text }}>রং</p>
              <div className="flex gap-2 flex-wrap">
                {colorVariants.map(v => (
                  <button key={v.id} onClick={() => setSelectedVariant(v)}
                    title={v.color ?? v.name}
                    className="w-8 h-8 rounded-full border-4 transition-all"
                    style={{
                      backgroundColor: v.color ?? "#666",
                      borderColor: selectedVariant?.id === v.id ? primary : "transparent",
                      boxShadow: selectedVariant?.id === v.id ? `0 0 0 2px ${primary}` : "0 0 0 1px #ccc",
                      opacity: v.stockQty === 0 ? 0.4 : 1,
                    }} />
                ))}
              </div>
            </div>
          )}

          {/* Qty */}
          <div className="flex items-center gap-3 mb-6">
            <p className="text-sm font-semibold" style={{ color: text }}>পরিমাণ</p>
            <div className="flex items-center gap-0 border rounded-xl overflow-hidden" style={{ borderColor: border }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center" style={{ color: text }}>
                <Minus size={14} />
              </button>
              <span className="w-10 text-center text-sm font-bold" style={{ color: text }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 flex items-center justify-center" style={{ color: text }}>
                <Plus size={14} />
              </button>
            </div>
          </div>

          {requiresVariant && !variantSelected && (
            <div className="mb-4 px-3 py-2 rounded-xl text-sm font-semibold" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
              ⚠️ পণ্যটি কার্টে যোগ করতে আগে একটি ভ্যারিয়েন্ট বেছে নিন।
            </div>
          )}

          <div className="flex gap-3 mb-6">
            <button onClick={() => addToCart()} disabled={!canAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 disabled:opacity-40"
              style={{ borderColor: primary, color: primary }}>
              <ShoppingCart size={16} /> কার্টে যোগ
            </button>
            <button onClick={buyNow} disabled={!canAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40"
              style={{ backgroundColor: primary }}>
              <Zap size={16} /> এখনই কিনুন
            </button>
          </div>

          {product.description && (
            <div className="border-t pt-5 mt-2" style={{ borderColor: border }}>
              <p className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: text }}>পণ্যের বিবরণ</p>
              <p className="text-sm leading-7 whitespace-pre-line" style={{ color: muted }}>{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      {product.storeReviews && product.storeReviews.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold mb-6" style={{ color: text }}>কাস্টমার রিভিউ ({product.storeReviews.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.storeReviews.map(review => (
              <div key={review.id} className="p-4 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm" style={{ color: text }}>{review.reviewerName}</p>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && <p className="text-sm" style={{ color: muted }}>{review.comment}</p>}
                <p className="text-xs mt-2" style={{ color: muted }}>{new Date(review.createdAt).toLocaleDateString("bn-BD")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
