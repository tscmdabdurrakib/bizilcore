"use client";

import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useStoreTheme } from "./ThemeProvider";

interface HeroShop {
  name: string; storeSlug: string; storeBannerUrl: string | null;
  storeTagline: string | null; storeAbout: string | null; logoUrl: string | null;
  storeFreeShipping: boolean | null; storeCODEnabled: boolean | null;
  storeBkashNumber: string | null; storeNagadNumber: string | null;
}
interface Props { shop: HeroShop; productCount: number; totalOrders: number; }

export function DynamicHero({ shop, productCount, totalOrders }: Props) {
  const { primary } = useStoreTheme();
  const slug = shop.storeSlug;

  const heroImg = shop.storeBannerUrl
    || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=85";

  const stats = [
    { value: `${Math.max(productCount, 200)}+`, label: "High-Quality Products" },
    { value: `${Math.max(totalOrders, 30000)}+`, label: "Happy Customers" },
    { value: "4.9★", label: "Average Rating" },
  ];

  return (
    <section className="bg-[#F2F0F1] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-0 min-h-[600px]">
          {/* Left Text */}
          <div className="py-16 lg:py-24">
            <h1 className="font-black text-black leading-[1.05] mb-6"
              style={{ fontSize: "clamp(2.5rem,5.5vw,4.2rem)", letterSpacing: "-0.02em" }}>
              {shop.storeTagline
                ? shop.storeTagline
                : <>FIND CLOTHES<br />THAT MATCHES<br />YOUR STYLE</>}
            </h1>
            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-sm">
              {shop.storeAbout
                || "Browse through our diverse range of meticulously crafted garments, designed to bring out your individuality."}
            </p>
            <Link
              href={`/store/${slug}/products`}
              className="inline-flex items-center gap-2 bg-black text-white text-sm font-semibold px-8 py-4 rounded-full hover:bg-gray-800 transition-colors">
              Shop Now <ArrowRight size={16} />
            </Link>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-0 mt-12 divide-x divide-gray-300">
              {stats.map((s, i) => (
                <div key={i} className={`${i === 0 ? "pr-8" : "px-8"}`}>
                  <p className="text-2xl sm:text-3xl font-black text-black">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[100px] leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div className="relative h-[500px] lg:h-full lg:min-h-[600px] overflow-hidden">
            <img
              src={heroImg}
              alt={shop.name}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
