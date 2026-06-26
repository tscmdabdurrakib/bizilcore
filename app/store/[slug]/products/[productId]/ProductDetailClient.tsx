"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart, Star, Minus, Plus, Zap,
  ImageIcon, Heart, Share2, MessageCircle, CheckCircle, ChevronRight, Bell
} from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useStoreCustomer } from "@/lib/store/store-customer";
import { useRouter } from "next/navigation";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { trackRecentlyViewed } from "@/lib/store/recently-viewed";
import { trackFunnelEvent } from "@/lib/store/funnel";
import { trackStoreAddToCart } from "@/components/store/StorePixelTracker";
import { RecentlyViewedSection } from "@/components/store/RecentlyViewedSection";
import { WhatsAppShareButton } from "@/components/store/WhatsAppShareButton";
import { SocialProofBadge } from "@/components/store/SocialProofBadge";

/* ── Types ── */
interface Variant { id: string; name: string; size: string | null; color: string | null; price: number | null; stockQty: number; }
interface Review { id: string; reviewerName: string; rating: number; comment: string | null; createdAt: string; }
interface RelatedProduct { id: string; name: string; sellPrice: number; imageUrl: string | null; stockQty: number; hasVariants: boolean; storeFeatured: boolean; images?: unknown; description?: string | null; category?: string | null; storeVisible?: boolean; }
interface Product {
  id: string; name: string; description: string | null; category: string | null;
  sellPrice: number; stockQty: number; imageUrl: string | null; images: unknown;
  hasVariants: boolean; variants: Variant[]; storeReviews?: Review[];
  storeFeatured?: boolean | null;
}
interface Props {
  product: Product;
  shop: { id: string; name: string; storeSlug: string; storeShowStock: boolean; storeShowReviews: boolean; storeSocialWA: string | null; phone: string | null; storeSocialProofEnabled?: boolean; };
  relatedProducts: RelatedProduct[];
}

/* ── Stars ── */
function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          fill={i <= Math.round(rating) ? "#FFC633" : "none"}
          stroke={i <= Math.round(rating) ? "#FFC633" : "#D1D5DB"} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}>
          <Star size={24} fill={(hover || value) >= i ? "#FFC633" : "none"} stroke={(hover || value) >= i ? "#FFC633" : "#D1D5DB"} />
        </button>
      ))}
    </div>
  );
}

