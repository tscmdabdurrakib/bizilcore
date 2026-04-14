"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Truck, Shield, BadgeCheck, Headphones, Tag } from "lucide-react";
import { useStoreTheme } from "./ThemeProvider";

interface HeroShop {
  name: string; storeSlug: string; storeBannerUrl: string | null;
  storeTagline: string | null; storeAbout: string | null; logoUrl: string | null;
  storeFreeShipping: boolean | null; storeCODEnabled: boolean | null;
  storeBkashNumber: string | null; storeNagadNumber: string | null;
}
interface Props { shop: HeroShop; productCount: number; totalOrders: number; }

/* Curated Unsplash hero images (shopping / fashion themed) */
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80",
  "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80",
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1600&q=80",
];

export function DynamicHero({ shop, productCount, totalOrders }: Props) {
  const { primary } = useStoreTheme();
  const slug = shop.storeSlug;

  /* Pick a stable hero image based on shop name */
  const heroImg = shop.storeBannerUrl
    || HERO_IMAGES[(shop.name.charCodeAt(0) || 0) % HERO_IMAGES.length];

  const chips = [
    shop.storeFreeShipping && "🚚 ফ্রি ডেলিভারি",
    shop.storeCODEnabled  && "💵 ক্যাশ অন ডেলিভারি",
    (shop.storeBkashNumber || shop.storeNagadNumber) && "📱 বিকাশ / নগদ",
  ].filter(Boolean) as string[];

  return (
    <div>
      {/* ── Main Hero ── */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: 500 }}>
        {/* Background image */}
        <img
          src={heroImg}
          alt={shop.name}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark overlay — stronger on left for text readability */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(100deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.20) 100%)" }} />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col justify-center"
          style={{ minHeight: 500 }}>
          <div className="max-w-xl">

            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-4">
              <Tag size={12} className="text-white/60" />
              <span className="text-white/70 text-xs uppercase tracking-[0.3em] font-semibold">
                {shop.name}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-black text-white leading-[1.05] mb-5"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", letterSpacing: "-0.02em" }}>
              {shop.storeTagline || `${shop.name} এ\nস্বাগতম`}
            </h1>

            {shop.storeAbout && (
              <p className="text-white/65 text-sm leading-relaxed mb-6 max-w-sm line-clamp-2">
                {shop.storeAbout}
              </p>
            )}

            {/* Payment chips */}
            {chips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-7">
                {chips.map(c => (
                  <span key={c}
                    className="text-xs font-medium text-white/85 border border-white/25 px-3 py-1.5 backdrop-blur-sm rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/store/${slug}/products`}
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-black tracking-wide text-white hover:opacity-90 transition-opacity shadow-xl rounded-full"
                style={{ backgroundColor: primary }}>
                <ShoppingBag size={15} /> এখনই কিনুন
              </Link>
              <Link
                href={`/store/${slug}/products`}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold border-2 border-white/50 text-white hover:bg-white/10 transition-colors rounded-full backdrop-blur-sm">
                সব পণ্য <ArrowRight size={14} />
              </Link>
            </div>

            {/* Stats */}
            {(productCount > 0 || totalOrders > 0) && (
              <div className="flex items-center gap-7 mt-10">
                {productCount > 0 && (
                  <div>
                    <p className="text-2xl font-black text-white">{productCount}+</p>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">পণ্য</p>
                  </div>
                )}
                {totalOrders > 0 && (
                  <div>
                    <p className="text-2xl font-black text-white">{totalOrders}+</p>
                    <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">অর্ডার</p>
                  </div>
                )}
                <div>
                  <p className="text-2xl font-black text-white">⭐ 5.0</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5">রেটিং</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">
            {[
              { Icon: Truck,       text: "দ্রুত ডেলিভারি",   sub: "সারাদেশে শিপমেন্ট" },
              { Icon: Shield,      text: "নিরাপদ পেমেন্ট",   sub: "বিকাশ / নগদ / COD" },
              { Icon: BadgeCheck,  text: "১০০% অরিজিনাল",    sub: "মানের নিশ্চয়তা" },
              { Icon: Headphones,  text: "২৪/৭ সাপোর্ট",     sub: "সবসময় পাশে আছি" },
            ].map(({ Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-3 px-5 py-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: primary + "15" }}>
                  <Icon size={18} style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{text}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
