"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Mail, CheckCircle, ShoppingBag, Star } from "lucide-react";
import { DynamicHero } from "@/components/store/DynamicHero";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { useStoreTheme } from "@/components/store/ThemeProvider";

/* ── Types ────────────────────────────────────────────── */
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

/* ── Unsplash stock images per category ───────────────── */
const CAT_STOCK: Record<string, string> = {
  পোশাক:         "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&q=80",
  ড্রেস:          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&q=80",
  ফ্রক:           "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=500&q=80",
  শার্ট:          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80",
  প্যান্ট:        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80",
  জুতা:           "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
  স্যান্ডেল:     "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500&q=80",
  খাবার:          "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80",
  ফুড:            "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&q=80",
  ইলেকট্রনিক্স:  "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&q=80",
  গ্যাজেট:       "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&q=80",
  বিউটি:         "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&q=80",
  কসমেটিক:      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80",
  গহনা:          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&q=80",
  অ্যাক্সেসরিজ: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80",
  ব্যাগ:         "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&q=80",
  শিশু:          "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=500&q=80",
  বাচ্চা:        "https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=500&q=80",
  ঘর:            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&q=80",
  হোম:           "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=500&q=80",
  বই:            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&q=80",
  স্বাস্থ্য:    "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=500&q=80",
  স্পোর্টস:     "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&q=80",
  খেলাধুলা:     "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=500&q=80",
};

/* Fallback stock images (for unknown categories) */
const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&q=80",
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=500&q=80",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&q=80",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80",
  "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=80",
];