/* ── Main ── */
export function ProductDetailClient({ product, shop, relatedProducts }: Props) {
  const addItem = useCart((s) => s.addItem);
  const { toggle, isWishlisted } = useWishlist();
  const { customer } = useStoreCustomer();
  const router = useRouter();
  const slug = shop.storeSlug;
  const wishlisted = isWishlisted(product.id);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    product.variants.length === 1 ? product.variants[0] : null
  );
  const [qty, setQty] = useState(1);
  const [mainImage, setMainImage] = useState(product.imageUrl);
  const [addedToCart, setAddedToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<"details"|"reviews"|"faqs">("details");
  const [productQuestions, setProductQuestions] = useState<Array<{ id: string; askerName: string; question: string; answer: string | null }>>([]);
  const [qaForm, setQaForm] = useState({ name: "", phone: "", question: "" });
  const [qaSubmitting, setQaSubmitting] = useState(false);

  /* review form */
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifySent, setNotifySent] = useState(false);

  useEffect(() => {
    trackRecentlyViewed(slug, {
      id: product.id,
      name: product.name,
      sellPrice: product.sellPrice,
      imageUrl: product.imageUrl,
    });
    trackFunnelEvent(shop.id, "product_view", product.id);
    fetch(`/api/store/product-questions?slug=${slug}&productId=${product.id}`)
      .then(r => r.json())
      .then(d => setProductQuestions(d.questions ?? []))
      .catch(() => {});
  }, [slug, shop.id, product.id, product.name, product.sellPrice, product.imageUrl]);

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!qaForm.name || !qaForm.question) return;
    setQaSubmitting(true);
    const r = await fetch("/api/store/product-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, productId: product.id, ...qaForm }),
    });
    setQaSubmitting(false);
    if (r.ok) {
      setQaForm({ name: "", phone: "", question: "" });
      setReviewSuccess("প্রশ্ন পাঠানো হয়েছে! উত্তর পেলে এখানে দেখাবে।");
    }
  }

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
  const canAdd = inStock && variantSelected;

  const avgRating = product.storeReviews?.length
    ? product.storeReviews.reduce((s, r) => s + r.rating, 0) / product.storeReviews.length
    : 4.5;
  const reviewCount = product.storeReviews?.length ?? 0;

  /* Simulated original price for discount display */
  const discountPct = product.storeFeatured ? 20 : 0;
  const origPrice = discountPct > 0 ? Math.round(effectivePrice / (1 - discountPct / 100)) : null;

  function handleAddToCart(): boolean {
    if (!canAdd) return false;
    addItem({
      itemType: "product",
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      unitPrice: effectivePrice,
      quantity: qty,
    }, slug);
    trackFunnelEvent(shop.id, "add_to_cart", product.id);
    trackStoreAddToCart(product.id, effectivePrice * qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    return true;
  }

  async function handleNotifyMe() {
    if (!notifyEmail.trim()) return;
    await fetch("/api/store/stock-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, productId: product.id, email: notifyEmail }),
    });
    setNotifySent(true);
  }

  function handleBuyNow() { if (handleAddToCart()) router.push(`/store/${slug}/checkout`); }

  function handleWishlist() {
    toggle({ productId: product.id, productName: product.name, productImage: product.imageUrl, sellPrice: product.sellPrice, slug });
    if (customer) {
      const method = wishlisted ? "DELETE" : "POST";
      const url = wishlisted
        ? `/api/store/wishlist?productId=${product.id}`
        : "/api/store/wishlist";
      fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? JSON.stringify({ productId: product.id, slug }) : undefined,
      }).catch(() => {});
    }
  }

  function handleShare() {
    if (navigator.share) navigator.share({ title: product.name, url: window.location.href });
    else navigator.clipboard.writeText(window.location.href);
  }

  const waNumber = shop.storeSocialWA || shop.phone;
  const waLink = waNumber
    ? `https://wa.me/${waNumber.replace(/[^0-9]/g, "").replace(/^0/, "880")}?text=${encodeURIComponent(`${product.name} সম্পর্কে জানতে চাই।`)}`
    : null;

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError(""); setReviewSuccess(""); setReviewLoading(true);
    const r = await fetch("/api/store/reviews/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, productId: product.id, reviewerName: reviewName, rating: reviewRating, comment: reviewComment }),
    });
    const d = await r.json();
    if (r.ok) { setReviewSuccess(d.message); setReviewName(""); setReviewComment(""); setReviewRating(5); }
    else setReviewError(d.error || "রিভিউ জমা করা যায়নি।");
    setReviewLoading(false);
  }

  /* ── Render ── */
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
          <Link href={`/store/${slug}`} className="hover:text-black transition-colors">Home</Link>
          <ChevronRight size={14} className="text-gray-400" />
          <Link href={`/store/${slug}/products`} className="hover:text-black transition-colors">
            {product.category || "Shop"}
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-black font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ── Product Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-14">

          {/* Left: Image Gallery */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex flex-col gap-3 w-20 flex-shrink-0">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setMainImage(img)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${mainImage === img ? "border-black" : "border-gray-200 hover:border-gray-400"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 relative bg-[#F2F0F1] rounded-2xl overflow-hidden"
              style={{ aspectRatio: "1/1" }}>
              {mainImage ? (
                <img src={mainImage} alt={product.name}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon size={64} className="text-gray-300" />
                </div>
              )}
              {/* Wishlist button */}
              <button onClick={handleWishlist}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-110 transition-transform">
                <Heart size={18} fill={wishlisted ? "#EF4444" : "none"} stroke={wishlisted ? "#EF4444" : "#9CA3AF"} />
              </button>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">

            {/* Name */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-2xl sm:text-3xl font-black text-black leading-tight">{product.name}</h1>
              <button onClick={handleShare}
                className="flex-shrink-0 w-9 h-9 border border-gray-300 rounded-full flex items-center justify-center text-gray-500 hover:border-black hover:text-black transition-colors">
                <Share2 size={14} />
              </button>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <Stars rating={avgRating} size={18} />
              <span className="text-sm text-gray-500">{avgRating.toFixed(1)}/5</span>
              {reviewCount > 0 && (
                <button onClick={() => setActiveTab("reviews")}
                  className="text-sm text-gray-400 hover:text-black underline">
                  ({reviewCount} Reviews)
                </button>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl font-black text-black">৳{effectivePrice.toLocaleString()}</span>
              {origPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through font-medium">৳{origPrice.toLocaleString()}</span>
                  <span className="text-sm font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">-{discountPct}%</span>
                </>
              )}
            </div>

            <div className="h-px bg-gray-200 mb-5" />

            {/* Color selector */}
            {colorVariants.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-black mb-3">
                  Select Colors{selectedVariant?.color ? <span className="font-normal text-gray-500 ml-2">{selectedVariant.color}</span> : null}
                </p>
                <div className="flex gap-2.5 flex-wrap">
                  {colorVariants.map(v => (
                    <button key={v.id} onClick={() => setSelectedVariant(v)}
                      title={v.color ?? v.name}
                      className={`w-9 h-9 rounded-full transition-all flex-shrink-0 ${selectedVariant?.id === v.id ? "ring-2 ring-offset-2 ring-black" : "ring-1 ring-gray-300"}`}
                      style={{ backgroundColor: v.color ?? "#888", opacity: v.stockQty === 0 ? 0.35 : 1 }} />
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {sizeVariants.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-black mb-3">Choose Size</p>
                <div className="flex gap-2.5 flex-wrap">
                  {sizeVariants.map(v => (
                    <button key={v.id} onClick={() => setSelectedVariant(v)}
                      className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                        selectedVariant?.id === v.id
                          ? "bg-black text-white border-black"
                          : "bg-[#F0F0F0] text-gray-700 border-transparent hover:border-black"
                      } ${v.stockQty === 0 ? "opacity-35 cursor-not-allowed" : ""}`}
                      disabled={v.stockQty === 0}>
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {requiresVariant && !variantSelected && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">
                ⚠️ পণ্যটি কার্টে যোগ করতে আগে ভ্যারিয়েন্ট বেছে নিন।
              </p>
            )}

            <div className="h-px bg-gray-200 mb-5" />

            {/* Quantity + Add to Cart */}
            <div className="flex gap-3 mb-4">
              {/* Qty */}
              <div className="flex items-center gap-0 bg-[#F0F0F0] rounded-full px-2">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-9 h-11 flex items-center justify-center text-gray-700 hover:text-black">
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center text-sm font-bold text-black">{qty}</span>
                <button onClick={() => setQty(q => Math.min(effectiveStock || 99, q + 1))}
                  className="w-9 h-11 flex items-center justify-center text-gray-700 hover:text-black">
                  <Plus size={16} />
                </button>
              </div>

              {/* Add to Cart */}
              <button onClick={handleAddToCart} disabled={!canAdd}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-all ${
                  addedToCart
                    ? "bg-green-500 text-white"
                    : "bg-black text-white hover:bg-gray-800"
                } disabled:opacity-40`}>
                {addedToCart ? <CheckCircle size={16} /> : <ShoppingCart size={16} />}
                {addedToCart ? "Added to Cart!" : "Add to Cart"}
              </button>
            </div>

            {/* Buy Now */}
            <button onClick={handleBuyNow} disabled={!canAdd}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold border-2 border-black text-black hover:bg-black hover:text-white transition-all disabled:opacity-40 mb-4">
              <Zap size={15} /> Buy It Now
            </button>

            {/* WhatsApp */}
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-semibold text-white mb-4"
                style={{ backgroundColor: "#25D366" }}>
                <MessageCircle size={15} /> WhatsApp এ অর্ডার করুন
              </a>
            )}

            {/* Stock indicator */}
            <p className={`text-xs font-semibold ${inStock ? "text-green-600" : "text-red-500"}`}>
              {inStock
                ? shop.storeShowStock && effectiveStock < 10
                  ? `✓ স্টক আছে — মাত্র ${effectiveStock}টি বাকি`
                  : "✓ স্টক আছে"
                : "✗ স্টক শেষ"}
            </p>
            {!inStock && (
              <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Bell size={14} /> Notify when back in stock</p>
                {notifySent ? (
                  <p className="text-xs text-green-600">We&apos;ll notify you when restocked!</p>
                ) : (
                  <div className="flex gap-2">
                    <input value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder="Your email" className="flex-1 border rounded-full px-3 py-2 text-sm" />
                    <button onClick={handleNotifyMe} className="px-4 py-2 bg-black text-white text-xs rounded-full">Notify Me</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="border-t border-gray-200">
          <div className="flex gap-0 overflow-x-auto">
            {([
              { key: "details", label: "Product Details" },
              { key: "reviews", label: `Rating & Reviews${reviewCount > 0 ? ` (${reviewCount})` : ""}` },
              { key: "faqs",    label: "FAQs" },
            ] as { key: "details"|"reviews"|"faqs"; label: string }[]).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-6 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8">
            {/* Product Details tab */}
            {activeTab === "details" && (
              <div className="max-w-2xl">
                {product.description ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
                ) : (
                  <p className="text-gray-400">এই পণ্যের বিবরণ এখনো যোগ করা হয়নি।</p>
                )}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    { icon: "🔒", text: "Secure Payment" },
                    { icon: "🚚", text: "Free Shipping" },
                    { icon: "↩️", text: "Easy Returns" },
                  ].map(b => (
                    <div key={b.text} className="flex flex-col items-center gap-2 p-4 bg-[#F0F0F0] rounded-2xl text-center">
                      <span className="text-2xl">{b.icon}</span>
                      <span className="text-xs font-semibold text-gray-700">{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rating & Reviews tab */}
            {activeTab === "reviews" && (
              <div>
                {/* Summary header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-4xl font-black text-black">{avgRating.toFixed(1)}</span>
                      <div>
                        <Stars rating={avgRating} size={18} />
                        <p className="text-xs text-gray-500 mt-1">{reviewCount > 0 ? `${reviewCount} Reviews` : "No reviews yet"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review cards */}
                {product.storeReviews && product.storeReviews.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                    {product.storeReviews.map(r => (
                      <div key={r.id} className="border border-gray-200 rounded-2xl p-6">
                        <div className="flex gap-0.5 mb-3">
                          <Stars rating={r.rating} size={16} />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-bold text-black text-sm">{r.reviewerName}</span>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="8" fill="#01AB31"/>
                            <path d="M4.5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        {r.comment && (
                          <p className="text-sm text-gray-600 leading-relaxed">"{r.comment}"</p>
                        )}
                        <p className="text-xs text-gray-400 mt-3">
                          {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 mb-8 border border-gray-200 rounded-2xl">
                    <Star size={36} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">Be the first to review this product!</p>
                  </div>
                )}

                {/* Write a review form */}
                {shop.storeShowReviews && (
                  <div className="border border-gray-200 rounded-2xl p-6 max-w-xl">
                    <h3 className="font-bold text-black mb-5 text-lg">Write a Review</h3>
                    {reviewSuccess ? (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                        <CheckCircle size={20} className="text-green-500" />
                        <p className="text-sm font-semibold text-green-700">{reviewSuccess}</p>
                      </div>
                    ) : (
                      <form onSubmit={submitReview} className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-2 block">Your Rating *</label>
                          <StarPicker value={reviewRating} onChange={setReviewRating} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Your Name *</label>
                          <input required value={reviewName} onChange={e => setReviewName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black transition-colors bg-white" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 mb-1 block">Your Review (Optional)</label>
                          <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                            rows={4} placeholder="Share your experience with this product..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-black transition-colors bg-white resize-none" />
                        </div>
                        {reviewError && <p className="text-xs text-red-500">{reviewError}</p>}
                        <button type="submit" disabled={reviewLoading || !reviewName}
                          className="bg-black text-white text-sm font-semibold px-8 py-3 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50">
                          {reviewLoading ? "Submitting..." : "Submit Review"}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* FAQs tab */}
            {activeTab === "faqs" && (
              <div className="max-w-2xl space-y-4">
                {productQuestions.length > 0 ? productQuestions.map(q => (
                  <details key={q.id} className="border border-gray-200 rounded-2xl" open>
                    <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-black select-none">
                      {q.question} <span className="text-gray-400 font-normal">— {q.askerName}</span>
                    </summary>
                    <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{q.answer}</p>
                  </details>
                )) : (
                  <p className="text-sm text-gray-500">এখনো কোনো প্রশ্ন-উত্তর নেই। প্রথম প্রশ্ন করুন!</p>
                )}
                <form onSubmit={submitQuestion} className="border border-gray-200 rounded-2xl p-5 space-y-3 mt-6">
                  <h4 className="font-semibold text-sm">প্রশ্ন করুন</h4>
                  <input required placeholder="আপনার নাম" value={qaForm.name} onChange={e => setQaForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm" />
                  <input placeholder="ফোন (ঐচ্ছিক)" value={qaForm.phone} onChange={e => setQaForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border rounded-xl px-3 py-2 text-sm" />
                  <textarea required placeholder="আপনার প্রশ্ন" value={qaForm.question} onChange={e => setQaForm(f => ({ ...f, question: e.target.value }))}
                    rows={3} className="w-full border rounded-xl px-3 py-2 text-sm resize-none" />
                  <button type="submit" disabled={qaSubmitting}
                    className="px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-60">
                    {qaSubmitting ? "পাঠানো হচ্ছে..." : "প্রশ্ন পাঠান"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* ── YOU MIGHT ALSO LIKE ── */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-gray-200 pt-14">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">You might also like</h2>
              <Link href={`/store/${slug}/products`}
                className="text-sm font-medium border border-black text-black px-5 py-2 rounded-full hover:bg-black hover:text-white transition-colors">
                View All
              </Link>
            </div>
            <div className="flex gap-5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {relatedProducts.map(p => (
                <DynamicProductCard
                  key={p.id}
                  product={{
                    ...p,
                    description: p.description ?? null,
                    category: p.category ?? null,
                    storeVisible: p.storeVisible ?? true,
                    images: p.images ?? [],
                  }}
                  slug={slug}
                />
              ))}
            </div>
          </section>
        )}

        <RecentlyViewedSection slug={slug} excludeId={product.id} />

        <WhatsAppShareButton
          productName={product.name}
          whatsappNumber={shop.storeSocialWA || shop.phone}
          slug={slug}
          productId={product.id}
        />
      </div>
    </div>
  );
}
