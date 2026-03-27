"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { useStoreTheme } from "@/components/store/ThemeProvider";
import { Search, SlidersHorizontal, X, Grid3X3, List, Tag } from "lucide-react";

interface Product {
  id: string; name: string; description: string | null; category: string | null;
  sellPrice: number; stockQty: number; imageUrl: string | null; images: unknown;
  hasVariants: boolean; storeVisible: boolean; storeFeatured: boolean;
}

interface Props {
  shop: { id: string; name: string; storeSlug: string; storeShowStock: boolean };
  products: Product[];
  categories: string[];
  initialQ?: string;
  initialCategory?: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "নতুন আগে" },
  { value: "price_asc", label: "কম দাম" },
  { value: "price_desc", label: "বেশি দাম" },
];

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border overflow-hidden animate-pulse" style={{ backgroundColor: "#F3F4F6" }}>
      <div className="aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export function ProductsPageClient({ shop, products, categories, initialQ, initialCategory }: Props) {
  const { primary, theme, defaults } = useStoreTheme();
  const [q, setQ] = useState(initialQ || "");
  const [category, setCategory] = useState(initialCategory || "");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "category">("grid");
  const [loading, setLoading] = useState(true);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const slug = shop.storeSlug;
  const text = defaults.text;
  const muted = defaults.muted;
  const border = defaults.border;
  const surface = defaults.surface;

  const cols = theme.layout.productGridCols;
  const gridClass =
    cols === 2 ? "grid grid-cols-2 gap-4" :
    cols === 4 ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" :
    "grid grid-cols-2 sm:grid-cols-3 gap-4";

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (q) list = list.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.description?.toLowerCase().includes(q.toLowerCase()));
    if (category) list = list.filter(p => p.category === category);
    if (minPrice) list = list.filter(p => p.sellPrice >= parseFloat(minPrice));
    if (maxPrice) list = list.filter(p => p.sellPrice <= parseFloat(maxPrice));
    if (sort === "price_asc") list.sort((a, b) => a.sellPrice - b.sellPrice);
    else if (sort === "price_desc") list.sort((a, b) => b.sellPrice - a.sellPrice);
    return list;
  }, [products, q, category, minPrice, maxPrice, sort]);

  const grouped = useMemo(() => {
    const map: Record<string, Product[]> = {};
    for (const p of filtered) {
      const key = p.category ?? "__other__";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    const catKeys = Object.keys(map).filter(k => k !== "__other__").sort();
    const groups: { cat: string; label: string; prods: Product[] }[] = catKeys.map(cat => ({ cat, label: cat, prods: map[cat] }));
    if (map["__other__"]) groups.push({ cat: "__other__", label: "অন্যান্য পণ্য", prods: map["__other__"] });
    return groups;
  }, [filtered]);

  function clearFilters() {
    setCategory(""); setMinPrice(""); setMaxPrice(""); setQ("");
  }

  const hasActiveFilters = !!category || !!minPrice || !!maxPrice || !!q;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Search + controls */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex-1 flex items-center gap-2 rounded-full border px-3 py-2 text-sm min-w-[180px]" style={{ borderColor: border, backgroundColor: surface }}>
          <Search size={14} style={{ color: muted }} />
          <input
            type="text" value={q} onChange={e => setQ(e.target.value)}
            placeholder="পণ্য খুঁজুন..." className="flex-1 bg-transparent outline-none text-sm" style={{ color: text }}
          />
          {q && <button onClick={() => setQ("")}><X size={13} style={{ color: muted }} /></button>}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="text-sm border rounded-xl px-3 py-2 outline-none" style={{ borderColor: border, backgroundColor: surface, color: text }}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Grid/List/Category toggle */}
        <div className="flex border rounded-xl overflow-hidden" style={{ borderColor: border }}>
          <button onClick={() => setViewMode("grid")}
            className="px-3 py-2"
            style={{ backgroundColor: viewMode === "grid" ? primary : surface, color: viewMode === "grid" ? "white" : muted }}>
            <Grid3X3 size={14} />
          </button>
          <button onClick={() => setViewMode("list")}
            className="px-3 py-2 border-x" style={{ borderColor: border, backgroundColor: viewMode === "list" ? primary : surface, color: viewMode === "list" ? "white" : muted }}>
            <List size={14} />
          </button>
          <button onClick={() => setViewMode("category")}
            className="px-3 py-2"
            style={{ backgroundColor: viewMode === "category" ? primary : surface, color: viewMode === "category" ? "white" : muted }}>
            <Tag size={14} />
          </button>
        </div>

        {/* Filter button */}
        <button onClick={() => setFilterOpen(!filterOpen)}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border font-medium"
          style={{ borderColor: filterOpen ? primary : border, color: filterOpen ? primary : muted }}>
          <SlidersHorizontal size={14} />
          ফিল্টার
          {hasActiveFilters && <span className="w-2 h-2 rounded-full ml-0.5" style={{ backgroundColor: primary }} />}
        </button>
      </div>

      {/* Filter panel — desktop inline */}
      {filterOpen && (
        <div ref={filterPanelRef} className="mb-4 p-4 rounded-2xl border hidden sm:block" style={{ borderColor: border, backgroundColor: surface }}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>ক্যাটাগরি</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full text-sm border rounded-xl px-3 py-2 outline-none" style={{ borderColor: border, backgroundColor: defaults.bg, color: text }}>
                <option value="">সব ক্যাটাগরি</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>ন্যূনতম দাম (৳)</label>
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="০"
                className="w-full text-sm border rounded-xl px-3 py-2 outline-none" style={{ borderColor: border, backgroundColor: defaults.bg, color: text }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>সর্বোচ্চ দাম (৳)</label>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="∞"
                className="w-full text-sm border rounded-xl px-3 py-2 outline-none" style={{ borderColor: border, backgroundColor: defaults.bg, color: text }} />
            </div>
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-3 text-xs underline" style={{ color: muted }}>সব ফিল্টার মুছুন</button>
          )}
        </div>
      )}

      {/* Mobile bottom-sheet filter */}
      {filterOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="relative rounded-t-3xl p-5 space-y-4" style={{ backgroundColor: defaults.bg, maxHeight: "80vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-base" style={{ color: text }}>ফিল্টার</p>
              <button onClick={() => setFilterOpen(false)}>
                <X size={20} style={{ color: muted }} />
              </button>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>ক্যাটাগরি</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: border, backgroundColor: surface, color: text }}>
                <option value="">সব ক্যাটাগরি</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>ন্যূনতম দাম</label>
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="০"
                  className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: border, backgroundColor: surface, color: text }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: muted }}>সর্বোচ্চ দাম</label>
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="∞"
                  className="w-full text-sm border rounded-xl px-3 py-2.5 outline-none" style={{ borderColor: border, backgroundColor: surface, color: text }} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex-1 py-3 rounded-xl border text-sm font-semibold" style={{ borderColor: border, color: muted }}>
                  মুছুন
                </button>
              )}
              <button onClick={() => setFilterOpen(false)}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold"
                style={{ backgroundColor: primary }}>
                প্রয়োগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button onClick={() => setCategory("")}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border"
            style={{ backgroundColor: !category ? primary : "transparent", color: !category ? "white" : muted, borderColor: !category ? primary : border }}>
            সব
          </button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c === category ? "" : c)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border"
              style={{ backgroundColor: category === c ? primary : "transparent", color: category === c ? "white" : muted, borderColor: category === c ? primary : border }}>
              {c}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm mb-4" style={{ color: muted }}>{filtered.length}টি পণ্য</p>

      {loading ? (
        <div className={viewMode === "grid" ? gridClass : "flex flex-col gap-3"}>
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: muted }}>
          <p className="text-lg font-semibold mb-2">কোনো পণ্য পাওয়া যায়নি।</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm underline" style={{ color: primary }}>ফিল্টার সরিয়ে দেখুন</button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className={gridClass}>
          {filtered.map(p => <DynamicProductCard key={p.id} product={p} slug={slug} />)}
        </div>
      ) : viewMode === "list" ? (
        <div className="flex flex-col gap-3">
          {filtered.map(p => (
            <a key={p.id} href={`/store/${slug}/products/${p.id}`}
              className="flex gap-4 p-3 rounded-2xl border items-center"
              style={{ borderColor: border, backgroundColor: surface }}>
              <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden" style={{ backgroundColor: defaults.bg }}>
                {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: defaults.surface }}>
                    <span style={{ color: muted, fontSize: 20 }}>📦</span>
                  </div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: text }}>{p.name}</p>
                {p.category && <p className="text-xs" style={{ color: muted }}>{p.category}</p>}
                {p.description && <p className="text-xs truncate mt-0.5" style={{ color: muted }}>{p.description}</p>}
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="font-bold text-sm" style={{ color: primary }}>৳{p.sellPrice.toLocaleString()}</p>
                {!p.hasVariants && p.stockQty > 0 && <p className="text-[10px] text-green-600">স্টক আছে</p>}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(group => (
            <div key={group.cat}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-base shrink-0" style={{ color: text }}>{group.label}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: primary + "18", color: primary }}>
                  {group.prods.length}টি পণ্য
                </span>
                <div className="flex-1 h-px" style={{ backgroundColor: border }} />
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                {group.prods.map(p => (
                  <div key={p.id} className="flex-shrink-0 w-44">
                    <DynamicProductCard product={p} slug={slug} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
