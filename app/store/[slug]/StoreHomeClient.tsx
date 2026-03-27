"use client";

import { useState, useMemo, useEffect } from "react";
import { ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { DynamicHero } from "@/components/store/DynamicHero";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { useStoreTheme } from "@/components/store/ThemeProvider";

function ProductCardSkeleton({ cardStyle }: { cardStyle: string }) {
  if (cardStyle === "image_overlay") {
    return (
      <div className="animate-pulse overflow-hidden" style={{ aspectRatio: "2/3", backgroundColor: "#E5E7EB" }} />
    );
  }
  return (
    <div className="rounded-xl overflow-hidden border animate-pulse" style={{ backgroundColor: "#F3F4F6" }}>
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
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

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
};

export function StoreHomeClient({ shop, products, categories, totalOrders }: Props) {
  const { primary, theme, defaults } = useStoreTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sort, setSort] = useState("newest");
  const [showAll, setShowAll] = useState(false);
  const [mounted, setMounted] = useState(false);
  const slug = shop.storeSlug;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
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

  const distinctCategoriesInFiltered = useMemo(() => {
    const cats = new Set<string>();
    for (const p of filtered) {
      if (p.category) cats.add(p.category);
    }
    return [...cats].sort();
  }, [filtered]);

  const showGrouped = !selectedCategory && distinctCategoriesInFiltered.length > 2;

  const groupedProducts = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const p of filtered) {
      const key = p.category ?? "__other__";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    const groups: { cat: string; label: string; prods: Product[] }[] = [];
    for (const cat of distinctCategoriesInFiltered) {
      if (map[cat]) groups.push({ cat, label: cat, prods: map[cat] });
    }
    if (map["__other__"]) {
      groups.push({ cat: "__other__", label: "অন্যান্য পণ্য", prods: map["__other__"] });
    }
    return groups;
  }, [filtered, distinctCategoriesInFiltered]);

  const surface = defaults.surface;
  const text = defaults.text;
  const muted = defaults.muted;
  const border = defaults.border;
  const bg = defaults.bg;

  const cardStyle = theme.layout.productCardStyle;
  const gridCols = theme.layout.productGridCols;
  const colsClass = GRID_COLS[gridCols] ?? GRID_COLS[3];
  const sectionOrder = theme.layout.sectionOrder;

  const SECTIONS: Record<string, React.ReactNode> = {
    hero: (
      <DynamicHero shop={shop} />
    ),

    categories: categories.length > 0 ? (
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all"
            style={{
              backgroundColor: !selectedCategory ? primary : "transparent",
              color: !selectedCategory ? "white" : muted,
              borderColor: !selectedCategory ? primary : border,
            }}
          >
            সব পণ্য
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all"
              style={{
                backgroundColor: selectedCategory === cat ? primary : "transparent",
                color: selectedCategory === cat ? "white" : muted,
                borderColor: selectedCategory === cat ? primary : border,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    ) : null,

    featured: featured.length > 0 && !selectedCategory ? (
      <div className="max-w-6xl mx-auto px-4 mt-10">
        <h2 className="text-lg font-bold mb-4" style={{ color: text }}>জনপ্রিয় পণ্য</h2>
        <div className={`grid ${colsClass} gap-4`}>
          {featured.slice(0, gridCols).map(p => (
            <DynamicProductCard key={p.id} product={p} slug={slug} />
          ))}
        </div>
      </div>
    ) : null,

    all_products: (
      <div className="max-w-6xl mx-auto px-4 mt-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-lg font-bold" style={{ color: text }}>
            {selectedCategory ? selectedCategory : "সব পণ্য"}
            <span className="ml-2 text-sm font-normal" style={{ color: muted }}>({filtered.length})</span>
          </h2>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm border rounded-xl px-3 py-1.5 outline-none"
            style={{ borderColor: border, backgroundColor: surface, color: text }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {!mounted ? (
          <div className={`grid ${colsClass} gap-4`}>
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} cardStyle={cardStyle} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag size={48} style={{ color: muted, margin: "0 auto 12px" }} />
            <p style={{ color: muted }}>কোনো পণ্য পাওয়া যায়নি</p>
          </div>
        ) : showGrouped ? (
          <div className="space-y-10">
            {groupedProducts.map(group => (
              <div key={group.cat}>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-bold text-base shrink-0" style={{ color: text }}>{group.label}</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: primary + "18", color: primary }}>
                    {group.prods.length}টি পণ্য
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: border }} />
                </div>
                <div className={`grid ${colsClass} gap-4`}>
                  {group.prods.slice(0, gridCols * 2).map(p => (
                    <DynamicProductCard key={p.id} product={p} slug={slug} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={`grid ${colsClass} gap-4`}>
              {visible.map(p => <DynamicProductCard key={p.id} product={p} slug={slug} />)}
            </div>
            {filtered.length > 12 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border font-semibold text-sm"
                  style={{ borderColor: primary, color: primary }}
                >
                  {showAll ? <><ChevronUp size={16} /> কম দেখুন</> : <><ChevronDown size={16} /> আরো দেখুন ({filtered.length - 12}+)</>}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    ),

    about: shop.storeAbout ? (
      <div className="max-w-6xl mx-auto px-4 mt-16">
        <section className="py-10 rounded-2xl px-6 text-center" style={{ backgroundColor: surface, border: `1px solid ${border}` }}>
          <h2 className="text-lg font-bold mb-3" style={{ color: text }}>আমাদের সম্পর্কে</h2>
          <p className="text-sm leading-relaxed max-w-xl mx-auto mb-6" style={{ color: muted }}>{shop.storeAbout}</p>
          <div className="flex justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: primary }}>{products.length}+</p>
              <p className="text-xs" style={{ color: muted }}>মোট পণ্য</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: primary }}>{totalOrders}+</p>
              <p className="text-xs" style={{ color: muted }}>সন্তুষ্ট ক্রেতা</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: primary }}>⭐</p>
              <p className="text-xs" style={{ color: muted }}>বিশ্বস্ত স্টোর</p>
            </div>
          </div>
        </section>
      </div>
    ) : null,
  };

  return (
    <div style={{ backgroundColor: bg }}>
      {sectionOrder.map(section => {
        const node = SECTIONS[section];
        if (!node) return null;
        return <div key={section}>{node}</div>;
      })}
      <div className="h-10" />
    </div>
  );
}
