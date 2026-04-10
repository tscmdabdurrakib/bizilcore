"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingCart, Star, ChevronLeft, Package, Minus, Plus, Zap,
  ImageIcon, Heart, Share2, MessageCircle, CheckCircle
} from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useStoreTheme } from "@/components/store/ThemeProvider";
import { useRouter } from "next/navigation";

interface Variant {
  id: string; name: string; size: string | null; color: string | null;
  price: number | null; stockQty: number;
}

interface Review {
  id: string; reviewerName: string; rating: number; comment: string | null; createdAt: string;
}

interface RelatedProduct {
  id: string; name: string; sellPrice: number; imageUrl: string | null;
  stockQty: number; hasVariants: boolean; storeFeatured: boolean;
}

interface Product {
  id: string; name: string; description: string | null; category: string | null;
  sellPrice: number; stockQty: number; imageUrl: string | null; images: unknown;
  hasVariants: boolean; variants: Variant[];
  storeReviews?: Review[];
}

interface Props {
  product: Product;
  shop: {
    id: string; name: string; storeSlug: string;
    storeShowStock: boolean; storeShowReviews: boolean;
    storeSocialWA: string | null; phone: string | null;
  };
  relatedProducts: RelatedProduct[];
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

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button
          key={i} type="button"
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
        >
          <Star size={22}
            fill={(hover || value) >= i ? "#F59E0B" : "none"}
            stroke={(hover || value) >= i ? "#F59E0B" : "#D1D5DB"}
          />
        </button>
      ))}
    </span>
  );
}

