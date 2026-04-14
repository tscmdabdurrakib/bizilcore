"use client";

import { useState, useMemo, useEffect } from "react";
import { DynamicProductCard } from "@/components/store/DynamicProductCard";
import { ChevronDown, ChevronUp, SlidersHorizontal, X, Check } from "lucide-react";

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
  { value: "newest",     label: "Most Popular" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc",   label: "Name: A–Z" },
];

const COLORS = [
  { name: "Green",  hex: "#00C12B" },
  { name: "Red",    hex: "#F50606" },
  { name: "Yellow", hex: "#F5DD06" },
  { name: "Orange", hex: "#F57906" },
  { name: "Cyan",   hex: "#06CAF5" },
  { name: "Blue",   hex: "#063AF5" },
  { name: "Purple", hex: "#7D06F5" },
  { name: "Pink",   hex: "#F506A4" },
  { name: "White",  hex: "#FFFFFF" },
  { name: "Black",  hex: "#000000" },
];

const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

const ITEMS_PER_PAGE = 9;

function FilterSection({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200 py-4">
      <button
        className="w-full flex items-center justify-between text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-black text-sm">{title}</span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function ProductsPageClient({ shop, products, categories, initialQ, initialCategory }: Props) {
  const slug = shop.storeSlug;

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Price range from products
  const allPrices = products.map(p => p.sellPrice);
  const priceMin = allPrices.length ? Math.min(...allPrices) : 0;
  const priceMax = allPrices.length ? Math.max(...allPrices) : 10000;

  useEffect(() => {
    setMinPrice(priceMin);
    setMaxPrice(priceMax);
  }, [priceMin, priceMax]);

  function toggleCategory(cat: string) {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setPage(1);
  }

  function toggleColor(color: string) {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
    setPage(1);
  }

  function toggleSize(size: string) {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
    setPage(1);
  }

  function clearAll() {
    setSelectedCategories([]);
    setMinPrice(priceMin);
    setMaxPrice(priceMax);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = [...products];
    if (selectedCategories.length > 0)
      list = list.filter(p => p.category && selectedCategories.includes(p.category));
    list = list.filter(p => p.sellPrice >= minPrice && p.sellPrice <= maxPrice);
    if (sort === "price_asc") list.sort((a, b) => a.sellPrice - b.sellPrice);
    else if (sort === "price_desc") list.sort((a, b) => b.sellPrice - a.sellPrice);
    else if (sort === "name_asc") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, selectedCategories, minPrice, maxPrice, sort]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    minPrice !== priceMin ||
    maxPrice !== priceMax;

  const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? "Most Popular";

  function Sidebar() {
    return (
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-1 pb-4 border-b border-gray-200">
          <h2 className="font-bold text-black text-base">Filters</h2>
          <button onClick={clearAll} className="text-gray-400 hover:text-gray-600">
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <FilterSection title="Categories">
            <div className="space-y-2.5">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-black"
                >
                  <span className={selectedCategories.includes(cat) ? "text-black font-semibold" : ""}>{cat}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Price */}
        <FilterSection title="Price">
          <div className="space-y-3">
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              value={maxPrice}
              onChange={e => { setMaxPrice(Number(e.target.value)); setPage(1); }}
              className="w-full accent-black"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-sm text-center font-medium">
                ৳{minPrice.toLocaleString()}
              </div>
              <span className="text-gray-400">–</span>
              <div className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-sm text-center font-medium">
                ৳{maxPrice.toLocaleString()}
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Colors */}
        <FilterSection title="Colors">
          <div className="flex flex-wrap gap-2">
            {COLORS.map(c => (
              <button
                key={c.name}
                onClick={() => toggleColor(c.name)}
                title={c.name}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedColors.includes(c.name)
                    ? "border-black scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c.hex, boxShadow: c.hex === "#FFFFFF" ? "inset 0 0 0 1px #e5e7eb" : "none" }}
              >
                {selectedColors.includes(c.name) && (
                  <Check size={12} className={c.hex === "#FFFFFF" || c.hex === "#F5DD06" ? "text-black" : "text-white"} strokeWidth={3} />
                )}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Size */}
        <FilterSection title="Size">
          <div className="flex flex-wrap gap-2">
            {SIZES.map(s => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedSizes.includes(s)
                    ? "bg-black text-white border-black"
                    : "bg-[#F0F0F0] text-gray-600 border-transparent hover:border-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Dress Style */}
        <FilterSection title="Dress Style">
          <div className="space-y-2.5">
            {["Casual", "Formal", "Party", "Gym"].map(style => (
              <button
                key={style}
                className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-black"
              >
                <span>{style}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Apply button */}
        <button
          onClick={() => setMobileFilterOpen(false)}
          className="w-full mt-4 bg-black text-white font-semibold py-3.5 rounded-full text-sm hover:bg-gray-900 transition-colors"
        >
          Apply Filter
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Mobile filter toggle */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <h1 className="font-bold text-xl text-black">পণ্য</h1>
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium"
          >
            <SlidersHorizontal size={14} />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-black rounded-full" />
            )}
          </button>
        </div>

        {/* Main layout */}
        <div className="flex gap-8">

          {/* --- LEFT SIDEBAR (desktop) --- */}
          <aside className="hidden lg:block w-[295px] flex-shrink-0">
            <Sidebar />
          </aside>

          {/* --- RIGHT CONTENT --- */}
          <div className="flex-1 min-w-0">

            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-bold text-2xl text-black leading-tight">
                  {selectedCategories.length === 1
                    ? selectedCategories[0]
                    : selectedCategories.length > 1
                    ? `${selectedCategories.length} Categories`
                    : "All Products"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} Products
                </p>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 hidden sm:block">Sort by:</span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={e => { setSort(e.target.value); setPage(1); }}
                    className="appearance-none border border-gray-200 rounded-full pl-3 pr-8 py-2 text-sm font-semibold bg-white outline-none cursor-pointer"
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>
            </div>

            {/* Active filter tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategories.map(c => (
                  <span key={c} className="flex items-center gap-1 bg-black text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    {c}
                    <button onClick={() => toggleCategory(c)}><X size={10} /></button>
                  </span>
                ))}
                {selectedColors.map(c => (
                  <span key={c} className="flex items-center gap-1 bg-black text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    {c}
                    <button onClick={() => toggleColor(c)}><X size={10} /></button>
                  </span>
                ))}
                {selectedSizes.map(s => (
                  <span key={s} className="flex items-center gap-1 bg-black text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    {s}
                    <button onClick={() => toggleSize(s)}><X size={10} /></button>
                  </span>
                ))}
                <button onClick={clearAll} className="text-xs text-gray-500 underline hover:text-black px-1">
                  Clear all
                </button>
              </div>
            )}

            {/* Product grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-lg font-semibold text-gray-400 mb-2">No products found</p>
                {hasActiveFilters && (
                  <button onClick={clearAll} className="text-sm text-black underline">Clear filters</button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
                {paginated.map(p => (
                  <DynamicProductCard key={p.id} product={p} slug={slug} fullWidth />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full text-sm font-medium disabled:opacity-40 hover:border-black transition-colors"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                        pg === page
                          ? "bg-black text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full text-sm font-medium disabled:opacity-40 hover:border-black transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white h-full overflow-y-auto p-5 ml-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-black text-base">Filters</h2>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
}
