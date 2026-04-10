"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Star, Shield, Truck, Headphones } from "lucide-react";
import { useStoreTheme } from "./ThemeProvider";

interface HeroShop {
  name: string;
  storeSlug: string;
  storeBannerUrl: string | null;
  storeTagline: string | null;
  storeAbout: string | null;
  logoUrl: string | null;
  storeFreeShipping: boolean | null;
  storeCODEnabled: boolean | null;
  storeBkashNumber: string | null;
  storeNagadNumber: string | null;
}

interface Props {
  shop: HeroShop;
  productCount: number;
  totalOrders: number;
}

const TRUST_BADGES = [
  { icon: Truck, label: "দ্রুত ডেলিভারি", sub: "সারাদেশে" },
  { icon: Shield, label: "নিরাপদ পেমেন্ট", sub: "বিকাশ / নগদ / COD" },
  { icon: Star, label: "বিশ্বস্ত স্টোর", sub: "হাজারো সন্তুষ্ট ক্রেতা" },
  { icon: Headphones, label: "কাস্টমার সাপোর্ট", sub: "সবসময় পাশে আছি" },
];

export function DynamicHero({ shop, productCount, totalOrders }: Props) {
  const { primary, accent } = useStoreTheme();
  const slug = shop.storeSlug;
  const hasBanner = !!shop.storeBannerUrl;

  return (
    <div>
      <section
        className="relative w-full overflow-hidden"
        style={{ minHeight: "420px" }}
      >
        {hasBanner ? (
          <>
            <img
              src={shop.storeBannerUrl!}
              alt={shop.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.10) 100%)" }} />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 50%, ${accent}88 100%)` }}
          />
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 flex flex-col justify-center" style={{ minHeight: "420px" }}>
          <div className="max-w-xl">
            {shop.storeTagline ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-widest text-white/70 mb-3">
                  {shop.name}
                </p>
                <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
                  {shop.storeTagline}
                </h1>
              </>
            ) : (
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
                {shop.name}
              </h1>
            )}

            {shop.storeAbout && (
              <p className="text-white/75 text-base leading-relaxed mb-6 max-w-md line-clamp-3">
                {shop.storeAbout}
              </p>
            )}

            <div className="flex items-center gap-3 flex-wrap mb-8">
              {shop.storeFreeShipping && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                  <Truck size={13} /> ফ্রি ডেলিভারি
                </span>
              )}
              {shop.storeCODEnabled && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                  ✅ ক্যাশ অন ডেলিভারি
                </span>
              )}
              {(shop.storeBkashNumber || shop.storeNagadNumber) && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                  💳 বিকাশ / নগদ
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/store/${slug}/products`}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: accent || "#ffffff", color: hasBanner ? "#000" : "#fff" }}
              >
                <ShoppingBag size={16} /> এখনই কিনুন
              </Link>
              <Link
                href={`/store/${slug}/products`}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold border-2 border-white text-white transition-all hover:bg-white/10 active:scale-95"
              >
                সব পণ্য দেখুন <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {(productCount > 0 || totalOrders > 0) && (
            <div className="flex items-center gap-6 mt-10 flex-wrap">
              {productCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{productCount}+</p>
                  <p className="text-xs text-white/60">পণ্য</p>
                </div>
              )}
              {totalOrders > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-black text-white">{totalOrders}+</p>
                  <p className="text-xs text-white/60">অর্ডার</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-black text-white">⭐ 5.0</p>
                <p className="text-xs text-white/60">রেটিং</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-gray-100" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primary + "15" }}>
                  <Icon size={18} style={{ color: primary }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
