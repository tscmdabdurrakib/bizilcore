"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ShoppingBag, X, Phone, Tag, MessageCircle, Star, ChevronRight, Package, Share2, ArrowUp } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sellPrice: number;
  stockQty: number;
  imageUrl: string | null;
  hasVariants: boolean;
}

interface Shop {
  name: string;
  phone: string | null;
  category: string | null;
  logoUrl: string | null;
  tagline: string | null;
}

const P = "#0F6E56";
const P_DARK = "#0A5240";
const P_LIGHT = "#E6F5F0";
const WA = "#25D366";
const BG = "#F8F8F6";
const CARD = "#FFFFFF";
const TEXT = "#1A1A1A";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

function formatBDT(n: number) {
  return `৳${n.toLocaleString("bn-BD")}`;
}

function getWaPhone(phone: string | null) {
  if (!phone) return "";
  const p = phone.replace(/\D/g, "");
  if (p.startsWith("880")) return p;
  if (p.startsWith("0")) return `88${p}`;
  return `880${p}`;
}

function ShopInitial({ name }: { name: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl" style={{ background: `linear-gradient(135deg, ${P} 0%, ${P_DARK} 100%)` }}>
      {name[0]?.toUpperCase() ?? "S"}
    </div>
  );
}

function ProductPlaceholder({ name }: { name: string }) {
  const colors = ["#0F6E56","#6366F1","#F59E0B","#EC4899","#3B82F6","#8B5CF6","#EF4444","#14B8A6"];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ backgroundColor: colors[idx] + "18" }}>
      <Package size={32} style={{ color: colors[idx] }} />
      <span className="text-xs font-medium text-center px-2 leading-tight" style={{ color: colors[idx] }}>{name.slice(0, 20)}</span>
    </div>
  );
}

