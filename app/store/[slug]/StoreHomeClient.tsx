"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Mail, CheckCircle, ArrowRight } from "lucide-react";
import { DynamicHero } from "@/components/store/DynamicHero";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { useStoreTheme } from "@/components/store/ThemeProvider";

/* ── Types ── */
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

/* ── Brand logos marquee ── */
const BRANDS = ["VERSACE", "ZARA", "GUCCI", "PRADA", "Calvin Klein"];

/* ── Category dress style images ── */
const STYLE_CATS = [
  { label: "Casual", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80" },
  { label: "Formal",  img: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80" },
  { label: "Party",   img: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80" },
  { label: "Gym",     img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80" },
];

/* ── Horizontal scroll row ── */
function ProductRow({ products, slug, showDiscount }: { products: Product[]; slug: string; showDiscount?: boolean }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const scroll = (d: "left"|"right") => rowRef.current?.scrollBy({ left: d === "right" ? 520 : -520, behavior: "smooth" });
  if (!products.length) return null;
  return (
    <div className="relative group/row">
      <button onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
        <ChevronLeft size={18} />
      </button>
      <div ref={rowRef} className="flex gap-5 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}>
        {products.map(p => <DynamicProductCard key={p.id} product={p} slug={slug} showDiscount={showDiscount} />)}
      </div>
      <button onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tight">{title}</h2>
      {href && (
        <Link href={href}
          className="hidden sm:flex items-center gap-2 text-sm font-medium border border-black px-6 py-2.5 rounded-full hover:bg-black hover:text-white transition-colors">
          View All <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

/* ── Main ── */
export function StoreHomeClient({ shop, products, categories, totalOrders, reviews }: Props) {
  const { primary } = useStoreTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const slug = shop.storeSlug;

  useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  const newArrivals = useMemo(() => products.filter(p => p.storeFeatured).concat(products.filter(p => !p.storeFeatured)).slice(0, 24), [products]);
  const topSelling  = useMemo(() => [...products].reverse().slice(0, 24), [products]);

  const RowSkeleton = () => (
    <div className="flex gap-5 overflow-hidden">
      {[0,1,2,3,4].map(i => (
        <div key={i} className="flex-shrink-0 animate-pulse rounded-2xl bg-gray-100" style={{ width: 220, height: 320 }} />
      ))}
    </div>
  );

  return (
    <div className="bg-white">
      {/* Hero */}
      <DynamicHero shop={shop} productCount={products.length} totalOrders={totalOrders} />

      {/* ── BRANDS MARQUEE ── */}
      <div className="bg-black py-9 overflow-hidden">
        <div className="flex items-center gap-16 animate-marquee whitespace-nowrap">
          {[...BRANDS, ...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} className="text-white font-black text-xl sm:text-2xl tracking-widest uppercase opacity-90 flex-shrink-0">
              {b}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── NEW ARRIVALS ── */}
        {newArrivals.length > 0 && (
          <section className="py-16">
            <SectionHeader title="New Arrivals" href={`/store/${slug}/products`} />
            {mounted ? <ProductRow products={newArrivals} slug={slug} /> : <RowSkeleton />}
            <div className="flex justify-center mt-9">
              <Link href={`/store/${slug}/products`}
                className="border border-black text-black font-medium text-sm px-14 py-3.5 rounded-full hover:bg-black hover:text-white transition-colors">
                View All
              </Link>
            </div>
          </section>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-200 mx-4" />

        {/* ── TOP SELLING ── */}
        {topSelling.length > 0 && (
          <section className="py-16">
            <SectionHeader title="Top Selling" href={`/store/${slug}/products`} />
            {mounted ? <ProductRow products={topSelling} slug={slug} showDiscount /> : <RowSkeleton />}
            <div className="flex justify-center mt-9">
              <Link href={`/store/${slug}/products`}
                className="border border-black text-black font-medium text-sm px-14 py-3.5 rounded-full hover:bg-black hover:text-white transition-colors">
                View All
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* ── BROWSE BY DRESS STYLE ── */}
      <section className="bg-[#F0F0F0] py-16 mx-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tight mb-8 text-center">
            Browse by Dress Style
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(categories.length >= 4 ? categories.slice(0,4) : null)
              ? categories.slice(0, 4).map((cat, i) => (
                <Link key={cat} href={`/store/${slug}/products`}
                  className="group relative overflow-hidden rounded-2xl block"
                  style={{ height: i === 0 || i === 3 ? 280 : 220 }}>
                  <img src={STYLE_CATS[i % 4].img} alt={cat}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <span className="absolute top-5 left-5 bg-[#F0F0F0]/90 text-black font-bold text-sm px-4 py-2 rounded-full">
                    {cat}
                  </span>
                </Link>
              ))
              : STYLE_CATS.map((sc, i) => (
                <Link key={sc.label} href={`/store/${slug}/products`}
                  className="group relative overflow-hidden rounded-2xl block"
                  style={{ height: i === 0 || i === 3 ? 280 : 220 }}>
                  <img src={sc.img} alt={sc.label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  <span className="absolute top-5 left-5 bg-[#F0F0F0]/90 text-black font-bold text-sm px-4 py-2 rounded-full">
                    {sc.label}
                  </span>
                </Link>
              ))
            }
          </div>
        </div>
      </section>

      {/* ── CUSTOMER REVIEWS ── */}
      {reviews.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <section className="py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tight">Our Happy Customers</h2>
              <div className="flex gap-2">
                <button className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50">
                  <ChevronLeft size={16} />
                </button>
                <button className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.slice(0, 6).map(r => (
                <div key={r.id}
                  className="border border-gray-200 rounded-2xl p-6 hover:shadow-sm transition-shadow">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={16}
                        fill={i <= r.rating ? "#FFC633" : "none"}
                        stroke={i <= r.rating ? "#FFC633" : "#D1D5DB"} />
                    ))}
                  </div>
                  {/* Name */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-black text-sm">{r.reviewerName}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill="#01AB31"/>
                      <path d="M4.5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {/* Comment */}
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                    "{r.comment || "দারুণ পণ্য! একদম সময়মতো পৌঁছেছে। আবার কিনব।"}"
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── NEWSLETTER ── */}
      <section className="bg-black mx-4 sm:mx-6 mb-12 rounded-3xl overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-4 leading-tight">
            STAY UPTO DATE ABOUT<br />OUR LATEST OFFERS
          </h2>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-white font-semibold">
              <CheckCircle size={20} className="text-green-400" /> Thank you for subscribing!
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8">
              <div className="flex items-center gap-2 bg-white rounded-full px-5 py-3.5 flex-1">
                <Mail size={16} className="text-gray-400 flex-shrink-0" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400 bg-transparent" />
              </div>
              <button onClick={() => { if (email.trim()) setSubscribed(true); }}
                className="bg-white text-black text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                Subscribe to Newsletter
              </button>
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
