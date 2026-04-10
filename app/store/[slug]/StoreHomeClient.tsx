"use client";

import { useState, useMemo, useEffect } from "react";
import { ShoppingBag, ChevronDown, ChevronUp, ArrowRight, Grid3X3, List } from "lucide-react";
import { DynamicHero } from "@/components/store/DynamicHero";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { useStoreTheme } from "@/components/store/ThemeProvider";

function ProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3.5 space-y-2.5">
        <div className="h-3 bg-gray-100 rounded-full w-16" />
        <div className="h-4 bg-gray-100 rounded-full w-4/5" />
        <div className="h-3 bg-gray-100 rounded-full w-3/5" />
        <div className="flex justify-between mt-1">
          <div className="h-5 bg-gray-100 rounded-full w-20" />
          <div className="h-5 bg-gray-100 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sellPrice: number;
  stockQty: number;
  imageUrl: string | null;
  images: unknown;
  hasVariants: boolean;
  storeVisible: boolean;
  storeFeatured: boolean;
}

interface Shop {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  storeSlug: string;
  storeBannerUrl: string | null;
  storeTagline: string | null;
  storeAbout: string | null;
  storePrimaryColor: string | null;
  storeAccentColor: string | null;
  storeTheme: string;
  storeFreeShipping: boolean | null;
  storeCODEnabled: boolean | null;
  storeBkashNumber: string | null;
  storeNagadNumber: string | null;
}

interface Props {
  shop: Shop;
  products: Product[];
  categories: string[];
  totalOrders: number;
}

const SORT_OPTIONS = [
  { value: "newest", label: "নতুন আগে" },
  { value: "price_asc", label: "কম দাম" },
  { value: "price_desc", label: "বেশি দাম" },
  { value: "featured", label: "জনপ্রিয়" },
];

const CATEGORY_ICONS: Record<string, string> = {
  পোশাক: "👗", ড্রেস: "👗", ফ্রক: "👗",
  জুতা: "👟", স্যান্ডেল: "👡",
  খাবার: "🍱", ফুড: "🍱",
  ইলেকট্রনিক্স: "📱", গ্যাজেট: "💻",
  বিউটি: "💄", কসমেটিক: "💄",
  গহনা: "💍", অ্যাক্সেসরিজ: "👜",
  শিশু: "🧸", বাচ্চা: "🧸",
  ঘর: "🏠", হোম: "🏠",
  বই: "📚",
  স্বাস্থ্য: "💊",
};

function getCategoryIcon(cat: string): string {
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "🏷️";
}

export function StoreHomeClient({ shop, products, categories, totalOrders }: Props) {
  const { primary } = useStoreTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");
  const [showAll, setShowAll] = useState(false);
  const [mounted, setMounted] = useState(false);
  const slug = shop.storeSlug;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const featured = products.filter(p => p.storeFeatured);

  const filtered = useMemo(() => {
    let list = [...products];
    if (selectedCategory) list = list.filter(p => p.category === selectedCategory);
    if (sort === "price_asc") list.sort((a, b) => a.sellPrice - b.sellPrice);
    else if (sort === "price_desc") list.sort((a, b) => b.sellPrice - a.sellPrice);
    else if (sort === "featured") list.sort((a, b) => (b.storeFeatured ? 1 : 0) - (a.storeFeatured ? 1 : 0));
    return list;
  }, [products, selectedCategory, sort]);

  const visible = showAll ? filtered : filtered.slice(0, 12);

  return (
    <div className="bg-gray-50 min-h-screen">
      <DynamicHero
        shop={shop}
        productCount={products.length}
        totalOrders={totalOrders}
      />

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">ক্যাটাগরি</h2>
              <p className="text-sm text-gray-500 mt-0.5">আপনার পছন্দের ক্যাটাগরি বেছে নিন</p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-medium text-sm"
              style={!selectedCategory ? {
                backgroundColor: primary + "12",
                borderColor: primary,
                color: primary,
              } : {
                backgroundColor: "#fff",
                borderColor: "#e5e7eb",
                color: "#6b7280",
              }}
            >
              <span className="text-2xl">🛍️</span>
              <span className="text-xs">সব পণ্য</span>
            </button>

            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-medium text-sm"
                style={selectedCategory === cat ? {
                  backgroundColor: primary + "12",
                  borderColor: primary,
                  color: primary,
                } : {
                  backgroundColor: "#fff",
                  borderColor: "#e5e7eb",
                  color: "#6b7280",
                }}
              >
                <span className="text-2xl">{getCategoryIcon(cat)}</span>
                <span className="text-xs leading-tight text-center">{cat}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && !selectedCategory && (
        <section className="max-w-7xl mx-auto px-4 pb-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">⭐ জনপ্রিয় পণ্য</h2>
              <p className="text-sm text-gray-500 mt-0.5">ক্রেতাদের পছন্দের পণ্যগুলো</p>
            </div>
            <a
              href={`/store/${slug}/products`}
              className="flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: primary }}
            >
              সব দেখুন <ArrowRight size={14} />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {featured.slice(0, 4).map(p => (
              <DynamicProductCard key={p.id} product={p} slug={slug} />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory ? selectedCategory : "🛒 সব পণ্য"}
              <span className="ml-2 text-base font-normal text-gray-400">({filtered.length})</span>
            </h2>
            {!selectedCategory && (
              <p className="text-sm text-gray-500 mt-0.5">আমাদের সম্পূর্ণ কালেকশন</p>
            )}
          </div>

          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none bg-white text-gray-700 cursor-pointer"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {!mounted ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <ShoppingBag size={52} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 font-medium">কোনো পণ্য পাওয়া যায়নি</p>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory(null)} className="mt-3 text-sm font-semibold underline" style={{ color: primary }}>
                সব পণ্য দেখুন
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {visible.map(p => <DynamicProductCard key={p.id} product={p} slug={slug} />)}
            </div>
            {filtered.length > 12 && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 font-bold text-sm transition-all hover:bg-gray-50"
                  style={{ borderColor: primary, color: primary }}
                >
                  {showAll
                    ? <><ChevronUp size={16} /> কম দেখুন</>
                    : <><ChevronDown size={16} /> আরো দেখুন ({filtered.length - 12}+ পণ্য)</>}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {shop.storeAbout && (
        <section className="bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: primary }}>
                  আমাদের সম্পর্কে
                </p>
                <h2 className="text-3xl font-black text-gray-900 mb-4">{shop.name}</h2>
                <p className="text-gray-600 leading-relaxed mb-6">{shop.storeAbout}</p>
                <a
                  href={`/store/${slug}/products`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: primary }}
                >
                  <ShoppingBag size={15} /> আমাদের পণ্য দেখুন
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: `${products.length}+`, label: "মোট পণ্য", icon: "📦" },
                  { value: `${totalOrders}+`, label: "সফল অর্ডার", icon: "✅" },
                  { value: "5.0⭐", label: "গড় রেটিং", icon: "⭐" },
                  { value: "24/7", label: "কাস্টমার সাপোর্ট", icon: "🤝" },
                ].map(({ value, label, icon }) => (
                  <div key={label} className="rounded-2xl p-5 text-center" style={{ backgroundColor: primary + "08", border: `1px solid ${primary}20` }}>
                    <p className="text-2xl mb-1">{icon}</p>
                    <p className="text-2xl font-black" style={{ color: primary }}>{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