export function ProductDetailClient({ product, shop, relatedProducts }: Props) {
  const { primary, theme, accent, defaults } = useStoreTheme();
  const addItem = useCart((s) => s.addItem);
  const { toggle, isWishlisted } = useWishlist();
  const router = useRouter();
  const slug = shop.storeSlug;
  const wishlisted = isWishlisted(product.id);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.length === 1 ? product.variants[0] : null
  );
  const [qty, setQty] = useState(1);
  const [mainImage, setMainImage] = useState(product.imageUrl);
  const [addedToCart, setAddedToCart] = useState(false);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");

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
    if (!inStock || !variantSelected) return false;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      unitPrice: effectivePrice,
      quantity: qty,
    }, slug);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
    return true;
  }

  function buyNow() {
    if (!addToCart()) return;
    router.push(`/store/${slug}/checkout`);
  }

  function handleWishlist() {
    toggle({
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      sellPrice: product.sellPrice,
      slug,
    });
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  const waNumber = shop.storeSocialWA || shop.phone;
  const waLink = waNumber
    ? `https://wa.me/${waNumber.replace(/[^0-9]/g, "").replace(/^0/, "880")}?text=${encodeURIComponent(`${product.name} সম্পর্কে জানতে চাই।`)}`
    : null;

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError(""); setReviewSuccess(""); setReviewLoading(true);
    const r = await fetch("/api/store/reviews/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, productId: product.id, reviewerName: reviewName, rating: reviewRating, comment: reviewComment }),
    });
    const d = await r.json();
    if (r.ok) {
      setReviewSuccess(d.message);
      setReviewName(""); setReviewComment(""); setReviewRating(5);
    } else {
      setReviewError(d.error || "রিভিউ জমা করা যায়নি।");
    }
    setReviewLoading(false);
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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs mb-5" style={{ color: muted }}>
        <Link href={`/store/${slug}`} className="hover:underline">হোম</Link>
        <span>/</span>
        <Link href={`/store/${slug}/products`} className="hover:underline">সব পণ্য</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/store/${slug}/products?category=${encodeURIComponent(product.category)}`} className="hover:underline">
              {product.category}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="truncate max-w-[160px]" style={{ color: text }}>{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden border mb-3 relative group" style={{ borderColor: border, backgroundColor: surface }}>
            {mainImage ? (
              <img
                src={mainImage} alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><ImageIcon size={48} style={{ color: muted }} /></div>
            )}
            <button
              onClick={handleWishlist}
              className="absolute top-3 right-3 w-9 h-9 rounded-full shadow-md flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110"
              style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
            >
              <Heart size={16} fill={wishlisted ? "#EF4444" : "none"} stroke={wishlisted ? "#EF4444" : "#9CA3AF"} />
            </button>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setMainImage(img)}
                  className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all"
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
            <Link href={`/store/${slug}/products?category=${encodeURIComponent(product.category)}`}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 hover:underline" style={{ color: primary }}>{product.category}</p>
            </Link>
          )}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold leading-tight" style={{ color: text }}>{product.name}</h1>
            <button onClick={handleShare} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl border" style={{ borderColor: border, color: muted }}>
              <Share2 size={14} />
            </button>
          </div>

          {avgRating !== null && (
            <div className="flex items-center gap-2 mb-3">
              <StarRating rating={Math.round(avgRating)} />
              <span className="text-xs" style={{ color: muted }}>({product.storeReviews?.length} রিভিউ)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold" style={{ color: primary }}>৳{effectivePrice.toLocaleString()}</span>
          </div>

          <p className="text-sm mb-4 font-medium" style={{ color: inStock ? "#10B981" : "#EF4444" }}>
            {inStock
              ? shop.storeShowStock && effectiveStock < 10
                ? `✓ স্টক আছে (মাত্র ${effectiveStock}টি)`
                : "✓ স্টক আছে"
              : "✗ স্টক শেষ"
            }
          </p>

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
          <div className="flex items-center gap-3 mb-5">
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

          <div className="flex gap-3 mb-4">
            <button onClick={() => addToCart()} disabled={!canAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all disabled:opacity-40"
              style={{
                borderColor: primary, color: addedToCart ? "white" : primary,
                backgroundColor: addedToCart ? "#10B981" : "transparent",
                borderColor: addedToCart ? "#10B981" : primary,
              }}>
              {addedToCart ? <CheckCircle size={16} /> : <ShoppingCart size={16} />}
              {addedToCart ? "কার্টে যোগ হয়েছে!" : "কার্টে যোগ"}
            </button>
            <button onClick={buyNow} disabled={!canAddToCart}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-40"
              style={{ backgroundColor: primary }}>
              <Zap size={16} /> এখনই কিনুন
            </button>
          </div>

          {/* WhatsApp Order */}
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm text-white mb-4"
              style={{ backgroundColor: "#25D366" }}>
              <MessageCircle size={15} />
              WhatsApp এ অর্ডার করুন
            </a>
          )}

          {/* Wishlist */}
          <button onClick={handleWishlist}
            className="flex items-center gap-2 text-sm font-semibold mb-5"
            style={{ color: wishlisted ? "#EF4444" : muted }}>
            <Heart size={15} fill={wishlisted ? "#EF4444" : "none"} stroke={wishlisted ? "#EF4444" : muted} />
            {wishlisted ? "পছন্দের তালিকায় যোগ হয়েছে" : "পছন্দের তালিকায় যোগ করুন"}
          </button>

          {product.description && (
            <div className="border-t pt-5 mt-2" style={{ borderColor: border }}>
              <p className="text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: text }}>পণ্যের বিবরণ</p>
              <p className="text-sm leading-7 whitespace-pre-line" style={{ color: muted }}>{product.description}</p>
            </div>
          )}

          {/* Trust badges */}
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[10px] font-semibold" style={{ color: muted }}>
            <div className="p-2 rounded-xl border" style={{ borderColor: border }}>🔒 নিরাপদ পেমেন্ট</div>
            <div className="p-2 rounded-xl border" style={{ borderColor: border }}>🚚 দ্রুত ডেলিভারি</div>
            <div className="p-2 rounded-xl border" style={{ borderColor: border }}>↩️ সহজ রিটার্ন</div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ color: text }}>একই ক্যাটাগরির পণ্য</h2>
            <Link href={`/store/${slug}/products?category=${encodeURIComponent(product.category ?? "")}`}
              className="text-sm font-semibold" style={{ color: primary }}>
              সব দেখুন →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {relatedProducts.map(p => (
              <Link key={p.id} href={`/store/${slug}/products/${p.id}`}
                className="group rounded-2xl border overflow-hidden hover:shadow-md transition-all"
                style={{ borderColor: border, backgroundColor: surface }}>
                <div className="aspect-square overflow-hidden" style={{ backgroundColor: defaults.bg }}>
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package size={24} style={{ color: muted }} /></div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold line-clamp-2 mb-1" style={{ color: text }}>{p.name}</p>
                  <p className="text-xs font-bold" style={{ color: primary }}>৳{p.sellPrice.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews section */}
      {shop.storeShowReviews && (
        <section className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ color: text }}>
              কাস্টমার রিভিউ
              {product.storeReviews && product.storeReviews.length > 0 && (
                <span className="ml-2 text-sm font-normal" style={{ color: muted }}>({product.storeReviews.length}টি)</span>
              )}
            </h2>
            {avgRating !== null && (
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(avgRating)} />
                <span className="text-sm font-bold" style={{ color: text }}>{avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {product.storeReviews && product.storeReviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {product.storeReviews.map(review => (
                <div key={review.id} className="p-4 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: primary + "18", color: primary }}>
                        {review.reviewerName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-semibold text-sm" style={{ color: text }}>{review.reviewerName}</p>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.comment && <p className="text-sm leading-6" style={{ color: muted }}>{review.comment}</p>}
                  <p className="text-xs mt-2" style={{ color: muted }}>{new Date(review.createdAt).toLocaleDateString("bn-BD")}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 mb-6 rounded-2xl border" style={{ borderColor: border }}>
              <Star size={32} style={{ color: "#D1D5DB", margin: "0 auto 8px" }} />
              <p className="text-sm" style={{ color: muted }}>এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!</p>
            </div>
          )}

          {/* Review submission form */}
          <div className="p-5 rounded-2xl border" style={{ borderColor: border, backgroundColor: surface }}>
            <h3 className="font-bold mb-4" style={{ color: text }}>রিভিউ দিন</h3>
            {reviewSuccess ? (
              <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: "#ECFDF5" }}>
                <CheckCircle size={20} color="#10B981" />
                <p className="text-sm font-semibold text-green-700">{reviewSuccess}</p>
              </div>
            ) : (
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>রেটিং *</label>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>আপনার নাম *</label>
                  <input
                    required value={reviewName} onChange={e => setReviewName(e.target.value)}
                    placeholder="আপনার নাম লিখুন"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: border, backgroundColor: defaults.bg, color: text }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>মন্তব্য (ঐচ্ছিক)</label>
                  <textarea
                    value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                    rows={3} placeholder="আপনার অভিজ্ঞতা শেয়ার করুন..."
                    className="w-full border rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: border, backgroundColor: defaults.bg, color: text, resize: "none" }}
                  />
                </div>
                {reviewError && <p className="text-xs text-red-500">{reviewError}</p>}
                <button
                  type="submit" disabled={reviewLoading || !reviewName}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                  style={{ backgroundColor: primary }}
                >
                  {reviewLoading ? "জমা হচ্ছে..." : "রিভিউ জমা দিন"}
                </button>
              </form>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
