"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ShoppingBag, ArrowRight, ChevronDown, ChevronUp,
  Clock, Mail, CheckCircle, ChevronLeft, ChevronRight, Star, Flame, Zap
} from "lucide-react";
import { DynamicHero } from "@/components/store/DynamicHero";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { useStoreTheme } from "@/components/store/ThemeProvider";

function ProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white animate-pulse shadow-sm">
      <div className="bg-gray-100" style={{ paddingBottom: "100%" }} />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-gray-100 rounded-full w-12" />
        <div className="h-4 bg-gray-100 rounded-full w-4/5" />
        <div className="h-3 bg-gray-100 rounded-full w-2/5" />
        <div className="flex justify-between mt-2">
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-5 bg-gray-100 rounded-full w-10" />
        </div>
      </div>
    </div>
  );
}

interface Product {
  id: string; name: string; description: string | null; category: string | null;
  sellPrice: number; stockQty: number; imageUrl: string | null; images: unknown;
  hasVariants: boolean; storeVisible: boolean; storeFeatured: boolean;
}
interface Review { id: string; reviewerName: string; rating: number; comment: string | null; createdAt: string; }
interface Shop {
  id: string; name: string; logoUrl: string | null; phone: string | null; storeSlug: string;
  storeBannerUrl: string | null; storeTagline: string | null; storeAbout: string | null;
  storePrimaryColor: string | null; storeAccentColor: string | null; storeTheme: string;
  storeFreeShipping: boolean | null; storeCODEnabled: boolean | null;
  storeBkashNumber: string | null; storeNagadNumber: string | null;
}
interface Props { shop: Shop; products: Product[]; categories: string[]; totalOrders: number; reviews: Review[]; }

const SORT_OPTIONS = [
  { value: "newest", label: "নতুন আগে" },
  { value: "price_asc", label: "কম দাম" },
  { value: "price_desc", label: "বেশি দাম" },
  { value: "featured", label: "জনপ্রিয়" },
];

const CAT_COLORS = [
  ["#EFF6FF", "#3B82F6"], ["#FFF7ED", "#F97316"], ["#F0FDF4", "#22C55E"],
  ["#FDF4FF", "#A855F7"], ["#FFF1F2", "#F43F5E"], ["#F0F9FF", "#0EA5E9"],
  ["#FEFCE8", "#EAB308"], ["#FDF2F8", "#EC4899"],
];

const CATEGORY_EMOJIS: Record<string, string> = {
  পোশাক: "👗", ড্রেস: "👗", ফ্রক: "👗", জুতা: "👟", স্যান্ডেল: "👡",
  খাবার: "🍱", ফুড: "🍱", ইলেকট্রনিক্স: "📱", গ্যাজেট: "💻",
  বিউটি: "💄", কসমেটিক: "💄", গহনা: "💍", অ্যাক্সেসরিজ: "👜",
  শিশু: "🧸", বাচ্চা: "🧸", ঘর: "🏠", হোম: "🏠", বই: "📚", স্বাস্থ্য: "💊",
};

