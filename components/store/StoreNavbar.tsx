"use client";

import Link from "next/link";
import { ShoppingCart, Search, MapPin, X } from "lucide-react";
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

export function StoreNavbar({ shop }: Props) {
  const { primary, theme, defaults } = useStoreTheme();
  const count = useCart((s) => s.getCount());
  const ensureShop = useCart((s) => s.ensureShop);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const slug = shop.storeSlug;

  useEffect(() => {
    ensureShop(slug);
  }, [slug, ensureShop]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/store/${slug}/products?q=${encodeURIComponent(search.trim())}`);
    }
  }

  const bg = defaults.bg;
  const text = defaults.text;
  const border = defaults.border;

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{ backgroundColor: bg, borderColor: border, color: text }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
        <Link href={`/store/${slug}`} className="flex items-center gap-2 flex-shrink-0 mr-2">
          {shop.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: primary }}>
              {shop.name[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-bold text-sm hidden sm:block truncate max-w-[120px]" style={{ color: text }}>
            {shop.name}
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: border, backgroundColor: defaults.surface }}>
          <Search size={14} style={{ color: defaults.muted }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="পণ্য খুঁজুন..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: text }}
          />
          {search && <button type="button" onClick={() => setSearch("")}><X size={13} style={{ color: defaults.muted }} /></button>}
        </form>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/store/${slug}/track`} className="hidden sm:flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border" style={{ borderColor: border, color: defaults.muted }}>
            <MapPin size={12} /> ট্র্যাক
          </Link>

          <Link href={`/store/${slug}/cart`} className="relative flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: primary }}>
            <ShoppingCart size={15} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: "#EF4444" }}>
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
