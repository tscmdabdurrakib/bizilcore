"use client";

import Link from "next/link";
import { ShoppingCart, Search, MapPin, X, Menu, Phone, ChevronDown } from "lucide-react";
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
  storeFreeShipping: boolean | null;
  storeShippingFee: number | null;
  storeCODEnabled: boolean | null;
}

interface Props {
  shop: StoreShop;
}

function AnnouncementBar({ shop, primary }: { shop: StoreShop; primary: string }) {
  const [visible, setVisible] = useState(true);
  const slug = shop.storeSlug;

  if (!visible) return null;

  return (
    <div className="relative flex items-center justify-center text-center py-2 px-8 text-xs font-medium text-white" style={{ backgroundColor: primary }}>
      <span>
        {shop.storeFreeShipping
          ? "🎉 ফ্রি ডেলিভারি পাচ্ছেন! এখনই অর্ডার করুন"
          : shop.storeCODEnabled
          ? "✅ ক্যাশ অন ডেলিভারি পাওয়া যাচ্ছে | নিরাপদে কেনাকাটা করুন"
          : "🛍️ সেরা পণ্য, সেরা দামে — স্বাগতম!"}
        {shop.storeSocialWA && (
          <a
            href={`https://wa.me/${shop.storeSocialWA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-3 underline font-semibold opacity-90 hover:opacity-100"
          >
            WhatsApp করুন →
          </a>
        )}
      </span>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function SearchBar({ slug, placeholder = "পণ্য খুঁজুন...", className = "" }: {
  slug: string; placeholder?: string; className?: string;
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
    <form onSubmit={handleSearch} className={`flex items-center gap-2 rounded-full border bg-gray-50 px-4 py-2 text-sm ${className}`} style={{ borderColor: "#e5e7eb" }}>
      <Search size={15} className="text-gray-400 flex-shrink-0" />
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 min-w-0"
      />
      {search && (
        <button type="button" onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600">
          <X size={13} />
        </button>
      )}
    </form>
  );
}

function CartButton({ slug, primary }: { slug: string; primary: string }) {
  const count = useCart((s) => s.getCount());
  return (
    <Link
      href={`/store/${slug}/cart`}
      className="relative flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold transition-opacity hover:opacity-90 flex-shrink-0"
      style={{ backgroundColor: primary }}
    >
      <ShoppingCart size={16} />
      <span className="hidden sm:inline">কার্ট</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: "#EF4444" }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

export function DynamicNav({ shop }: Props) {
  const { primary, defaults } = useStoreTheme();
  const ensureShop = useCart((s) => s.ensureShop);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const slug = shop.storeSlug;

  useEffect(() => {
    ensureShop(slug);
  }, [slug, ensureShop]);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <AnnouncementBar shop={shop} primary={primary} />

      <header
        className="sticky top-0 z-40 border-b transition-shadow duration-200"
        style={{
          backgroundColor: "#ffffff",
          borderColor: "#e5e7eb",
          boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center gap-4">
            <Link href={`/store/${slug}`} className="flex items-center gap-2.5 flex-shrink-0 mr-2">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.name} className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
                  style={{ backgroundColor: primary }}
                >
                  {shop.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="font-bold text-gray-900 text-base hidden sm:block truncate max-w-[160px]">
                {shop.name}
              </span>
            </Link>

            <SearchBar slug={slug} className="flex-1 hidden md:flex max-w-md" />

            <div className="flex items-center gap-2 ml-auto">
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  className="hidden lg:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Phone size={14} /> {shop.phone}
                </a>
              )}
              <Link
                href={`/store/${slug}/track`}
                className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <MapPin size={14} /> ট্র্যাক
              </Link>
              <CartButton slug={slug} primary={primary} />
              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 md:hidden transition-colors"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          <div className="md:hidden pb-3">
            <SearchBar slug={slug} className="w-full" />
          </div>

          <nav className="hidden md:flex items-center gap-1 pb-2 text-sm font-medium text-gray-600">
            <Link href={`/store/${slug}`} className="px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">হোম</Link>
            <Link href={`/store/${slug}/products`} className="px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">সব পণ্য</Link>
            <Link href={`/store/${slug}/wishlist`} className="px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">❤️ পছন্দ</Link>
            <Link href={`/store/${slug}/track`} className="px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors">অর্ডার ট্র্যাক</Link>
            {shop.storeSocialWA && (
              <a
                href={`https://wa.me/${shop.storeSocialWA}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                WhatsApp
              </a>
            )}
          </nav>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="relative ml-auto w-80 bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Link href={`/store/${slug}`} className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primary }}>
                    {shop.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-gray-900">{shop.name}</span>
              </Link>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"><X size={20} /></button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <SearchBar slug={slug} className="w-full" placeholder="পণ্য খুঁজুন..." />
            </div>

            <nav className="p-4 flex flex-col gap-1">
              {[
                { href: `/store/${slug}`, label: "🏠 হোম" },
                { href: `/store/${slug}/products`, label: "🛍️ সব পণ্য" },
                { href: `/store/${slug}/wishlist`, label: "❤️ পছন্দের তালিকা" },
                { href: `/store/${slug}/cart`, label: "🛒 কার্ট" },
                { href: `/store/${slug}/track`, label: "📍 অর্ডার ট্র্যাক" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>

            {(shop.phone || shop.storeSocialWA) && (
              <div className="mx-4 mb-4 p-4 rounded-2xl" style={{ backgroundColor: primary + "10" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: primary }}>যোগাযোগ করুন</p>
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone size={14} style={{ color: primary }} /> {shop.phone}
                  </a>
                )}
                {shop.storeSocialWA && (
                  <a href={`https://wa.me/${shop.storeSocialWA}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ backgroundColor: "#25D366" }}
                  >
                    WhatsApp করুন
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
