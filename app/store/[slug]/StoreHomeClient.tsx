"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Mail, CheckCircle, ShoppingBag } from "lucide-react";
import { DynamicHero } from "@/components/store/DynamicHero";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { useStoreTheme } from "@/components/store/ThemeProvider";

/* ─── Types ─────────────────────────────────────── */
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

/* ─── Category colors / gradients ──────────────── */
const CAT_GRAD = [
  "linear-gradient(135deg,#667eea,#764ba2)",
  "linear-gradient(135deg,#f093fb,#f5576c)",
  "linear-gradient(135deg,#4facfe,#00f2fe)",
  "linear-gradient(135deg,#43e97b,#38f9d7)",
  "linear-gradient(135deg,#fa709a,#fee140)",
  "linear-gradient(135deg,#a18cd1,#fbc2eb)",
  "linear-gradient(135deg,#fccb90,#d57eeb)",
  "linear-gradient(135deg,#a1c4fd,#c2e9fb)",
  "linear-gradient(135deg,#fd7043,#ff8a65)",
  "linear-gradient(135deg,#26c6da,#00bcd4)",
];
const CAT_EMO: Record<string,string> = {
  পোশাক:"👗",ড্রেস:"👗",ফ্রক:"👗",জুতা:"👟",স্যান্ডেল:"👡",খাবার:"🍱",ফুড:"🍱",
  ইলেকট্রনিক্স:"📱",গ্যাজেট:"💻",বিউটি:"💄",কসমেটিক:"💄",গহনা:"💍",
  অ্যাক্সেসরিজ:"👜",শিশু:"🧸",বাচ্চা:"🧸",ঘর:"🏠",হোম:"🏠",বই:"📚",স্বাস্থ্য:"💊",
};
function catEmoji(c:string){for(const[k,v] of Object.entries(CAT_EMO))if(c.toLowerCase().includes(k.toLowerCase()))return v;return"🏷️";}

/* ─── Section header (payra-style underline) ────── */
function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-base font-black uppercase tracking-widest text-gray-900">{title}</h2>
        <div className="h-0.5 mt-1.5 w-12 bg-gray-900 rounded-full" />
      </div>
      {href && (
        <Link href={href}
          className="text-[11px] font-black uppercase tracking-widest text-white px-4 py-1.5 rounded-sm hover:opacity-80 transition-opacity"
          style={{ backgroundColor: "#111" }}>
          View All
        </Link>
      )}
    </div>
  );
}

