"use client";

import Link from "next/link";
import { Facebook, Instagram, MessageCircle, Phone, Mail, MapPin, Truck, Shield, RotateCcw, Clock } from "lucide-react";
import { useStoreTheme } from "./ThemeProvider";

interface StoreShop {
  name: string;
  phone: string | null;
  storeSlug: string;
  storeSocialFB: string | null;
  storeSocialIG: string | null;
  storeSocialWA: string | null;
  storeAbout: string | null;
  storeFreeShipping: boolean | null;
  storeCODEnabled: boolean | null;
  storeBkashNumber: string | null;
  storeNagadNumber: string | null;
}

interface Props {
  shop: StoreShop;
}

const FOOTER_FEATURES = [
  { icon: Truck, label: "দ্রুত ডেলিভারি", sub: "সারা বাংলাদেশে" },
  { icon: Shield, label: "নিরাপদ পেমেন্ট", sub: "১০০% সুরক্ষিত" },
  { icon: RotateCcw, label: "সহজ রিটার্ন", sub: "সমস্যা হলে ফেরত" },
  { icon: Clock, label: "২৪/৭ সাপোর্ট", sub: "সবসময় পাশে আছি" },
];

export function StoreFooter({ shop }: Props) {
  const { primary } = useStoreTheme();
  const slug = shop.storeSlug;
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: "#111827" }}>
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {FOOTER_FEATURES.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primary + "25" }}>
                  <Icon size={18} style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-white/50 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <p className="text-xl font-black text-white mb-3">{shop.name}</p>
            {shop.storeAbout && (
              <p className="text-sm text-white/55 leading-relaxed mb-5 max-w-xs">
                {shop.storeAbout}
              </p>
            )}

            <div className="flex gap-3 mb-5">
              {shop.storeSocialFB && (
                <a href={shop.storeSocialFB} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#1877F2" }}>
                  <Facebook size={16} />
                </a>
              )}
              {shop.storeSocialIG && (
                <a href={shop.storeSocialIG} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
                  style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
                  <Instagram size={16} />
                </a>
              )}
              {shop.storeSocialWA && (
                <a href={`https://wa.me/${shop.storeSocialWA}`} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#25D366" }}>
                  <MessageCircle size={16} />
                </a>
              )}
            </div>

            <div className="space-y-2">
              {shop.phone && (
                <a href={`tel:${shop.phone}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                  <Phone size={13} style={{ color: primary }} /> {shop.phone}
                </a>
              )}
              {shop.storeSocialWA && (
                <a href={`https://wa.me/${shop.storeSocialWA}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                  <MessageCircle size={13} style={{ color: "#25D366" }} /> WhatsApp: {shop.storeSocialWA}
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">শপ</p>
            <nav className="space-y-3">
              {[
                { href: `/store/${slug}`, label: "হোম" },
                { href: `/store/${slug}/products`, label: "সব পণ্য" },
                { href: `/store/${slug}/cart`, label: "কার্ট" },
                { href: `/store/${slug}/track`, label: "অর্ডার ট্র্যাক" },
              ].map(({ href, label }) => (
                <div key={href}>
                  <Link href={href} className="text-sm text-white/60 hover:text-white transition-colors">
                    {label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">পেমেন্ট</p>
            <div className="space-y-3">
              {shop.storeCODEnabled && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span className="w-7 h-5 rounded bg-white/10 flex items-center justify-center text-xs">💵</span>
                  ক্যাশ অন ডেলিভারি
                </div>
              )}
              {shop.storeBkashNumber && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span className="w-7 h-5 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#E2136E", color: "#fff" }}>b</span>
                  বিকাশ
                </div>
              )}
              {shop.storeNagadNumber && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <span className="w-7 h-5 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#F7941D", color: "#fff" }}>N</span>
                  নগদ
                </div>
              )}
              {!shop.storeCODEnabled && !shop.storeBkashNumber && !shop.storeNagadNumber && (
                <p className="text-sm text-white/40">যোগাযোগ করুন</p>
              )}
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mt-6 mb-4">ডেলিভারি</p>
            <div className="space-y-2 text-sm text-white/60">
              {shop.storeFreeShipping ? (
                <div className="flex items-center gap-2">
                  <Truck size={13} style={{ color: primary }} /> ফ্রি ডেলিভারি
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Truck size={13} style={{ color: primary }} /> দ্রুত ডেলিভারি
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {year} {shop.name}. সর্বস্বত্ব সংরক্ষিত।
          </p>
          <a
            href="https://bizilcore.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/25 hover:text-white/50 transition-colors"
          >
            Powered by BizilCore
          </a>
        </div>
      </div>
    </footer>
  );
}
