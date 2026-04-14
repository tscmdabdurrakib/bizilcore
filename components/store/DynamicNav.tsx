"use client";

import Link from "next/link";
import { ShoppingCart, Search, X, Menu, Phone, MapPin, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/store/cart";
import { useStoreTheme } from "./ThemeProvider";
import { useRouter } from "next/navigation";

interface StoreShop {
  name: string; logoUrl: string | null; phone: string | null; storeSlug: string;
  storeSocialWA: string | null; storeFreeShipping: boolean | null;
  storeShippingFee: number | null; storeCODEnabled: boolean | null;
}

interface Props { shop: StoreShop; }

function SearchBar({ slug, className = "" }: { slug: string; className?: string }) {
  const [q, setQ] = useState("");
  const router = useRouter();
  return (
    <form onSubmit={e => { e.preventDefault(); if(q.trim()) router.push(`/store/${slug}/products?q=${encodeURIComponent(q.trim())}`); }}
      className={`flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 ${className}`}>
      <Search size={14} className="text-gray-400 flex-shrink-0" />
      <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="পণ্য খুঁজুন..."
        className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400 min-w-0 bg-transparent" />
      {q && <button type="button" onClick={() => setQ("")}><X size={12} className="text-gray-400" /></button>}
    </form>
  );
}

function CartButton({ slug, primary }: { slug: string; primary: string }) {
  const count = useCart(s => s.getCount());
  return (
    <Link href={`/store/${slug}/cart`}
      className="relative flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-white transition-opacity hover:opacity-80"
      style={{ backgroundColor: primary }}>
      <ShoppingCart size={15} />
      <span className="hidden sm:inline text-xs font-black uppercase tracking-wider">কার্ট</span>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white bg-red-500">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

export function DynamicNav({ shop }: Props) {
  const { primary } = useStoreTheme();
  const ensureShop = useCart(s => s.ensureShop);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const slug = shop.storeSlug;

  useEffect(() => { ensureShop(slug); }, [slug, ensureShop]);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navLinks = [
    { href: `/store/${slug}`, label: "হোম" },
    { href: `/store/${slug}/products`, label: "সব পণ্য" },
    { href: `/store/${slug}/track`, label: "অর্ডার ট্র্যাক" },
  ];

  return (
    <>
      {/* Top announcement bar */}
      {(shop.storeFreeShipping || shop.storeCODEnabled) && (
        <div className="text-center py-1.5 text-xs font-semibold text-white" style={{ backgroundColor: primary }}>
          {shop.storeFreeShipping
            ? "🎉 ফ্রি ডেলিভারি পাচ্ছেন! | নিরাপদে কেনাকাটা করুন"
            : "✅ ক্যাশ অন ডেলিভারি পাওয়া যাচ্ছে | নিরাপদে কেনাকাটা করুন"}
        </div>
      )}

      {/* Main header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 transition-shadow"
        style={{ boxShadow: scrolled ? "0 2px 10px rgba(0,0,0,0.08)" : "none" }}>

        {/* Top row: logo + search + icons */}
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href={`/store/${slug}`} className="flex items-center gap-2.5 flex-shrink-0 mr-2">
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} className="w-9 h-9 object-cover" style={{ borderRadius: 0 }} />
            ) : (
              <div className="w-9 h-9 flex items-center justify-center text-white font-black text-base"
                style={{ backgroundColor: primary }}>
                {shop.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="font-black text-gray-900 text-base tracking-tight hidden sm:block truncate max-w-[160px]">
              {shop.name}
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 hidden md:block max-w-md">
            <SearchBar slug={slug} className="w-full" />
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2 ml-auto">
            {shop.phone && (
              <a href={`tel:${shop.phone}`}
                className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-2 py-1.5 transition-colors">
                <Phone size={13} /> {shop.phone}
              </a>
            )}
            <Link href={`/store/${slug}/track`}
              className="hidden sm:flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2 py-1.5 transition-colors">
              <MapPin size={13} /> ট্র্যাক
            </Link>
            <Link href={`/store/${slug}/wishlist`}
              className="flex items-center gap-1 px-2 py-1.5 text-gray-600 hover:text-red-500 transition-colors">
              <Heart size={16} />
            </Link>
            <CartButton slug={slug} primary={primary} />
            <button onClick={() => setMenuOpen(true)}
              className="p-2 border border-gray-200 text-gray-600 hover:bg-gray-50 md:hidden transition-colors">
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <SearchBar slug={slug} className="w-full" />
        </div>

        {/* Nav links */}
        <div className="border-t border-gray-100 hidden md:block">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-0">
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors border-b-2 border-transparent hover:border-gray-900">
                  {label}
                </Link>
              ))}
              {shop.storeSocialWA && (
                <a href={`https://wa.me/${shop.storeSocialWA}`} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors">
                  💬 WhatsApp
                </a>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="relative ml-auto w-72 bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <Link href={`/store/${slug}`} className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
                {shop.logoUrl ? (
                  <img src={shop.logoUrl} alt={shop.name} className="w-8 h-8 object-cover" />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: primary }}>
                    {shop.name[0]?.toUpperCase()}
                  </div>
                )}
                <span className="font-black text-gray-900">{shop.name}</span>
              </Link>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-gray-500"><X size={20} /></button>
            </div>
            <div className="p-4 border-b border-gray-100">
              <SearchBar slug={slug} className="w-full" />
            </div>
            <nav className="p-4 flex flex-col">
              {[
                { href: `/store/${slug}`, label: "🏠 হোম" },
                { href: `/store/${slug}/products`, label: "🛍️ সব পণ্য" },
                { href: `/store/${slug}/wishlist`, label: "❤️ পছন্দের তালিকা" },
                { href: `/store/${slug}/cart`, label: "🛒 কার্ট" },
                { href: `/store/${slug}/track`, label: "📍 অর্ডার ট্র্যাক" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-3 text-sm font-semibold text-gray-700 border-b border-gray-50 hover:text-gray-900 transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
            {(shop.phone || shop.storeSocialWA) && (
              <div className="mx-4 mb-4 mt-auto p-4 bg-gray-50">
                <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: primary }}>যোগাযোগ</p>
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone size={13} style={{ color: primary }} /> {shop.phone}
                  </a>
                )}
                {shop.storeSocialWA && (
                  <a href={`https://wa.me/${shop.storeSocialWA}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-white text-sm font-bold"
                    style={{ backgroundColor: "#25D366" }}>
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