/* ─── Horizontal scroll row ─────────────────────── */
function ProductRow({ products, slug }: { products: Product[]; slug: string }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir === "right" ? 440 : -440, behavior: "smooth" });
  };
  if (products.length === 0) return null;
  return (
    <div className="relative">
      {/* Left arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft size={16} className="text-gray-700" />
      </button>
      {/* Scrollable row */}
      <div ref={rowRef} className="flex gap-3 overflow-x-auto pb-3 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {products.map(p => (
          <DynamicProductCard key={p.id} product={p} slug={slug} showDiscount={p.storeFeatured} />
        ))}
      </div>
      {/* Right arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        <ChevronRight size={16} className="text-gray-700" />
      </button>
    </div>
  );
}

/* ─── Main component ─────────────────────────────── */
export function StoreHomeClient({ shop, products, categories, totalOrders, reviews }: Props) {
  const { primary } = useStoreTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const slug = shop.storeSlug;

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const featured   = useMemo(() => products.filter(p => p.storeFeatured), [products]);
  const newArr     = useMemo(() => [...products].sort((a,b) => a.id > b.id ? -1 : 1).slice(0, 20), [products]);
  const trending   = useMemo(() => products.filter(p => !p.storeFeatured).slice(0, 20), [products]);
  const hotSale    = useMemo(() => products.filter(p => p.storeFeatured).slice(0, 20), [products]);

  return (
    <div className="bg-white min-h-screen">
      <DynamicHero shop={shop} productCount={products.length} totalOrders={totalOrders} />

      <div className="max-w-7xl mx-auto px-4">

        {/* ── SHOP BY CATEGORIES ── */}
        {categories.length > 0 && (
          <section className="py-10">
            <SectionHead title="Shop by Categories" />
            {/* Large image-style tile grid */}
            <div className="grid gap-2" style={{
              gridTemplateColumns: `repeat(${Math.min(categories.length + 1, 6)}, 1fr)`,
            }}>
              {/* "All" tile */}
              <Link href={`/store/${slug}/products`}
                className="relative overflow-hidden group cursor-pointer"
                style={{ aspectRatio: "3/4", borderRadius: 2 }}>
                <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-2 group-hover:opacity-90 transition-opacity">
                  <span className="text-4xl">🛍️</span>
                  <span className="text-white font-black text-sm uppercase tracking-wide">সব পণ্য</span>
                  <span className="text-white/50 text-xs">{products.length}+ আইটেম</span>
                </div>
              </Link>
              {categories.slice(0, 11).map((cat, i) => {
                const catProducts = products.filter(p => p.category === cat);
                const img = catProducts.find(p => p.imageUrl)?.imageUrl;
                return (
                  <button key={cat} onClick={() => {}}
                    className="relative overflow-hidden group cursor-pointer text-left"
                    style={{ aspectRatio: "3/4", borderRadius: 2 }}
                    onClick={() => window.location.href = `/store/${slug}/products?cat=${encodeURIComponent(cat)}`}
                  >
                    {img ? (
                      <>
                        <img src={img} alt={cat} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                      </>
                    ) : (
                      <div className="absolute inset-0 transition-opacity group-hover:opacity-90" style={{ background: CAT_GRAD[i % CAT_GRAD.length] }} />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-3 px-2 text-center">
                      <span className="text-2xl mb-1">{catEmoji(cat)}</span>
                      <span className="text-white font-black text-xs uppercase tracking-wide leading-tight">{cat}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── NEW ARRIVAL PRODUCTS ── */}
        {newArr.length > 0 && (
          <section className="py-8 border-t border-gray-100">
            <SectionHead title="New Arrival Products" href={`/store/${slug}/products`} />
            {mounted ? <ProductRow products={newArr} slug={slug} /> : (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 animate-pulse bg-gray-100 rounded" style={{ width: 200, height: 310 }} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── HOT SALE ── */}
        {hotSale.length > 0 && (
          <section className="py-8 border-t border-gray-100">
            <SectionHead title="Hot Sale" href={`/store/${slug}/products`} />
            {mounted ? <ProductRow products={hotSale} slug={slug} /> : (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 animate-pulse bg-gray-100 rounded" style={{ width: 200, height: 310 }} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── TRENDING PRODUCTS ── */}
        {trending.length > 0 && (
          <section className="py-8 border-t border-gray-100">
            <SectionHead title="Trending Products" href={`/store/${slug}/products`} />
            {mounted ? <ProductRow products={trending} slug={slug} /> : (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 animate-pulse bg-gray-100 rounded" style={{ width: 200, height: 310 }} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── FEATURED PRODUCTS ── */}
        {featured.length > 0 && (
          <section className="py-8 border-t border-gray-100">
            <SectionHead title="Featured Products" href={`/store/${slug}/products`} />
            {mounted ? <ProductRow products={featured} slug={slug} /> : (
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 animate-pulse bg-gray-100 rounded" style={{ width: 200, height: 310 }} />
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {/* ── ABOUT / SHOWROOM SECTION ── */}
      {shop.storeAbout && (
        <section className="bg-gray-50 border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: primary }}>Find Our Store</p>
                <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase leading-tight">
                  {shop.name} এ স্বাগতম
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm mb-6">{shop.storeAbout}</p>
                <Link href={`/store/${slug}/products`}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primary }}>
                  <ShoppingBag size={14} /> কেনাকাটা শুরু করুন
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { v: `${products.length}+`, l: "মোট পণ্য", icon: "📦" },
                  { v: `${totalOrders}+`, l: "সফল অর্ডার", icon: "✅" },
                  { v: "5.0 ⭐", l: "গড় রেটিং", icon: "⭐" },
                  { v: "24/7", l: "কাস্টমার সাপোর্ট", icon: "🤝" },
                ].map(({ v, l, icon }) => (
                  <div key={l} className="bg-white rounded-sm p-5 text-center border border-gray-100 shadow-sm">
                    <p className="text-2xl mb-1.5">{icon}</p>
                    <p className="text-xl font-black" style={{ color: primary }}>{v}</p>
                    <p className="text-xs text-gray-500 mt-1">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CUSTOMER REVIEWS ── */}
      {reviews.length > 0 && (
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <SectionHead title="Customer Reviews" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.slice(0, 6).map(r => (
                <div key={r.id} className="border border-gray-100 rounded-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ color: i <= r.rating ? "#F59E0B" : "#E5E7EB", fontSize: 13 }}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed italic mb-3 line-clamp-3">
                    "{r.comment || "দারুণ পণ্য!"}"
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                      style={{ backgroundColor: primary }}>
                      {r.reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">{r.reviewerName}</p>
                      <p className="text-[10px] text-gray-400">✅ ভেরিফাইড</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── NEWSLETTER ── */}
      <section className="border-t border-gray-200 bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="w-12 h-12 rounded-sm bg-white/10 flex items-center justify-center mx-auto mb-5">
            <Mail size={22} className="text-white" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2">নিউজলেটার</h2>
          <p className="text-gray-400 text-sm mb-6">নতুন পণ্য ও অফারের আপডেট পেতে সাবস্ক্রাইব করুন</p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-white font-bold">
              <CheckCircle size={18} className="text-green-400" /> ধন্যবাদ! শীঘ্রই আপডেট পাবেন।
            </div>
          ) : (
            <div className="flex gap-2 max-w-sm mx-auto">
              <input type="text" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="আপনার ফোন নম্বর..."
                className="flex-1 px-4 py-3 text-sm outline-none text-gray-800 bg-white"
                style={{ borderRadius: 0 }} />
              <button onClick={() => { if(email.trim()) setSubscribed(true); }}
                className="px-5 py-3 text-sm font-black uppercase tracking-widest text-white hover:opacity-90 transition-opacity flex-shrink-0"
                style={{ backgroundColor: primary, borderRadius: 0 }}>
                Subscribe
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