function ProductModal({
  product,
  shopPhone,
  shopName,
  onClose,
}: {
  product: Product;
  shopPhone: string | null;
  shopName: string;
  onClose: () => void;
}) {
  const outOfStock = product.stockQty === 0;

  function orderWA() {
    const waPhone = getWaPhone(shopPhone);
    const msg = `আমি "${product.name}" কিনতে চাই।\nদাম: ${formatBDT(product.sellPrice)}\n\n${shopName} এর পেজ থেকে অর্ডার করছি।`;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function callShop() {
    if (shopPhone) window.open(`tel:${shopPhone}`, "_self");
  }

  async function shareProduct() {
    if (navigator.share) {
      await navigator.share({ title: product.name, text: `${shopName} থেকে "${product.name}" দেখুন — ${formatBDT(product.sellPrice)}`, url: window.location.href }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gray-50" style={{ aspectRatio: "1/1", maxHeight: "45dvh", overflow: "hidden" }}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <ProductPlaceholder name={product.name} />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <X size={18} style={{ color: TEXT }} />
          </button>
          {outOfStock && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-white text-xs font-bold shadow" style={{ backgroundColor: "#EF4444" }}>
              স্টক নেই
            </div>
          )}
          <button
            onClick={shareProduct}
            className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
          >
            <Share2 size={15} style={{ color: TEXT }} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto" style={{ maxHeight: "47dvh" }}>
          {product.category && (
            <div className="flex items-center gap-1 mb-2">
              <Tag size={11} style={{ color: P }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: P }}>{product.category}</span>
            </div>
          )}
          <h3 className="font-black text-xl leading-tight mb-2" style={{ color: TEXT }}>{product.name}</h3>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-black" style={{ color: P }}>{formatBDT(product.sellPrice)}</span>
            {!outOfStock && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#DCFCE7", color: "#15803D" }}>
                স্টকে আছে
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: MUTED }}>{product.description}</p>
          )}

          {product.hasVariants && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ backgroundColor: "#FEF9C3" }}>
              <Star size={13} color="#D97706" />
              <p className="text-xs font-medium" style={{ color: "#92600A" }}>এই পণ্যের একাধিক রঙ/সাইজ আছে। অর্ডারের সময় পছন্দ জানান।</p>
            </div>
          )}

          <div className="space-y-2.5">
            {!outOfStock && shopPhone && (
              <button
                onClick={orderWA}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                style={{ backgroundColor: WA, boxShadow: `0 4px 14px ${WA}44` }}
              >
                <MessageCircle size={18} />
                WhatsApp-এ অর্ডার করুন
              </button>
            )}
            {shopPhone && (
              <button
                onClick={callShop}
                className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 transition-all active:scale-95"
                style={{ borderColor: P, color: P }}
              >
                <Phone size={16} />
                সরাসরি কল করুন
              </button>
            )}
            {outOfStock && (
              <div className="py-3 text-center rounded-2xl" style={{ backgroundColor: "#FEF2F2" }}>
                <p className="text-sm font-medium" style={{ color: "#DC2626" }}>এই পণ্যটি এখন স্টকে নেই</p>
                {shopPhone && <p className="text-xs mt-0.5" style={{ color: MUTED }}>স্টক পেতে কল করুন বা WhatsApp করুন</p>}
              </div>
            )}
            {!shopPhone && !outOfStock && (
              <p className="text-center text-xs py-3" style={{ color: MUTED }}>অর্ডার করতে এই পেজের লিঙ্ক শেয়ার করুন।</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const outOfStock = product.stockQty === 0;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-left rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        backgroundColor: CARD,
        opacity: outOfStock ? 0.7 : 1,
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      <div className="relative bg-gray-50" style={{ aspectRatio: "3/4", overflow: "hidden" }}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300"
            style={{ transform: hovered ? "scale(1.04)" : "scale(1)" }}
            loading="lazy"
          />
        ) : (
          <ProductPlaceholder name={product.name} />
        )}
        {outOfStock && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-xs font-bold" style={{ backgroundColor: "#EF4444" }}>
            স্টক নেই
          </div>
        )}
        {!outOfStock && product.stockQty <= 5 && product.stockQty > 0 && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-xs font-bold" style={{ backgroundColor: "#F59E0B" }}>
            শেষ হচ্ছে!
          </div>
        )}
      </div>

      <div className="p-3">
        {product.category && (
          <p className="text-xs font-medium mb-0.5 truncate" style={{ color: P }}>{product.category}</p>
        )}
        <p className="text-xs font-semibold leading-snug line-clamp-2 mb-2" style={{ color: TEXT }}>{product.name}</p>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="font-black text-sm" style={{ color: P }}>{formatBDT(product.sellPrice)}</span>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-xl transition-all"
            style={{ backgroundColor: outOfStock ? "#F3F4F6" : P, flexShrink: 0 }}
          >
            <span className="text-xs font-bold" style={{ color: outOfStock ? MUTED : "white" }}>
              {outOfStock ? "নেই" : "অর্ডার"}
            </span>
            <ChevronRight size={11} color={outOfStock ? MUTED : "white"} />
          </div>
        </div>
      </div>
    </button>
  );
}

