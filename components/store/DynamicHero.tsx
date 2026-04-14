"use client";

import Link from "next/link";
import { ShoppingBag, Truck, Shield, BadgeCheck, Headphones } from "lucide-react";
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

interface Props { shop: HeroShop; productCount: number; totalOrders: number; }

export function DynamicHero({ shop, productCount, totalOrders }: Props) {
  const { primary } = useStoreTheme();
  const slug = shop.storeSlug;
  const hasBanner = !!shop.storeBannerUrl;

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative w-full overflow-hidden bg-gray-100" style={{ minHeight: 380 }}>
        {hasBanner ? (
          <>
            <img src={shop.storeBannerUrl!} alt={shop.name} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.3) 55%,transparent 100%)" }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, #111 0%, ${primary}dd 60%, ${primary}88 100%)`
          }} />
        )}

        {/* Decorative wavy lines (like payra) */}
        {!hasBanner && (
          <div className="absolute inset-0 opacity-10 overflow-hidden">
            <svg className="absolute right-0 top-0 h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
              <path d="M400,0 Q300,100 400,200 Q300,300 400,400" stroke="white" strokeWidth="1" fill="none" />
              <path d="M400,0 Q260,120 400,240 Q260,360 400,400" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M350,0 Q220,120 350,240 Q220,360 350,400" stroke="white" strokeWidth="0.5" fill="none" />
            </svg>
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center" style={{ minHeight: 380 }}>
          <div className="max-w-lg">
            <p className="text-white/70 text-sm uppercase tracking-[0.25em] font-semibold mb-3">
              {shop.name}
            </p>
            <h1 className="font-black text-white leading-none uppercase mb-5"
              style={{ fontSize: "clamp(2rem,5vw,3.5rem)", letterSpacing: "-0.02em" }}>
              {shop.storeTagline || `স্বাগতম\n${shop.name}`}
            </h1>
            {shop.storeAbout && (
              <p className="text-white/65 text-sm leading-relaxed mb-7 max-w-sm">{shop.storeAbout}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap mb-6">
              {shop.storeFreeShipping && (
                <span className="text-xs font-semibold text-white/80 border border-white/30 px-3 py-1.5 rounded-sm backdrop-blur-sm">🚚 ফ্রি ডেলিভারি</span>
              )}
              {shop.storeCODEnabled && (
                <span className="text-xs font-semibold text-white/80 border border-white/30 px-3 py-1.5 rounded-sm backdrop-blur-sm">💵 ক্যাশ অন ডেলিভারি</span>
              )}
            </div>
            <Link href={`/store/${slug}/products`}
              className="inline-flex items-center gap-2 px-8 py-3 text-sm font-black tracking-widest uppercase border-2 border-white text-white hover:bg-white transition-colors duration-200"
              style={{ letterSpacing: "0.15em" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = primary; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "white"; }}
            >
              <ShoppingBag size={14} /> Shop Now
            </Link>
          </div>

          {/* Stats row bottom */}
          {(productCount > 0 || totalOrders > 0) && (
            <div className="flex items-center gap-8 mt-10">
              {productCount > 0 && (
                <div>
                  <p className="text-2xl font-black text-white">{productCount}+</p>
                  <p className="text-xs text-white/50 uppercase tracking-widest">পণ্য</p>
                </div>
              )}
              {totalOrders > 0 && (
                <div>
                  <p className="text-2xl font-black text-white">{totalOrders}+</p>
                  <p className="text-xs text-white/50 uppercase tracking-widest">অর্ডার</p>
                </div>
              )}
              <div>
                <p className="text-2xl font-black text-white">⭐ 5.0</p>
                <p className="text-xs text-white/50 uppercase tracking-widest">রেটিং</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
            {[
              { Icon: Truck, text: "দ্রুত ডেলিভারি", sub: "সারাদেশে" },
              { Icon: Shield, text: "নিরাপদ পেমেন্ট", sub: "বিকাশ/নগদ/COD" },
              { Icon: BadgeCheck, text: "১০০% অরিজিনাল", sub: "মানের নিশ্চয়তা" },
              { Icon: Headphones, text: "২৪/৭ সাপোর্ট", sub: "সবসময় পাশে" },
            ].map(({ Icon, text, sub }) => (
              <div key={text} className="flex items-center gap-3 px-5 py-4">
                <Icon size={20} style={{ color: primary }} className="flex-shrink-0" />
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