function getCatEmoji(cat: string) {
  for (const [k, v] of Object.entries(CATEGORY_EMOJIS)) {
    if (cat.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return "🏷️";
}

function useCountdown(hours = 8) {
  const endRef = useRef(Date.now() + hours * 3600000);
  const [t, setT] = useState({ h: hours, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, endRef.current - Date.now());
      setT({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function TimeBox({ val, label }: { val: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[48px] text-center shadow-inner">
        <span className="text-xl font-black text-white tabular-nums">{String(val).padStart(2, "0")}</span>
      </div>
      <span className="text-[9px] text-white/70 uppercase font-bold mt-1">{label}</span>
    </div>
  );
}

function SectionHeader({ title, subtitle, href, primary }: { title: string; subtitle?: string; href?: string; primary: string }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: primary }}>
          সব দেখুন <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

export function StoreHomeClient({ shop, products, categories, totalOrders, reviews }: Props) {
  const { primary } = useStoreTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");
  const [showAll, setShowAll] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const slug = shop.storeSlug;
  const t = useCountdown(8);

  useEffect(() => { const id = setTimeout(() => setMounted(true), 80); return () => clearTimeout(id); }, []);

  // Auto-advance testimonials
  useEffect(() => {
    if (reviews.length <= 1) return;
    const id = setInterval(() => setReviewIdx(i => (i + 1) % reviews.length), 4000);
    return () => clearInterval(id);
  }, [reviews.length]);

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

  return (
    <div style={{ backgroundColor: "#F8F9FC" }} className="min-h-screen">
      <DynamicHero shop={shop} productCount={products.length} totalOrders={totalOrders} />

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <SectionHeader title="🏷️ ক্যাটাগরি" subtitle="পছন্দের ক্যাটাগরি বেছে নিন" primary={primary} />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {/* All */}
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all"
              style={!selectedCategory
                ? { backgroundColor: primary + "15", borderColor: primary, color: primary }
                : { backgroundColor: "#fff", borderColor: "#E5E7EB", color: "#6B7280" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                style={{ backgroundColor: !selectedCategory ? primary : "#F3F4F6" }}>
                <span style={{ filter: !selectedCategory ? "brightness(10)" : "none" }}>🛍️</span>
              </div>
              <span className="text-[11px] font-bold leading-tight text-center">সব পণ্য</span>
            </button>
            {categories.map((cat, i) => {
              const [bg, fg] = CAT_COLORS[i % CAT_COLORS.length];
              const isActive = selectedCategory === cat;
              return (
                <button key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all hover:shadow-md"
                  style={isActive
                    ? { backgroundColor: primary + "15", borderColor: primary, color: primary }
                    : { backgroundColor: "#fff", borderColor: "#E5E7EB", color: "#374151" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                    style={{ backgroundColor: isActive ? primary + "20" : bg }}>
                    {getCatEmoji(cat)}
                  </div>
                  <span className="text-[11px] font-bold leading-tight text-center line-clamp-2">{cat}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Flash Sale ── */}
      {featured.length > 0 && !selectedCategory && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div className="rounded-3xl overflow-hidden shadow-xl" style={{
            background: `linear-gradient(135deg, #1a1a2e 0%, ${primary} 60%, ${primary}cc 100%)`
          }}>
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Flame size={20} className="text-orange-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-black text-xl">Flash Sale</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse">LIVE</span>
                  </div>
                  <p className="text-white/60 text-xs">সীমিত সময়ের অফার — মিস করবেন না!</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-white/60 text-xs">
                  <Clock size={12} /> শেষ হচ্ছে
                </div>
                <div className="flex items-center gap-2">
                  <TimeBox val={t.h} label="ঘন্টা" />
                  <span className="text-white font-black text-xl mb-4">:</span>
                  <TimeBox val={t.m} label="মিনিট" />
                  <span className="text-white font-black text-xl mb-4">:</span>
                  <TimeBox val={t.s} label="সেকেন্ড" />
                </div>
              </div>
            </div>
            {/* Products */}
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {featured.slice(0, 4).map(p => (
                  <div key={p.id} className="relative">
                    <span className="absolute top-2 left-2 z-10 text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                      <Zap size={8} fill="white" /> HOT
                    </span>
                    <DynamicProductCard product={p} slug={slug} showDiscount />
                  </div>
                ))}
              </div>
              {featured.length > 4 && (
                <div className="text-center mt-4">
                  <Link href={`/store/${slug}/products`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white font-bold text-sm shadow-md hover:shadow-lg transition-shadow"
                    style={{ color: primary }}>
                    আরো Flash Sale পণ্য <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Dual Promo Banners ── */}
      {!selectedCategory && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Banner 1 */}
            <div className="relative rounded-2xl overflow-hidden p-7 flex flex-col justify-between min-h-[160px]"
              style={{ background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)` }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
                style={{ background: primary }} />
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full mb-3 inline-block"
                  style={{ backgroundColor: primary + "30", color: primary }}>🔥 বিশেষ অফার</span>
                <h3 className="text-white font-black text-xl leading-tight mt-2">দ্রুত ডেলিভারি<br />সারাদেশে</h3>
                <p className="text-gray-400 text-xs mt-1.5">অর্ডার করুন, ঘরে পান</p>
              </div>
              <Link href={`/store/${slug}/products`}
                className="inline-flex items-center gap-1.5 text-sm font-bold mt-4 transition-opacity hover:opacity-80"
                style={{ color: primary }}>
                অর্ডার করুন <ArrowRight size={14} />
              </Link>
            </div>
            {/* Banner 2 */}
            <div className="relative rounded-2xl overflow-hidden p-7 flex flex-col justify-between min-h-[160px]"
              style={{ background: `linear-gradient(135deg, ${primary}22 0%, ${primary}08 100%)`, border: `1.5px solid ${primary}25` }}>
              <div className="absolute bottom-0 right-4 text-8xl opacity-10">🛍️</div>
              <div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full mb-3 inline-block bg-white"
                  style={{ color: primary }}>✨ নতুন কালেকশন</span>
                <h3 className="font-black text-xl leading-tight mt-2" style={{ color: "#1a1a1a" }}>
                  সেরা মানের পণ্য<br />সেরা দামে
                </h3>
                <p className="text-gray-500 text-xs mt-1.5">১০০% অরিজিনাল গ্যারান্টি</p>
              </div>
              <Link href={`/store/${slug}/products`}
                className="inline-flex items-center gap-1.5 text-sm font-bold mt-4 transition-opacity hover:opacity-80"
                style={{ color: primary }}>
                কেনাকাটা শুরু করুন <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured/Popular ── */}
      {featured.length > 0 && !selectedCategory && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <SectionHeader title="⭐ জনপ্রিয় পণ্য" subtitle="ক্রেতাদের সবচেয়ে পছন্দের পণ্যগুলো" href={`/store/${slug}/products`} primary={primary} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {featured.slice(0, 10).map(p => <DynamicProductCard key={p.id} product={p} slug={slug} />)}
          </div>
        </section>
      )}

      {/* ── New Arrivals ── */}
      {newArrivals.length > 0 && !selectedCategory && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <SectionHeader title="🆕 নতুন পণ্য" subtitle="সর্বশেষ যোগ হওয়া পণ্যসমূহ" href={`/store/${slug}/products`} primary={primary} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {newArrivals.slice(0, 10).map(p => <DynamicProductCard key={p.id} product={p} slug={slug} />)}
          </div>
        </section>
      )}

      {/* ── All Products ── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900">
              {selectedCategory ? selectedCategory : "🛒 সব পণ্য"}
              <span className="ml-2 text-sm font-normal text-gray-400">({filtered.length}টি)</span>
            </h2>
            {!selectedCategory && <p className="text-sm text-gray-500 mt-0.5">আমাদের সম্পূর্ণ কালেকশন</p>}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none bg-white text-gray-700 cursor-pointer font-medium shadow-sm">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {!mounted ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <ShoppingBag size={56} className="mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-semibold text-lg">কোনো পণ্য পাওয়া যায়নি</p>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)}
                className="mt-4 text-sm font-bold underline" style={{ color: primary }}>
                সব পণ্য দেখুন
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {visible.map(p => <DynamicProductCard key={p.id} product={p} slug={slug} />)}
            </div>
            {filtered.length > 12 && (
              <div className="text-center mt-10">
                <button onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 px-10 py-3.5 rounded-full border-2 font-bold text-sm transition-all hover:shadow-md"
                  style={{ borderColor: primary, color: primary }}>
                  {showAll
                    ? <><ChevronUp size={16} /> কম দেখুন</>
                    : <><ChevronDown size={16} /> আরো {filtered.length - 12} টি পণ্য দেখুন</>}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Testimonials ── */}
      {reviews.length > 0 && (
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center mb-10">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: primary }}>⭐ রিভিউ</p>
              <h2 className="text-2xl font-black text-gray-900">আমাদের ক্রেতারা কী বলছেন</h2>
              <p className="text-gray-500 text-sm mt-1.5">হাজারো সন্তুষ্ট ক্রেতার মধ্যে কিছু মতামত</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-md flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="mt-4">
                  <div className="flex justify-center gap-0.5 mb-5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={18}
                        fill={i <= reviews[reviewIdx].rating ? "#F59E0B" : "none"}
                        stroke={i <= reviews[reviewIdx].rating ? "#F59E0B" : "#E5E7EB"}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 text-base leading-relaxed italic mb-6">
                    "{reviews[reviewIdx].comment || "দারুণ পণ্য! খুবই সন্তুষ্ট।"}"
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md"
                      style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }}>
                      {reviews[reviewIdx].reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-black text-gray-900 text-sm">{reviews[reviewIdx].reviewerName}</p>
                      <p className="text-[11px] text-gray-400">✅ ভেরিফাইড ক্রেতা</p>
                    </div>
                  </div>
                </div>
              </div>
              {reviews.length > 1 && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={() => setReviewIdx(i => (i - 1 + reviews.length) % reviews.length)}
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    style={{ borderColor: primary }}>
                    <ChevronLeft size={16} style={{ color: primary }} />
                  </button>
                  <div className="flex gap-2">
                    {reviews.map((_, i) => (
                      <button key={i} onClick={() => setReviewIdx(i)}
                        className="rounded-full transition-all duration-300"
                        style={{ width: i === reviewIdx ? 24 : 8, height: 8, backgroundColor: i === reviewIdx ? primary : "#E5E7EB" }} />
                    ))}
                  </div>
                  <button onClick={() => setReviewIdx(i => (i + 1) % reviews.length)}
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    style={{ borderColor: primary }}>
                    <ChevronRight size={16} style={{ color: primary }} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── About ── */}
      {shop.storeAbout && (
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: primary }}>আমাদের সম্পর্কে</p>
                <h2 className="text-3xl font-black text-gray-900 mb-4">{shop.name}</h2>
                <p className="text-gray-600 leading-relaxed mb-7 text-base">{shop.storeAbout}</p>
                <Link href={`/store/${slug}/products`}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-black text-sm shadow-lg hover:shadow-xl transition-shadow"
                  style={{ backgroundColor: primary }}>
                  <ShoppingBag size={15} /> পণ্য দেখুন
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: `${products.length}+`, label: "মোট পণ্য", icon: "📦", bg: "#EFF6FF", color: "#3B82F6" },
                  { value: `${totalOrders}+`, label: "সফল অর্ডার", icon: "✅", bg: "#F0FDF4", color: "#22C55E" },
                  { value: "5.0 ⭐", label: "গড় রেটিং", icon: "⭐", bg: "#FEFCE8", color: "#EAB308" },
                  { value: "24/7", label: "কাস্টমার সাপোর্ট", icon: "🤝", bg: "#FDF4FF", color: "#A855F7" },
                ].map(({ value, label, icon, bg, color }) => (
                  <div key={label} className="rounded-2xl p-5 text-center shadow-sm border border-gray-50" style={{ backgroundColor: bg }}>
                    <p className="text-3xl mb-2">{icon}</p>
                    <p className="text-2xl font-black" style={{ color }}>{value}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter ── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, #0f172a 0%, ${primary} 100%)` }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 border border-white/20">
            <Mail size={26} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">আপডেট পেতে সাবস্ক্রাইব করুন</h2>
          <p className="text-white/60 text-sm mb-8">নতুন পণ্য, অফার ও Flash Sale এর আপডেট পেতে আপনার নম্বর দিন</p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2.5 text-white font-bold text-lg">
              <CheckCircle size={24} className="text-green-400" />
              ধন্যবাদ! আমরা শীঘ্রই যোগাযোগ করব।
            </div>
          ) : (
            <div className="flex gap-2 max-w-sm mx-auto">
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="আপনার ফোন নম্বর..."
                className="flex-1 px-4 py-3.5 rounded-xl text-sm outline-none text-gray-800 bg-white shadow-lg font-medium"
              />
              <button
                onClick={() => { if (email.trim()) setSubscribed(true); }}
                className="px-5 py-3.5 rounded-xl font-black text-sm text-white border border-white/30 bg-white/15 backdrop-blur-sm hover:bg-white/25 transition-colors whitespace-nowrap"
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
