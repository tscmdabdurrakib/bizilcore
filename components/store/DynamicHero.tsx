"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import type { ThemeConfig } from "@/lib/themes";
import { useStoreTheme } from "./ThemeProvider";

interface HeroShop {
  name: string;
  storeSlug: string;
  storeBannerUrl: string | null;
  storeTagline: string | null;
  storeAbout: string | null;
  logoUrl: string | null;
}

interface HeroDefaults {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  accent: string;
}

interface Props {
  shop: HeroShop;
}

function FullwidthImageHero({ shop, primary, accent, theme }: { shop: HeroShop; primary: string; accent: string; theme: ThemeConfig }) {
  const slug = shop.storeSlug;

  return (
    <div
      className="relative w-full flex items-end overflow-hidden"
      style={{ minHeight: theme.layout.heroHeight, height: theme.layout.heroHeight, maxHeight: "100vh" }}
    >
      {shop.storeBannerUrl ? (
        <img
          src={shop.storeBannerUrl}
          alt={shop.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }} />
      )}
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-16 pt-20">
        <p
          className={`${theme.typography.heroSize} font-black text-white leading-none mb-4 uppercase`}
          style={{ fontFamily: `"${theme.typography.fontHeading}"`, fontWeight: theme.typography.headingWeight }}
        >
          {shop.storeTagline || shop.name}
        </p>
        {shop.storeTagline && (
          <p className="text-white/70 text-lg mb-8 max-w-md">{shop.name}</p>
        )}
        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/store/${slug}/products`}
            className={`inline-flex items-center gap-2 px-8 py-4 text-white font-bold text-base ${theme.components.buttonRadius}`}
            style={{ backgroundColor: accent }}
          >
            <ShoppingBag size={18} /> এখনই কিনুন
          </Link>
          <Link
            href={`/store/${slug}/products`}
            className={`inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-bold text-base ${theme.components.buttonRadius}`}
          >
            সব পণ্য দেখুন
          </Link>
        </div>
      </div>
    </div>
  );
}

function SplitTextImageHero({ shop, primary, theme, defaults }: { shop: HeroShop; primary: string; theme: ThemeConfig; defaults: HeroDefaults }) {
  const slug = shop.storeSlug;

  return (
    <div
      className="w-full flex items-center overflow-hidden"
      style={{ minHeight: theme.layout.heroHeight, backgroundColor: theme.colors.background }}
    >
      <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-16">
        <div>
          <p
            className={`${theme.typography.heroSize} font-bold leading-tight mb-4`}
            style={{ fontFamily: `"${theme.typography.fontHeading}"`, fontWeight: theme.typography.headingWeight, color: defaults.text }}
          >
            {shop.storeTagline || shop.name}
          </p>
          {shop.storeTagline && (
            <p className="text-lg mb-6" style={{ color: defaults.muted }}>{shop.name}</p>
          )}
          <div className="flex gap-3 flex-wrap">
            <Link
              href={`/store/${slug}/products`}
              className={`inline-flex items-center gap-2 px-6 py-3 text-white font-semibold ${theme.components.buttonRadius}`}
              style={{ backgroundColor: primary }}
            >
              <ShoppingBag size={16} /> এখনই কিনুন
            </Link>
            <Link
              href={`/store/${slug}/products`}
              className={`inline-flex items-center gap-2 px-6 py-3 border-2 font-semibold ${theme.components.buttonRadius}`}
              style={{ borderColor: primary, color: primary }}
            >
              সব পণ্য
            </Link>
          </div>
        </div>
        <div
          className="relative aspect-square max-h-[480px] overflow-hidden"
          style={{ borderRadius: theme.components.borderRadius !== "rounded-none" ? "16px" : "0" }}
        >
          {shop.storeBannerUrl ? (
            <img src={shop.storeBannerUrl} alt={shop.name} className="w-full h-full object-cover" />
          ) : shop.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}22, ${primary}55)` }}>
              <p className="text-6xl font-black" style={{ fontFamily: `"${theme.typography.fontHeading}"`, color: primary }}>
                {shop.name[0]?.toUpperCase()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BannerSliderHero({ shop, primary, theme, defaults }: { shop: HeroShop; primary: string; theme: ThemeConfig; defaults: HeroDefaults }) {
  const slug = shop.storeSlug;
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: shop.name,
      subtitle: shop.storeTagline || "সেরা পণ্য, সেরা দামে",
      cta: "এখনই কিনুন",
      bg: shop.storeBannerUrl,
    },
    {
      title: "বিশেষ অফার",
      subtitle: "আজকেই অর্ডার করুন এবং দ্রুত ডেলিভারি পান",
      cta: "অফার দেখুন",
      bg: null,
    },
    {
      title: "সব পণ্য দেখুন",
      subtitle: "আমাদের সম্পূর্ণ কালেকশন ব্রাউজ করুন",
      cta: "কালেকশন দেখুন",
      bg: null,
    },
  ];

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[slide];

  return (
    <div
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{ minHeight: theme.layout.heroHeight, backgroundColor: primary + "22" }}
    >
      {current.bg ? (
        <>
          <img src={current.bg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}33, ${primary}66)` }} />
      )}
      <div className="relative z-10 text-center px-6 py-16 max-w-2xl">
        <p
          className={`${theme.typography.heroSize} font-bold leading-tight mb-3 transition-all duration-500`}
          style={{
            fontFamily: `"${theme.typography.fontHeading}"`,
            fontWeight: theme.typography.headingWeight,
            color: current.bg ? "#fff" : defaults.text,
          }}
        >
          {current.title}
        </p>
        <p className="text-lg mb-8" style={{ color: current.bg ? "rgba(255,255,255,0.85)" : defaults.muted }}>
          {current.subtitle}
        </p>
        <Link
          href={`/store/${slug}/products`}
          className={`inline-flex items-center gap-2 px-8 py-3 font-semibold text-white ${theme.components.buttonRadius}`}
          style={{ backgroundColor: primary }}
        >
          <ShoppingBag size={16} /> {current.cta}
        </Link>
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i === slide ? primary : "rgba(255,255,255,0.5)",
              width: i === slide ? "24px" : "8px",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TextOnlyCenteredHero({ shop, primary, theme, defaults }: { shop: HeroShop; primary: string; theme: ThemeConfig; defaults: HeroDefaults }) {
  const slug = shop.storeSlug;

  return (
    <div
      className="w-full flex items-center justify-center text-center"
      style={{ minHeight: theme.layout.heroHeight, backgroundColor: theme.colors.background }}
    >
      <div className="px-6 py-16 max-w-2xl">
        <p
          className={`${theme.typography.heroSize} font-bold leading-tight mb-4`}
          style={{
            fontFamily: `"${theme.typography.fontHeading}"`,
            fontWeight: theme.typography.headingWeight,
            color: defaults.text,
          }}
        >
          {shop.storeTagline || shop.name}
        </p>
        {shop.storeTagline && (
          <p className="text-lg mb-8" style={{ color: defaults.muted }}>{shop.name}</p>
        )}
        <Link
          href={`/store/${slug}/products`}
          className={`inline-flex items-center gap-2 px-6 py-3 text-white font-semibold ${theme.components.buttonRadius}`}
          style={{ backgroundColor: primary }}
        >
          <ShoppingBag size={16} /> কেনাকাটা শুরু করুন
        </Link>
      </div>
    </div>
  );
}

export function DynamicHero({ shop }: Props) {
  const { primary, accent, theme, defaults } = useStoreTheme();
  const heroStyle = theme.layout.heroStyle;

  if (heroStyle === "fullwidth_image") {
    return <FullwidthImageHero shop={shop} primary={primary} accent={accent} theme={theme} />;
  }
  if (heroStyle === "split_text_image") {
    return <SplitTextImageHero shop={shop} primary={primary} theme={theme} defaults={defaults} />;
  }
  if (heroStyle === "banner_slider") {
    return <BannerSliderHero shop={shop} primary={primary} theme={theme} defaults={defaults} />;
  }
  return <TextOnlyCenteredHero shop={shop} primary={primary} theme={theme} defaults={defaults} />;
}
