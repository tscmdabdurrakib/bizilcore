"use client";

import Link from "next/link";
import { Facebook, Instagram, MessageCircle, Phone } from "lucide-react";
import { useStoreTheme } from "./ThemeProvider";

interface StoreShop {
  name: string;
  phone: string | null;
  storeSlug: string;
  storeSocialFB: string | null;
  storeSocialIG: string | null;
  storeSocialWA: string | null;
  storeAbout: string | null;
}

interface Props {
  shop: StoreShop;
}

function SocialIcons({ shop }: { shop: StoreShop }) {
  return (
    <div className="flex gap-3">
      {shop.storeSocialFB && (
        <a href={shop.storeSocialFB} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "#1877F2" }}>
          <Facebook size={16} />
        </a>
      )}
      {shop.storeSocialIG && (
        <a href={shop.storeSocialIG} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)" }}>
          <Instagram size={16} />
        </a>
      )}
      {shop.storeSocialWA && (
        <a href={`https://wa.me/${shop.storeSocialWA}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "#25D366" }}>
          <MessageCircle size={16} />
        </a>
      )}
    </div>
  );
}

function MinimalFooter({ shop }: Props) {
  const { defaults, primary } = useStoreTheme();
  return (
    <footer className="mt-16 border-t" style={{ backgroundColor: defaults.bg, borderColor: defaults.border }}>
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-bold text-base" style={{ color: defaults.text }}>{shop.name}</span>
          {shop.phone && (
            <span className="flex items-center gap-1 text-sm" style={{ color: defaults.muted }}>
              <Phone size={13} /> {shop.phone}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <SocialIcons shop={shop} />
          <span className="text-xs" style={{ color: defaults.muted }}>
            © {new Date().getFullYear()} {shop.name}
          </span>
        </div>
      </div>
    </footer>
  );
}

function ColumnsFooter({ shop }: Props) {
  const { defaults } = useStoreTheme();
  const text = defaults.text;
  const muted = defaults.muted;
  const border = defaults.border;
  const bg = defaults.surface;

  return (
    <footer className="mt-16 border-t" style={{ backgroundColor: bg, borderColor: border }}>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <p className="font-bold text-lg mb-2" style={{ color: text }}>{shop.name}</p>
            {shop.storeAbout && (
              <p className="text-sm leading-relaxed" style={{ color: muted }}>{shop.storeAbout}</p>
            )}
            {shop.phone && (
              <div className="flex items-center gap-2 mt-3 text-sm" style={{ color: muted }}>
                <Phone size={14} /> {shop.phone}
              </div>
            )}
          </div>

          <div>
            <p className="font-semibold mb-3 text-sm" style={{ color: text }}>লিংক</p>
            <nav className="space-y-2 text-sm" style={{ color: muted }}>
              <div><Link href={`/store/${shop.storeSlug}`} className="hover:underline">হোম</Link></div>
              <div><Link href={`/store/${shop.storeSlug}/products`} className="hover:underline">সব পণ্য</Link></div>
              <div><Link href={`/store/${shop.storeSlug}/cart`} className="hover:underline">কার্ট</Link></div>
              <div><Link href={`/store/${shop.storeSlug}/track`} className="hover:underline">অর্ডার ট্র্যাক</Link></div>
            </nav>
          </div>

          <div>
            <p className="font-semibold mb-3 text-sm" style={{ color: text }}>সোশ্যাল মিডিয়া</p>
            <SocialIcons shop={shop} />
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex items-center justify-between text-xs" style={{ borderColor: border, color: muted }}>
          <span>© {new Date().getFullYear()} {shop.name}</span>
          <a href="https://bizilcore.com" target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
            Powered by BizilCore
          </a>
        </div>
      </div>
    </footer>
  );
}

function DarkFullFooter({ shop }: Props) {
  const { primary } = useStoreTheme();

  return (
    <footer className="mt-16" style={{ backgroundColor: "#0f172a" }}>
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 mb-10">
          <div className="sm:col-span-2">
            <p className="font-bold text-xl mb-3 text-white">{shop.name}</p>
            {shop.storeAbout && (
              <p className="text-sm leading-relaxed text-white/60 max-w-xs">{shop.storeAbout}</p>
            )}
            <div className="flex gap-3 mt-5">
              <SocialIcons shop={shop} />
            </div>
          </div>

          <div>
            <p className="font-semibold mb-4 text-sm uppercase tracking-widest text-white/40">শপ</p>
            <nav className="space-y-3 text-sm text-white/70">
              <div><Link href={`/store/${shop.storeSlug}`} className="hover:text-white transition-colors">হোম</Link></div>
              <div><Link href={`/store/${shop.storeSlug}/products`} className="hover:text-white transition-colors">সব পণ্য</Link></div>
              <div><Link href={`/store/${shop.storeSlug}/cart`} className="hover:text-white transition-colors">কার্ট</Link></div>
              <div><Link href={`/store/${shop.storeSlug}/track`} className="hover:text-white transition-colors">ট্র্যাক</Link></div>
            </nav>
          </div>

          <div>
            <p className="font-semibold mb-4 text-sm uppercase tracking-widest text-white/40">যোগাযোগ</p>
            <div className="space-y-3 text-sm text-white/70">
              {shop.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} style={{ color: primary }} /> {shop.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <span>© {new Date().getFullYear()} {shop.name}. সর্বস্বত্ব সংরক্ষিত।</span>
          <a href="https://bizilcore.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">
            Powered by BizilCore
          </a>
        </div>
      </div>
    </footer>
  );
}

export function StoreFooter({ shop }: Props) {
  const { theme } = useStoreTheme();
  const footerStyle = theme.layout.footerStyle;

  if (footerStyle === "minimal") {
    return <MinimalFooter shop={shop} />;
  }
  if (footerStyle === "dark_full") {
    return <DarkFullFooter shop={shop} />;
  }
  return <ColumnsFooter shop={shop} />;
}
