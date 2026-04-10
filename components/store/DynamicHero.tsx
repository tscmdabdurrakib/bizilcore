"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight, Truck, Shield, Headphones, BadgeCheck, Sparkles } from "lucide-react";
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

export function DynamicHero({ shop, productCount, totalOrders }: Props) {
  const { primary, accent } = useStoreTheme();
  const slug = shop.storeSlug;
  const hasBanner = !!shop.storeBannerUrl;

  const chips = [
    shop.storeFreeShipping && { icon: "🚚", label: "ফ্রি ডেলিভারি" },
    shop.storeCODEnabled && { icon: "💵", label: "ক্যাশ অন ডেলিভারি" },
    (shop.storeBkashNumber || shop.storeNagadNumber) && { icon: "📱", label: "বিকাশ / নগদ" },
    { icon: "⭐", label: "বিশ্বস্ত শপ" },
  ].filter(Boolean) as { icon: string; label: string }[];

  return (
    <div>
      {/* Main Hero */}
      <section className="relative w-full overflow-hidden" style={{ minHeight: "460px" }}>
        {hasBanner ? (
          <>
            <img src={shop.storeBannerUrl!} alt={shop.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{
              background: "linear-gradient(100deg, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.05) 100%)"
            }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 40%, ${accent || "#4F46E5"}99 100%)`
            }} />
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: accent || "#fff" }} />
            <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#ffffff" }} />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full opacity-5 bg-white" />
          </>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-20 flex flex-col md:flex-row items-center justify-between gap-10" style={{ minHeight: "460px" }}>
          <div className="max-w-xl w-full">
            {/* Pre-title */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/25">
                <Sparkles size={12} />
                {shop.name}
              </div>
              {totalOrders > 0 && (
                <div className="bg-white/15 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/25">
                  {totalOrders}+ অর্ডার
                </div>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-4">
              {shop.storeTagline || shop.name}
            </h1>

            {shop.storeAbout && (
              <p className="text-white/70 text-base leading-relaxed mb-7 max-w-md line-clamp-2">
                {shop.storeAbout}
              </p>
            )}

            {/* Chips */}
            <div className="flex items-center gap-2 flex-wrap mb-8">
              {chips.map(chip => (
                <span key={chip.label}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white border border-white/25 bg-white/10 backdrop-blur-sm">
                  {chip.icon} {chip.label}
                </span>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/store/${slug}/products`}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-xl"
                style={{ backgroundColor: "#ffffff", color: primary }}
              >
                <ShoppingBag size={16} /> এখনই কিনুন
              </Link>
              <Link
                href={`/store/${slug}/products`}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold border-2 border-white/40 text-white transition-all hover:bg-white/10 backdrop-blur-sm"
              >
                সব পণ্য দেখুন <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right side stats (desktop only) */}
          {(productCount > 0 || totalOrders > 0) && (
            <div className="hidden md:grid grid-cols-2 gap-3 flex-shrink-0">
              {[
                { val: `${productCount}+`, label: "মোট পণ্য", icon: "📦", color: "#F59E0B" },
                { val: `${totalOrders}+`, label: "সফল অর্ডার", icon: "✅", color: "#10B981" },
                { val: "5.0 ⭐", label: "গড় রেটিং", icon: "⭐", color: "#6366F1" },
                { val: "24/7", label: "সাপোর্ট", icon: "🤝", color: "#EC4899" },
              ].map(({ val, label, icon, color }) => (
                <div key={label}
                  className="w-36 rounded-2xl p-4 text-center backdrop-blur-md border border-white/20"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                  <div className="text-2xl mb-1">{icon}</div>
                  <p className="text-xl font-black text-white">{val}</p>
                  <p className="text-[11px] text-white/65 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100">
            {[
              { Icon: Truck, label: "দ্রুত ডেলিভারি", sub: "সারাদেশে শিপমেন্ট" },
              { Icon: Shield, label: "নিরাপদ পেমেন্ট", sub: "বিকাশ / নগদ / COD" },
              { Icon: BadgeCheck, label: "১০০% অরিজিনাল", sub: "মানের নিশ্চয়তা" },
              { Icon: Headphones, label: "২৪/৭ সাপোর্ট", sub: "সবসময় পাশে আছি" },
            ].map(({ Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primary + "15" }}>
                  <Icon size={18} style={{ color: primary }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 leading-tight">{label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
