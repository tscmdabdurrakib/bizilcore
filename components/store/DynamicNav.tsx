"use client";

import Link from "next/link";
import { ShoppingCart, Search, MapPin, X, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/store/cart";
import { useStoreTheme } from "./ThemeProvider";
import { useRouter } from "next/navigation";

interface StoreShop {
  name: string;
  logoUrl: string | null;
  phone: string | null;
  storeSlug: string;
  storeSocialWA: string | null;
}

interface Props {
  shop: StoreShop;
}

function LogoBlock({ shop, primary, slug }: { shop: StoreShop; primary: string; slug: string }) {
  return (
    <Link href={`/store/${slug}`} className="flex items-center gap-2 flex-shrink-0">
      {shop.logoUrl ? (
        <img src={shop.logoUrl} alt={shop.name} className="w-8 h-8 rounded-lg object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: primary }}>
          {shop.name[0]?.toUpperCase()}
        </div>
      )}
      <span className="font-bold text-sm truncate max-w-[140px]" style={{ fontFamily: "var(--store-font-heading, inherit)" }}>
        {shop.name}
      </span>
    </Link>
  );
}

function CartButton({ slug, primary }: { slug: string; primary: string }) {
  const count = useCart((s) => s.getCount());
  return (
    <Link href={`/store/${slug}/cart`} className="relative flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full text-white flex-shrink-0" style={{ backgroundColor: primary }}>
      <ShoppingCart size={15} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: "#EF4444" }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function SearchBar({ slug, textColor, borderColor, surfaceColor, mutedColor }: {
  slug: string; textColor: string; borderColor: string; surfaceColor: string; mutedColor: string;
}) {
  const [search, setSearch] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/store/${slug}/products?q=${encodeURIComponent(search.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm max-w-xs" style={{ borderColor, backgroundColor: surfaceColor }}>
      <Search size={14} style={{ color: mutedColor }} />
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="পণ্য খুঁজুন..."
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: textColor }}
      />
      {search && <button type="button" onClick={() => setSearch("")}><X size={13} style={{ color: mutedColor }} /></button>}
    </form>
  );
}

export function DynamicNav({ shop }: Props) {
  const { primary, theme, defaults } = useStoreTheme();
  const ensureShop = useCart((s) => s.ensureShop);
  const [menuOpen, setMenuOpen] = useState(false);
  const slug = shop.storeSlug;
  const navStyle = theme.layout.navStyle;
  const navBg = theme.layout.navBg;
  const navText = theme.layout.navTextColor;

  useEffect(() => {
    ensureShop(slug);
  }, [slug, ensureShop]);

  if (navStyle === "topbar_centered") {
    return (
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: navBg, borderColor: defaults.border }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-3 relative">
            <LogoBlock shop={shop} primary={primary} slug={slug} />
            <div className="absolute right-4 flex items-center gap-2">
              <Link href={`/store/${slug}/track`} className="hidden sm:flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: navText + "40", color: navText }}>
                <MapPin size={12} /> ট্র্যাক
              </Link>
              <CartButton slug={slug} primary={primary} />
            </div>
          </div>
          <div className="flex items-center justify-center pb-2">
            <SearchBar slug={slug} textColor={navText} borderColor={navText + "40"} surfaceColor={navText + "15"} mutedColor={navText + "80"} />
          </div>
        </div>
      </header>
    );
  }

  if (navStyle === "minimal_sticky") {
    return (
      <>
        <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: navBg, borderColor: defaults.border }}>
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <LogoBlock shop={shop} primary={primary} slug={slug} />
            <div className="flex items-center gap-2">
              <CartButton slug={slug} primary={primary} />
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg border"
                style={{ borderColor: defaults.border, color: navText }}
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </header>
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <div className="relative ml-auto w-72 bg-white h-full shadow-xl p-6 flex flex-col gap-4" style={{ backgroundColor: defaults.surface, color: defaults.text }}>
              <button onClick={() => setMenuOpen(false)} className="self-end"><X size={20} /></button>
              <SearchBar slug={slug} textColor={defaults.text} borderColor={defaults.border} surfaceColor={defaults.bg} mutedColor={defaults.muted} />
              <nav className="flex flex-col gap-3 mt-4">
                <Link href={`/store/${slug}`} onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2 border-b" style={{ borderColor: defaults.border, color: defaults.text }}>হোম</Link>
                <Link href={`/store/${slug}/products`} onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2 border-b" style={{ borderColor: defaults.border, color: defaults.text }}>সব পণ্য</Link>
                <Link href={`/store/${slug}/track`} onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2 border-b" style={{ borderColor: defaults.border, color: defaults.text }}>অর্ডার ট্র্যাক</Link>
              </nav>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: navBg, borderColor: navBg === "#ffffff" ? defaults.border : "transparent" }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <div className="flex-shrink-0 mr-2">
          <LogoBlock shop={shop} primary={primary} slug={slug} />
        </div>
        <SearchBar slug={slug} textColor={navText} borderColor={navText + "40"} surfaceColor={navText + "15"} mutedColor={navText + "80"} />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/store/${slug}/track`} className="hidden sm:flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: navText + "40", color: navText }}>
            <MapPin size={12} /> ট্র্যাক
          </Link>
          <CartButton slug={slug} primary={primary} />
        </div>
      </div>
    </header>
  );
}
