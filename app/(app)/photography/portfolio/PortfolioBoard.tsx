"use client";

import { useEffect, useState, useCallback } from "react";
import { Image, Loader2, Camera, MapPin, Calendar } from "lucide-react";

interface PortfolioItem {
  id: string;
  eventType: string;
  eventDate: string;
  venue?: string;
  package?: { name: string; type: string } | null;
  showInPortfolio: boolean;
  status: string;
}

const PHOTO_COLOR = "#DB2777";
const PHOTO_BG = "#FDF2F8";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "বিবাহ", birthday: "জন্মদিন", corporate: "কর্পোরেট",
  portrait: "পোর্ট্রেট", product: "প্রোডাক্ট", other: "অন্যান্য",
};

const EVENT_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  wedding:   { color: "#DB2777", bg: "#FDF2F8" },
  birthday:  { color: "#7C3AED", bg: "#F5F3FF" },
  corporate: { color: "#0891B2", bg: "#ECFEFF" },
  portrait:  { color: "#0F6E56", bg: "#E1F5EE" },
  product:   { color: "#D97706", bg: "#FEF3C7" },
  other:     { color: "#6B7280", bg: "#F3F4F6" },
};

export default function PortfolioBoard() {
  const [all, setAll] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/photography/bookings?status=delivered", { cache: "no-store" });
      if (res.ok) setAll(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (item: PortfolioItem) => {
    setToggling(item.id);
    try {
      await fetch(`/api/photography/bookings/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showInPortfolio: !item.showInPortfolio }),
      });
      setAll(prev => prev.map(b => b.id === item.id ? { ...b, showInPortfolio: !b.showInPortfolio } : b));
    } finally {
      setToggling(null);
    }
  };

  const categories = ["all", ...Array.from(new Set(all.map(b => b.eventType)))];
  const filtered = catFilter === "all" ? all : all.filter(b => b.eventType === catFilter);
  const portfolioItems = filtered.filter(b => b.showInPortfolio);
  const nonPortfolioItems = filtered.filter(b => !b.showInPortfolio);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: S.text }}>পোর্টফোলিও</h1>
        <p className="text-sm" style={{ color: S.muted }}>{portfolioItems.length}টি কাজ পোর্টফোলিওতে আছে</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)} className="px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-colors" style={{ backgroundColor: catFilter === cat ? PHOTO_COLOR : S.surface, color: catFilter === cat ? "#fff" : S.muted, borderColor: catFilter === cat ? PHOTO_COLOR : S.border }}>
            {cat === "all" ? "সব" : (EVENT_TYPE_LABELS[cat] ?? cat)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: PHOTO_COLOR }} /></div>
      ) : (
        <>
          {/* Portfolio items */}
          {portfolioItems.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: S.text }}>পোর্টফোলিওতে আছে ({portfolioItems.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolioItems.map(item => {
                  const tc = EVENT_TYPE_COLORS[item.eventType] ?? EVENT_TYPE_COLORS.other;
                  return (
                    <div key={item.id} className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: tc.bg, color: tc.color }}>
                          {EVENT_TYPE_LABELS[item.eventType] ?? item.eventType}
                        </span>
                        <button onClick={() => toggle(item)} disabled={toggling === item.id} className="w-10 h-5 rounded-full relative transition-colors" style={{ backgroundColor: PHOTO_COLOR }}>
                          <div className="w-4 h-4 rounded-full bg-white absolute top-0.5" style={{ left: "22px" }} />
                        </button>
                      </div>
                      <div className="w-full aspect-video rounded-xl flex items-center justify-center" style={{ backgroundColor: tc.bg }}>
                        <Camera size={32} style={{ color: tc.color, opacity: 0.4 }} />
                      </div>
                      <div className="space-y-1 text-xs" style={{ color: S.muted }}>
                        <p className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(item.eventDate).toLocaleDateString("bn-BD", { month: "long", year: "numeric" })}
                        </p>
                        {item.venue && <p className="flex items-center gap-1"><MapPin size={11} />{item.venue}</p>}
                        {item.package && <p>{item.package.name}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Non-portfolio delivered bookings */}
          {nonPortfolioItems.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: S.muted }}>পোর্টফোলিওতে নেই ({nonPortfolioItems.length})</p>
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
                {nonPortfolioItems.map((item, idx) => {
                  const tc = EVENT_TYPE_COLORS[item.eventType] ?? EVENT_TYPE_COLORS.other;
                  return (
                    <div key={item.id} className={`p-4 flex items-center gap-4 ${idx < nonPortfolioItems.length - 1 ? "border-b" : ""}`} style={{ borderColor: S.border }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tc.bg }}>
                        <Camera size={18} style={{ color: tc.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: S.text }}>{EVENT_TYPE_LABELS[item.eventType] ?? item.eventType}</p>
                        <p className="text-xs" style={{ color: S.muted }}>
                          {new Date(item.eventDate).toLocaleDateString("bn-BD")}
                          {item.venue ? ` · ${item.venue}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: S.muted }}>পোর্টফোলিওতে যোগ করুন</span>
                        <button onClick={() => toggle(item)} disabled={toggling === item.id} className="w-10 h-5 rounded-full relative transition-colors" style={{ backgroundColor: S.border }}>
                          <div className="w-4 h-4 rounded-full bg-white absolute top-0.5" style={{ left: "2px" }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {all.length === 0 && (
            <div className="rounded-2xl border p-12 text-center" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <Image size={36} className="mx-auto mb-3" style={{ color: S.muted }} />
              <p className="font-semibold" style={{ color: S.text }}>এখনো কোনো Delivered বুকিং নেই</p>
              <p className="text-sm mt-1" style={{ color: S.muted }}>বুকিং ডেলিভার করলে এখানে দেখাবে</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
