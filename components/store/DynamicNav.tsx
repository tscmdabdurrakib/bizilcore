"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingCart, User, X, Heart, ChevronDown, Menu, LogOut, Package } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useStoreCustomer } from "@/lib/store/store-customer";

interface NavShop {
  name: string;
  storeSlug: string;
  logoUrl: string | null;
  phone: string | null;
  storeBkashNumber: string | null;
  storeNagadNumber: string | null;
  storeCODEnabled: boolean | null;
  storeFreeShipping: boolean | null;
}

interface Props { shop: NavShop; categories: string[]; }

export function DynamicNav({ shop, categories }: Props) {
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { items } = useCart();
  const { items: wishItems } = useWishlist();
  const { customer, signOut, fetchCustomer } = useStoreCustomer();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);
  const slug = shop.storeSlug;

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      {/* ── Announcement Bar ── */}
      {announcementVisible && (
        <div className="bg-black text-white text-center py-2.5 px-4 relative text-sm font-medium">
          {shop.storeFreeShipping
            ? `ফ্রি শিপিং পাচ্ছেন! নিরাপদে কেনাকাটা করুন`
            : `Sign up and get 20% off to your first order.`}{" "}
          <span className="underline cursor-pointer font-semibold">Sign Up Now</span>
          <button onClick={() => setAnnouncementVisible(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Main Navbar ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="sm:hidden p-1">
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link href={`/store/${slug}`} className="flex items-center gap-2 flex-shrink-0">
              {shop.logoUrl
                ? <img src={shop.logoUrl} alt={shop.name} className="h-8 w-auto object-contain" />
                : <span className="text-xl font-black tracking-tight text-black uppercase">{shop.name}</span>
              }
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden sm:flex items-center gap-6 ml-6">
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition-colors">
                  Shop <ChevronDown size={14} />
                </button>
                {categories.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    {categories.slice(0, 8).map(c => (
                      <Link key={c} href={`/store/${slug}/products`}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black first:rounded-t-xl last:rounded-b-xl">
                        {c}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link href={`/store/${slug}/products`} className="text-sm font-medium text-gray-700 hover:text-black transition-colors">On Sale</Link>
              <Link href={`/store/${slug}/products`} className="text-sm font-medium text-gray-700 hover:text-black transition-colors">New Arrivals</Link>
              <Link href={`/store/${slug}/products`} className="text-sm font-medium text-gray-700 hover:text-black transition-colors">Brands</Link>
            </nav>

            {/* Search bar */}
            <div className="flex-1 max-w-sm hidden sm:block">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="পণ্য খুঁজুন..."
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setSearchOpen(!searchOpen)} className="sm:hidden p-2 rounded-full hover:bg-gray-100">
                <Search size={20} />
              </button>
              <Link href={`/store/${slug}/wishlist`} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Heart size={20} />
                {wishItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishItems.length}
                  </span>
                )}
              </Link>
              <Link href={`/store/${slug}/cart`} className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-black text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              {/* Customer user menu */}
              <div className="relative" ref={userMenuRef}>
                {customer ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm hover:bg-gray-800 transition-colors"
                    >
                      {customer.avatar
                        ? <img src={customer.avatar} alt={customer.name} className="w-9 h-9 rounded-full object-cover" />
                        : customer.name.charAt(0).toUpperCase()
                      }
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-50">
                          <p className="font-semibold text-black text-sm truncate">{customer.name}</p>
                          <p className="text-gray-400 text-xs truncate">{customer.email}</p>
                        </div>
                        <div className="py-1">
                          <Link href={`/store/${slug}/account`}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black">
                            <User size={14} /> আমার প্রোফাইল
                          </Link>
                          <Link href={`/store/${slug}/orders`}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-black">
                            <Package size={14} /> আমার অর্ডার
                          </Link>
                        </div>
                        <div className="border-t border-gray-50 py-1">
                          <button
                            onClick={async () => { await signOut(); setUserMenuOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                          >
                            <LogOut size={14} /> সাইন আউট
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={`/store/${slug}/auth/signin`}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <User size={20} />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Mobile search */}
          {searchOpen && (
            <div className="sm:hidden pb-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2.5">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder="পণ্য খুঁজুন..." autoFocus
                  className="flex-1 bg-transparent text-sm outline-none" />
              </div>
            </div>
          )}

          {/* Mobile nav */}
          {mobileOpen && (
            <div className="sm:hidden pb-4 border-t border-gray-100 pt-3">
              <div className="flex flex-col gap-1">
                {[
                  { label: "হোম", href: `/store/${slug}` },
                  { label: "সব পণ্য", href: `/store/${slug}/products` },
                  { label: "অর্ডার ট্র্যাক", href: `/store/${slug}/orders` },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-2.5 text-sm font-medium text-gray-700 hover:text-black">
                    {l.label}
                  </Link>
                ))}
                {categories.slice(0, 5).map(c => (
                  <Link key={c} href={`/store/${slug}/products`}
                    onClick={() => setMobileOpen(false)}
                    className="block px-2 py-2 text-sm text-gray-500 hover:text-black pl-4">
                    {c}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