function getCatImage(cat: string, index: number, productImg?: string | null): string {
  if (productImg) return productImg;
  for (const [k, v] of Object.entries(CAT_STOCK)) {
    if (cat.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return FALLBACK_IMGS[index % FALLBACK_IMGS.length];
}

/* ── Section header ───────────────────────────────────── */
function SectionHead({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  const { primary } = useStoreTheme();
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        <div className="h-0.5 mt-2 rounded-full" style={{ width: 40, backgroundColor: primary }} />
      </div>
      {href && (
        <Link href={href}
          className="text-xs font-bold uppercase tracking-widest border px-4 py-2 rounded-full hover:opacity-80 transition-opacity"
          style={{ borderColor: primary, color: primary }}>
          সব দেখুন →
        </Link>
      )}
    </div>
  );
}

/* ── Horizontal scroll row with arrows ───────────────── */
function ProductRow({ products, slug }: { products: Product[]; slug: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    rowRef.current?.scrollBy({ left: dir === "right" ? 450 : -450, behavior: "smooth" });
  };
  if (!products.length) return null;
  return (
    <div className="relative group/row">
      <button onClick={() => scroll("left")}
        className="absolute left-0 top-[45%] -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-gray-50">
        <ChevronLeft size={16} className="text-gray-700" />
      </button>
      <div ref={rowRef} className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {products.map(p => <DynamicProductCard key={p.id} product={p} slug={slug} showDiscount={p.storeFeatured} />)}
      </div>
      <button onClick={() => scroll("right")}
        className="absolute right-0 top-[45%] -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-gray-50">
        <ChevronRight size={16} className="text-gray-700" />
      </button>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────── */
export function StoreHomeClient({ shop, products, categories, totalOrders, reviews }: Props) {
  const { primary } = useStoreTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const slug = shop.storeSlug;

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const featured  = useMemo(() => products.filter(p => p.storeFeatured), [products]);
  const newArr    = useMemo(() => [...products].slice(0, 20), [products]);
  const trending  = useMemo(() => products.filter(p => !p.storeFeatured).slice(0, 20), [products]);
  const hotSale   = useMemo(() => products.filter(p => p.storeFeatured).slice(0, 20), [products]);

  const RowSkeleton = () => (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 animate-pulse rounded-lg bg-gray-100" style={{ width: 200, height: 320 }} />
      ))}
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      <DynamicHero shop={shop} productCount={products.length} totalOrders={totalOrders} />

      <div className="max-w-7xl mx-auto px-4">

        {/* ── CATEGORIES ── */}
        {categories.length > 0 && (
          <section className="py-12">
            <SectionHead title="ক্যাটাগরি" subtitle="আপনার পছন্দের বিভাগ বেছে নিন" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* All Products tile */}
              <Link href={`/store/${slug}/products`}
                className="group relative overflow-hidden rounded-2xl cursor-pointer block"
                style={{ aspectRatio: "1/1.2" }}>
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80"
                  alt="সব পণ্য"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 text-center px-2">
                  <p className="text-white font-black text-sm drop-shadow-lg">সব পণ্য</p>
                  <p className="text-white/70 text-[10px] mt-0.5">{products.length}+ আইটেম</p>
                </div>
              </Link>

              {categories.slice(0, 11).map((cat, i) => {
                const catProds = products.filter(p => p.category === cat);
                const img = getCatImage(cat, i, catProds.find(p => p.imageUrl)?.imageUrl);
                return (
                  <Link key={cat} href={`/store/${slug}/products`}
                    className="group relative overflow-hidden rounded-2xl cursor-pointer block"
                    style={{ aspectRatio: "1/1.2" }}>
                    <img
                      src={img}
                      alt={cat}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 text-center px-2">
                      <p className="text-white font-black text-xs drop-shadow-lg leading-tight">{cat}</p>
                      <p className="text-white/60 text-[10px] mt-0.5">{catProds.length} পণ্য</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── NEW ARRIVALS ── */}
        {newArr.length > 0 && (
          <section className="py-8 border-t border-gray-100">
            <SectionHead title="নতুন পণ্য" subtitle="সর্বশেষ যোগ হওয়া পণ্যসমূহ" href={`/store/${slug}/products`} />
            {mounted ? <ProductRow products={newArr} slug={slug} /> : <RowSkeleton />}
          </section>
        )}

        {/* ── Promo Banner ── */}
        {!categories.length && products.length > 0 && (
          <div />
        )}
        <section className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Banner 1 */}
            <div className="relative overflow-hidden rounded-2xl" style={{ height: 200 }}>
              <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80"
                alt="promo" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20 flex flex-col justify-center px-8">
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">বিশেষ অফার</p>
                <h3 className="text-xl font-black text-white mb-3">আজই অর্ডার করুন</h3>
                <Link href={`/store/${slug}/products`}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white border border-white/50 px-4 py-2 rounded-full hover:bg-white/10 transition-colors w-fit">
                  Shop Now <ChevronRight size={12} />
                </Link>
              </div>
            </div>
            {/* Banner 2 */}
            <div className="relative overflow-hidden rounded-2xl" style={{ height: 200 }}>
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
                alt="promo2" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20 flex flex-col justify-center px-8">
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">নতুন কালেকশন</p>
                <h3 className="text-xl font-black text-white mb-3">সেরা পণ্য এখানে</h3>
                <Link href={`/store/${slug}/products`}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-white border border-white/50 px-4 py-2 rounded-full hover:bg-white/10 transition-colors w-fit">
                  দেখুন <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOT SALE ── */}
        {hotSale.length > 0 && (
          <section className="py-8 border-t border-gray-100">
            <SectionHead title="🔥 হট সেল" subtitle="সবচেয়ে বেশি বিক্রি হওয়া পণ্যগুলো" href={`/store/${slug}/products`} />
            {mounted ? <ProductRow products={hotSale} slug={slug} /> : <RowSkeleton />}
          </section>
        )}

        {/* ── TRENDING ── */}
        {trending.length > 0 && (
          <section className="py-8 border-t border-gray-100">
            <SectionHead title="📈 ট্রেন্ডিং পণ্য" subtitle="এই মুহূর্তে সবাই যা কিনছে" href={`/store/${slug}/products`} />
            {mounted ? <ProductRow products={trending} slug={slug} /> : <RowSkeleton />}
          </section>
        )}

        {/* ── FEATURED ── */}
        {featured.length > 0 && (
          <section className="py-8 border-t border-gray-100">
            <SectionHead title="⭐ জনপ্রিয় পণ্য" subtitle="ক্রেতাদের সবচেয়ে পছন্দের" href={`/store/${slug}/products`} />
            {mounted ? <ProductRow products={featured} slug={slug} /> : <RowSkeleton />}
          </section>
        )}

      </div>

      {/* ── Customer Reviews ── */}
      {reviews.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-100 mt-6">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <SectionHead title="💬 কাস্টমার রিভিউ" subtitle="আমাদের সন্তুষ্ট ক্রেতারা কী বলছেন" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.slice(0, 6).map(r => (
                <div key={r.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={14}
                        fill={i <= r.rating ? "#F59E0B" : "none"}
                        stroke={i <= r.rating ? "#F59E0B" : "#E5E7EB"} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic mb-4 line-clamp-3">
                    "{r.comment || "দারুণ পণ্য! খুবই সন্তুষ্ট।"}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                      style={{ backgroundColor: primary }}>
                      {r.reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{r.reviewerName}</p>
                      <p className="text-[11px] text-gray-400">✅ ভেরিফাইড ক্রেতা</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── About ── */}
      {shop.storeAbout && (
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: primary }}>আমাদের সম্পর্কে</p>
                <h2 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{shop.name}</h2>
                <p className="text-gray-600 leading-relaxed mb-7">{shop.storeAbout}</p>
                <Link href={`/store/${slug}/products`}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-bold text-sm shadow-lg hover:shadow-xl transition-shadow"
                  style={{ backgroundColor: primary }}>
                  <ShoppingBag size={15} /> পণ্য দেখুন
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { v: `${products.length}+`, l: "মোট পণ্য", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&q=80" },
                  { v: `${totalOrders}+`, l: "সফল অর্ডার", img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&q=80" },
                  { v: "5.0 ⭐", l: "গড় রেটিং", img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&q=80" },
                  { v: "24/7", l: "কাস্টমার সাপোর্ট", img: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=300&q=80" },
                ].map(({ v, l, img }) => (
                  <div key={l} className="relative overflow-hidden rounded-2xl" style={{ height: 130 }}>
                    <img src={img} alt={l} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center text-center px-2">
                      <p className="text-2xl font-black text-white">{v}</p>
                      <p className="text-[11px] text-white/70 mt-1">{l}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Newsletter ── */}
      <section className="relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80"
          alt="newsletter" className="absolute inset-0 w-full h-full object-cover object-top" />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-5">
            <Mail size={24} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">অফার মিস করবেন না</h2>
          <p className="text-white/60 text-sm mb-7">নতুন পণ্য ও বিশেষ অফারের আপডেট পেতে আপনার নম্বর দিন</p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-white font-bold">
              <CheckCircle size={20} className="text-green-400" /> ধন্যবাদ! শীঘ্রই যোগাযোগ করব।
            </div>
          ) : (
            <div className="flex gap-2 max-w-sm mx-auto">
              <input type="text" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="আপনার ফোন নম্বর..."
                className="flex-1 px-5 py-3.5 rounded-full text-sm outline-none text-gray-800 bg-white shadow-lg" />
              <button onClick={() => { if (email.trim()) setSubscribed(true); }}
                className="px-6 py-3.5 rounded-full text-sm font-black text-white shadow-lg hover:opacity-90 transition-opacity flex-shrink-0"
                style={{ backgroundColor: primary }}>
                সাবস্ক্রাইব
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