export default function CatalogPageClient({
  shop,
  products,
}: {
  shop: Shop;
  products: Product[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    function onScroll() { setShowScrollTop(window.scrollY > 400); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]));
    return cats;
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.category) counts[p.category] = (counts[p.category] ?? 0) + 1;
    }
    return counts;
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = !activeCategory || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, activeCategory]);

  const inStockCount = products.filter((p) => p.stockQty > 0).length;

  function contactWA() {
    const waPhone = getWaPhone(shop.phone);
    const msg = `হ্যালো! ${shop.name} এর পণ্য সম্পর্কে জানতে চাই।`;
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div
      id="catalog-root"
      className="min-h-screen"
      style={{ backgroundColor: BG }}
    >
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          shopPhone={shop.phone}
          shopName={shop.name}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-4 z-40 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all"
          style={{ backgroundColor: P }}
        >
          <ArrowUp size={18} color="white" />
        </button>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40" style={{ background: `linear-gradient(135deg, ${P} 0%, ${P_DARK} 100%)` }}>
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-md" style={{ border: "2px solid rgba(255,255,255,0.3)" }}>
            {shop.logoUrl ? (
              <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <ShopInitial name={shop.name} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-black text-base leading-tight truncate">{shop.name}</h1>
            {shop.category && <p className="text-white/70 text-xs">{shop.category}</p>}
            {shop.tagline && !shop.category && <p className="text-white/70 text-xs truncate">{shop.tagline}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {shop.phone && (
              <button
                onClick={() => window.open(`tel:${shop.phone}`, "_self")}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <Phone size={16} color="white" />
              </button>
            )}
            {shop.phone && (
              <button
                onClick={contactWA}
                className="flex items-center gap-1.5 px-3 h-9 rounded-xl text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: WA }}
              >
                <MessageCircle size={14} />
                <span className="hidden sm:inline">WhatsApp</span>
                <span className="sm:hidden">Chat</span>
              </button>
            )}
          </div>
        </div>
        {shop.tagline && shop.category && (
          <div className="pb-2 px-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-white/80 text-xs max-w-5xl mx-auto pt-2 truncate">{shop.tagline}</p>
          </div>
        )}
      </header>

      {/* Hero band */}
      <div style={{ background: `linear-gradient(180deg, ${P_DARK} 0%, ${BG} 100%)`, paddingBottom: "0" }}>
        <div className="max-w-5xl mx-auto px-4 pt-5 pb-7">
          <div className="flex items-center gap-6 mb-5">
            {[
              { label: "পণ্য", value: products.length },
              { label: "স্টকে আছে", value: inStockCount },
              { label: "ক্যাটাগরি", value: categories.length },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-white font-black text-2xl leading-none">{s.value}</p>
                <p className="text-white/70 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
            <input
              type="text"
              placeholder="পণ্যের নাম বা ক্যাটাগরি দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-12 rounded-2xl text-sm outline-none shadow-md"
              style={{ borderColor: "transparent", backgroundColor: CARD, color: TEXT }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X size={15} style={{ color: MUTED }} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12 space-y-4 -mt-2">
        {/* Category filters */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all"
              style={
                !activeCategory
                  ? { backgroundColor: P, color: "white", borderColor: P }
                  : { backgroundColor: CARD, color: TEXT, borderColor: BORDER }
              }
            >
              সব
              <span className="text-[10px] opacity-70">({products.length})</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border-2 transition-all"
                style={
                  activeCategory === cat
                    ? { backgroundColor: P, color: "white", borderColor: P }
                    : { backgroundColor: CARD, color: TEXT, borderColor: BORDER }
                }
              >
                {cat}
                <span className="text-[10px] opacity-70">({categoryCounts[cat] ?? 0})</span>
              </button>
            ))}
          </div>
        )}

        {/* Results info */}
        {(search || activeCategory) && (
          <p className="text-xs" style={{ color: MUTED }}>
            {filtered.length === 0 ? "কোনো পণ্য পাওয়া যায়নি" : `${filtered.length}টি পণ্য পাওয়া গেছে`}
            {search && ` "${search}" এর জন্য`}
            {activeCategory && ` · ${activeCategory}`}
          </p>
        )}

        {/* Product grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 rounded-3xl" style={{ backgroundColor: CARD }}>
            <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: P_LIGHT }}>
              <ShoppingBag size={32} style={{ color: P }} />
            </div>
            <p className="font-bold text-base mb-1" style={{ color: TEXT }}>কোনো পণ্য পাওয়া যায়নি</p>
            <p className="text-sm" style={{ color: MUTED }}>অন্য কিছু দিয়ে খুঁজে দেখুন</p>
            {(search || activeCategory) && (
              <button
                onClick={() => { setSearch(""); setActiveCategory(null); }}
                className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: P }}
              >
                সব পণ্য দেখুন
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-8 pb-4 text-center border-t" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-center gap-2 mb-3">
            {shop.phone && (
              <button
                onClick={contactWA}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
                style={{ backgroundColor: "#DCFCE7", color: "#15803D" }}
              >
                <MessageCircle size={12} /> WhatsApp করুন
              </button>
            )}
            {shop.phone && (
              <button
                onClick={() => window.open(`tel:${shop.phone}`, "_self")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
                style={{ backgroundColor: P_LIGHT, color: P }}
              >
                <Phone size={12} /> কল করুন
              </button>
            )}
          </div>
          <p className="text-xs" style={{ color: MUTED }}>Powered by</p>
          <p className="text-xs font-black mt-0.5" style={{ color: P }}>BizilCore</p>
          <p className="text-xs mt-1" style={{ color: "#D1D5DB" }}>bizilcore.com</p>
        </div>
      </div>
    </div>
  );
}
