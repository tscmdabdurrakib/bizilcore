"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag, ArrowRight, ChevronDown, ChevronUp,
  Clock, Tag, Star, CheckCircle, Mail, ChevronLeft, ChevronRight
} from "lucide-react";
import { DynamicHero } from "@/components/store/DynamicHero";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { useStoreTheme } from "@/components/store/ThemeProvider";

function ProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-3 bg-gray-100 rounded-full w-16" />
        <div className="h-4 bg-gray-100 rounded-full w-4/5" />
        <div className="h-3 bg-gray-100 rounded-full w-3/5" />
        <div className="flex justify-between mt-1">
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-5 bg-gray-100 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sellPrice: number;
  stockQty: number;
  imageUrl: string | null;
  images: unknown;
  hasVariants: boolean;
  storeVisible: boolean;
  storeFeatured: boolean;
}

interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface Shop {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  storeSlug: string;
  storeBannerUrl: string | null;
  storeTagline: string | null;
  storeAbout: string | null;
  storePrimaryColor: string | null;
  storeAccentColor: string | null;
  storeTheme: string;
  storeFreeShipping: boolean | null;
  storeCODEnabled: boolean | null;
  storeBkashNumber: string | null;
  storeNagadNumber: string | null;
}

interface Props {
  shop: Shop;
  products: Product[];
  categories: string[];
  totalOrders: number;
  reviews: Review[];
}

const SORT_OPTIONS = [
  { value: "newest", label: "নতুন আগে" },
  { value: "price_asc", label: "কম দাম" },
  { value: "price_desc", label: "বেশি দাম" },
  { value: "featured", label: "জনপ্রিয়" },
];

const CATEGORY_ICONS: Record<string, string> = {
  পোশাক: "👗", ড্রেস: "👗", ফ্রক: "👗",
  জুতা: "👟", স্যান্ডেল: "👡",
  খাবার: "🍱", ফুড: "🍱",
  ইলেকট্রনিক্স: "📱", গ্যাজেট: "💻",
  বিউটি: "💄", কসমেটিক: "💄",
  গহনা: "💍", অ্যাক্সেসরিজ: "👜",
  শিশু: "🧸", বাচ্চা: "🧸",
  ঘর: "🏠", হোম: "🏠",
  বই: "📚",
  স্বাস্থ্য: "💊",
};

function getCategoryIcon(cat: string): string {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "🏷️";
}

function useCountdown(targetHours: number = 8) {
  const [time, setTime] = useState({ h: targetHours, m: 0, s: 0 });
  useEffect(() => {
    const end = Date.now() + targetHours * 3600 * 1000;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[52px]">
      <span className="text-xl font-black text-white tabular-nums">{String(value).padStart(2, "0")}</span>
      <span className="text-[9px] text-white/80 uppercase font-semibold">{label}</span>
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} fill={i <= rating ? "#F59E0B" : "none"} stroke={i <= rating ? "#F59E0B" : "#D1D5DB"} />
      ))}
    </span>
  );
}

export function StoreHomeClient({ shop, products, categories, totalOrders, reviews }: Props) {
  const { primary, accent } = useStoreTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");
  const [showAll, setShowAll] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const slug = shop.storeSlug;
  const countdown = useCountdown(8);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const featured = products.filter(p => p.storeFeatured);
  const newArrivals = products.slice(0, 8);

  const filtered = useMemo(() => {
    let list = [...products];
    if (selectedCategory) list = list.filter(p => p.category === selectedCategory);
    if (sort === "price_asc") list.sort((a, b) => a.sellPrice - b.sellPrice);
    else if (sort === "price_desc") list.sort((a, b) => b.sellPrice - a.sellPrice);
    else if (sort === "featured") list.sort((a, b) => (b.storeFeatured ? 1 : 0) - (a.storeFeatured ? 1 : 0));
    return list;
  }, [products, selectedCategory, sort]);

  const visible = showAll ? filtered : filtered.slice(0, 12);

  const prevReview = useCallback(() => {
    setReviewIdx(i => (i - 1 + reviews.length) % reviews.length);
  }, [reviews.length]);

  const nextReview = useCallback(() => {
    setReviewIdx(i => (i + 1) % reviews.length);
  }, [reviews.length]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <DynamicHero shop={shop} productCount={products.length} totalOrders={totalOrders} />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">ক্যাটাগরি</h2>
              <p className="text-sm text-gray-500 mt-0.5">আপনার পছন্দের ক্যাটাগরি বেছে নিন</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-medium text-sm"
              style={!selectedCategory ? {
                backgroundColor: primary + "12", borderColor: primary, color: primary,
              } : { backgroundColor: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }}
            >
              <span className="text-2xl">🛍️</span>
              <span className="text-xs">সব পণ্য</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-medium text-sm"
                style={selectedCategory === cat ? {
                  backgroundColor: primary + "12", borderColor: primary, color: primary,
                } : { backgroundColor: "#fff", borderColor: "#e5e7eb", color: "#6b7280" }}
              >
                <span className="text-2xl">{getCategoryIcon(cat)}</span>
                <span className="text-xs leading-tight text-center">{cat}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Flash Sale Section */}
      {featured.length > 0 && !selectedCategory && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)` }}>
            <div className="px-5 pt-5 pb-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2">
                  <Tag size={20} color="white" />
                </div>
                <div>
                  <p className="text-white font-black text-lg leading-tight">⚡ ফ্ল্যাশ সেল</p>
                  <p className="text-white/70 text-xs">সীমিত সময়ের অফার</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-white/70" />
                <span className="text-white/70 text-xs mr-2">শেষ হচ্ছে</span>
                <CountdownBox value={countdown.h} label="ঘন্টা" />
                <span className="text-white font-bold text-lg">:</span>
                <CountdownBox value={countdown.m} label="মিনিট" />
                <span className="text-white font-bold text-lg">:</span>
                <CountdownBox value={countdown.s} label="সেকেন্ড" />
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {featured.slice(0, 4).map(p => (
                  <div key={p.id} className="relative">
                    <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">HOT</div>
                    <DynamicProductCard product={p} slug={slug} />
                  </div>
                ))}
              </div>
              {featured.length > 4 && (
                <div className="text-center mt-4">
                  <Link href={`/store/${slug}/products`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white font-bold text-sm"
                    style={{ color: primary }}>
                    আরো দেখুন <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Promotional Mid-Page Banner */}
      {!selectedCategory && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div
            className="rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
            style={{ backgroundColor: "#111827" }}
          >
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }} />
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>🔥 বিশেষ অফার</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">আজই অর্ডার করুন</h2>
              <p className="text-gray-400 text-sm max-w-md">
                দেশের যেকোনো প্রান্তে দ্রুত ও নিরাপদ ডেলিভারি। ক্যাশ অন ডেলিভারিতে পেমেন্ট করুন।
              </p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <CheckCircle size={13} className="text-green-500" /> ক্যাশ অন ডেলিভারি
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <CheckCircle size={13} className="text-green-500" /> সারাদেশ ডেলিভারি
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <CheckCircle size={13} className="text-green-500" /> ১০০% অরিজিনাল
                </div>
              </div>
            </div>
            <div className="relative z-10 flex-shrink-0">
              <Link
                href={`/store/${slug}/products`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-black text-sm transition-all hover:scale-105"
                style={{ backgroundColor: primary, color: "white" }}
              >
                <ShoppingBag size={16} />
                এখনই কেনাকাটা করুন
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured/Trending */}
      {featured.length > 0 && !selectedCategory && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">⭐ জনপ্রিয় পণ্য</h2>
              <p className="text-sm text-gray-500 mt-0.5">ক্রেতাদের সবচেয়ে পছন্দের পণ্যগুলো</p>
            </div>
            <Link href={`/store/${slug}/products`}
              className="flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: primary }}>
              সব দেখুন <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featured.slice(0, 8).map(p => (
              <DynamicProductCard key={p.id} product={p} slug={slug} />
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && !selectedCategory && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">🆕 নতুন পণ্য</h2>
              <p className="text-sm text-gray-500 mt-0.5">সর্বশেষ যোগ হওয়া পণ্যসমূহ</p>
            </div>
            <Link href={`/store/${slug}/products`}
              className="flex items-center gap-1 text-sm font-semibold hover:opacity-80"
              style={{ color: primary }}>
              সব দেখুন <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {newArrivals.map(p => (
              <DynamicProductCard key={p.id} product={p} slug={slug} />
            ))}
          </div>
        </section>
      )}

      {/* All Products section */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory ? selectedCategory : "🛒 সব পণ্য"}
              <span className="ml-2 text-base font-normal text-gray-400">({filtered.length})</span>
            </h2>
            {!selectedCategory && (
              <p className="text-sm text-gray-500 mt-0.5">আমাদের সম্পূর্ণ কালেকশন</p>
            )}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none bg-white text-gray-700 cursor-pointer">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {!mounted ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <ShoppingBag size={52} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">কোনো পণ্য পাওয়া যায়নি</p>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)} className="mt-3 text-sm font-semibold underline" style={{ color: primary }}>
                সব পণ্য দেখুন
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visible.map(p => <DynamicProductCard key={p.id} product={p} slug={slug} />)}
            </div>
            {filtered.length > 12 && (
              <div className="text-center mt-10">
                <button onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 font-bold text-sm transition-all hover:bg-gray-50"
                  style={{ borderColor: primary, color: primary }}>
                  {showAll
                    ? <><ChevronUp size={16} /> কম দেখুন</>
                    : <><ChevronDown size={16} /> আরো দেখুন ({filtered.length - 12}+ পণ্য)</>}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Customer Testimonials */}
      {reviews.length > 0 && (
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <div className="text-center mb-10">
              <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>কাস্টমার রিভিউ</p>
              <h2 className="text-2xl font-black text-gray-900">আমাদের ক্রেতারা কী বলছেন</h2>
            </div>
            <div className="max-w-2xl mx-auto relative">
              <div className="bg-gray-50 rounded-2xl p-8 text-center relative">
                <div className="text-5xl mb-4">"</div>
                <p className="text-gray-700 text-base leading-relaxed mb-6 italic">
                  {reviews[reviewIdx].comment || "দারুণ পণ্য! খুবই সন্তুষ্ট।"}
                </p>
                <StarRow rating={reviews[reviewIdx].rating} />
                <div className="mt-4">
                  <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: primary }}>
                    {reviews[reviewIdx].reviewerName.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{reviews[reviewIdx].reviewerName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">ভেরিফাইড ক্রেতা</p>
                </div>
              </div>
              {reviews.length > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={prevReview}
                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all hover:bg-gray-50"
                    style={{ borderColor: primary }}>
                    <ChevronLeft size={16} style={{ color: primary }} />
                  </button>
                  <div className="flex gap-1.5">
                    {reviews.map((_, i) => (
                      <button key={i} onClick={() => setReviewIdx(i)}
                        className="rounded-full transition-all"
                        style={{
                          width: i === reviewIdx ? 20 : 8, height: 8,
                          backgroundColor: i === reviewIdx ? primary : "#D1D5DB",
                        }} />
                    ))}
                  </div>
                  <button onClick={nextReview}
                    className="w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all hover:bg-gray-50"
                    style={{ borderColor: primary }}>
                    <ChevronRight size={16} style={{ color: primary }} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {shop.storeAbout && (
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: primary }}>
                  আমাদের সম্পর্কে
                </p>
                <h2 className="text-3xl font-black text-gray-900 mb-4">{shop.name}</h2>
                <p className="text-gray-600 leading-relaxed mb-6">{shop.storeAbout}</p>
                <Link href={`/store/${slug}/products`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primary }}>
                  <ShoppingBag size={15} /> আমাদের পণ্য দেখুন
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: `${products.length}+`, label: "মোট পণ্য", icon: "📦" },
                  { value: `${totalOrders}+`, label: "সফল অর্ডার", icon: "✅" },
                  { value: "5.0⭐", label: "গড় রেটিং", icon: "⭐" },
                  { value: "24/7", label: "কাস্টমার সাপোর্ট", icon: "🤝" },
                ].map(({ value, label, icon }) => (
                  <div key={label} className="rounded-2xl p-5 text-center" style={{ backgroundColor: primary + "08", border: `1px solid ${primary}20` }}>
                    <p className="text-2xl mb-1">{icon}</p>
                    <p className="text-2xl font-black" style={{ color: primary }}>{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)` }}>
        <div className="max-w-2xl mx-auto px-4 py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-5">
            <Mail size={24} color="white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">নিউজলেটারে সাবস্ক্রাইব করুন</h2>
          <p className="text-white/70 text-sm mb-6">নতুন পণ্য ও অফারের আপডেট পেতে WhatsApp বা ফোন নম্বর দিন</p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-white font-bold">
              <CheckCircle size={20} />
              ধন্যবাদ! আমরা আপনার সাথে যোগাযোগ করব।
            </div>
          ) : (
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="আপনার ফোন নম্বর দিন..."
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none text-gray-800"
              />
              <button
                onClick={() => { if (email.trim()) setSubscribed(true); }}
                className="px-5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white", border: "2px solid rgba(255,255,255,0.4)" }}
              >
                সাবস্ক্রাইব
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
