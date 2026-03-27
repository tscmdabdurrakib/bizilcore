"use client";

import { useEffect, useState, useCallback } from "react";
import { Scissors, Plus, Edit2, ToggleLeft, ToggleRight, X, ChevronDown, Loader2, User } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface StaffOption {
  id: string;
  user: { name: string };
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  durationMins: number;
  description: string | null;
  isActive: boolean;
  commissionRate: number;
  defaultStaffId: string | null;
  defaultStaff: { id: string; user: { name: string } } | null;
}

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", primary: "var(--c-primary)", bg: "var(--c-bg)",
};

const CATEGORIES: { value: string; label: string; color: string; bg: string }[] = [
  { value: "hair",   label: "চুল",    color: "#EC4899", bg: "#FDF2F8" },
  { value: "skin",   label: "স্কিন",  color: "#8B5CF6", bg: "#F5F3FF" },
  { value: "nail",   label: "নেইল",   color: "#F59E0B", bg: "#FFFBEB" },
  { value: "makeup", label: "মেকআপ",  color: "#EF4444", bg: "#FEF2F2" },
  { value: "other",  label: "অন্যান্য", color: "#6B7280", bg: "#F3F4F6" },
];

const inp = (f: boolean) => ({
  height: "40px", border: `1px solid ${f ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px", color: "var(--c-text)", backgroundColor: "var(--c-surface)",
  padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
});

const DEFAULT_FORM = {
  name: "", category: "hair", price: "", durationMins: "30",
  description: "", commissionRate: "30", defaultStaffId: "",
};

function ServiceModal({
  initial, staffList, onClose, onSave,
}: {
  initial?: Service | null;
  staffList: StaffOption[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState(initial ? {
    name: initial.name, category: initial.category,
    price: String(initial.price), durationMins: String(initial.durationMins),
    description: initial.description ?? "",
    commissionRate: String(Math.round(initial.commissionRate * 100)),
    defaultStaffId: initial.defaultStaffId ?? "",
  } : { ...DEFAULT_FORM });
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const price = parseFloat(form.price);
    const durationMins = parseInt(form.durationMins);
    const commissionRate = parseFloat(form.commissionRate) / 100;
    if (!form.name.trim()) { setErr("নাম আবশ্যিক।"); return; }
    if (isNaN(price) || price < 0) { setErr("সঠিক মূল্য দিন।"); return; }
    if (!Number.isInteger(durationMins) || durationMins <= 0) { setErr("সঠিক সময়কাল দিন।"); return; }

    setLoading(true);
    const url = initial ? `/api/services/${initial.id}` : "/api/services";
    const method = initial ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, category: form.category, price, durationMins,
        description: form.description, commissionRate,
        defaultStaffId: form.defaultStaffId || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error ?? "সার্ভিস সেভ করা যায়নি।");
      return;
    }
    onSave();
    onClose();
  }

  const catMeta = CATEGORIES.find(c => c.value === form.category);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="rounded-2xl p-6 w-full max-w-md" style={{ backgroundColor: S.surface }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base" style={{ color: S.text }}>
            {initial ? "সার্ভিস সম্পাদনা" : "নতুন সার্ভিস"}
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: S.muted }} /></button>
        </div>

        {err && (
          <div className="mb-3 p-3 rounded-xl text-sm" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
            {err}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>নাম *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="যেমন: Hair Cut"
              style={inp(focused === "name")}
              onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
              required
            />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>ক্যাটাগরি *</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, category: c.value }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    backgroundColor: form.category === c.value ? c.bg : "transparent",
                    borderColor: form.category === c.value ? c.color : S.border,
                    color: form.category === c.value ? c.color : S.muted,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>মূল্য (৳) *</label>
              <input
                type="number" min="0" step="0.01"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder="0"
                style={inp(focused === "price")}
                onFocus={() => setFocused("price")} onBlur={() => setFocused(null)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>সময়কাল (মিনিট) *</label>
              <div className="relative">
                <select
                  value={form.durationMins}
                  onChange={e => setForm(p => ({ ...p, durationMins: e.target.value }))}
                  style={{ ...inp(focused === "dur"), appearance: "none", paddingRight: "32px" }}
                  onFocus={() => setFocused("dur")} onBlur={() => setFocused(null)}
                >
                  {[15, 30, 45, 60, 90, 120, 150, 180].map(d => (
                    <option key={d} value={d}>{d} মিনিট</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>ডিফল্ট স্টাফ</label>
            <div className="relative">
              <select
                value={form.defaultStaffId}
                onChange={e => setForm(p => ({ ...p, defaultStaffId: e.target.value }))}
                style={{ ...inp(focused === "staff"), appearance: "none", paddingRight: "32px" }}
                onFocus={() => setFocused("staff")} onBlur={() => setFocused(null)}
              >
                <option value="">কেউ নেই (ঐচ্ছিক)</option>
                {staffList.map(st => (
                  <option key={st.id} value={st.id}>{st.user.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>কমিশন রেট (%)</label>
            <input
              type="number" min="0" max="100" step="1"
              value={form.commissionRate}
              onChange={e => setForm(p => ({ ...p, commissionRate: e.target.value }))}
              placeholder="30"
              style={inp(focused === "cr")}
              onFocus={() => setFocused("cr")} onBlur={() => setFocused(null)}
            />
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>বিবরণ</label>
            <input
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="ঐচ্ছিক"
              style={inp(focused === "desc")}
              onFocus={() => setFocused("desc")} onBlur={() => setFocused(null)}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: S.border, color: S.text }}>
              বাতিল
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: catMeta?.color ?? S.primary }}>
              {loading ? "সেভ..." : initial ? "আপডেট করুন" : "যোগ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [svcRes, staffRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/staff"),
      ]);
      const svcData = svcRes.ok ? await svcRes.json() : [];
      const staffData = staffRes.ok ? await staffRes.json() : [];
      setServices(Array.isArray(svcData) ? svcData : []);
      setStaffList(Array.isArray(staffData) ? staffData.filter((s: { isActive: boolean }) => s.isActive) : []);
    } catch {
      setServices([]);
      setStaffList([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(s: Service) {
    setToggling(s.id);
    await fetch(`/api/services/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    await load();
    setToggling(null);
  }

  const filtered = activeCategory === "all" ? services : services.filter(s => s.category === activeCategory);
  const grouped: Record<string, Service[]> = {};
  for (const s of filtered) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  const categoryCounts = CATEGORIES.map(c => ({
    ...c,
    count: services.filter(s => s.category === c.value).length,
  }));

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)" }}>
            <Scissors size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>সার্ভিস তালিকা</h1>
            <p className="text-xs" style={{ color: S.muted }}>সব সার্ভিস, মূল্য ও কমিশন এক জায়গায়</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)" }}
        >
          <Plus size={16} /> নতুন সার্ভিস
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory("all")}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap flex-shrink-0 transition-all"
          style={{
            backgroundColor: activeCategory === "all" ? "#EC4899" : "transparent",
            borderColor: activeCategory === "all" ? "#EC4899" : S.border,
            color: activeCategory === "all" ? "#fff" : S.muted,
          }}
        >
          সব ({services.length})
        </button>
        {categoryCounts.map(c => (
          <button
            key={c.value}
            onClick={() => setActiveCategory(c.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap flex-shrink-0 transition-all"
            style={{
              backgroundColor: activeCategory === c.value ? c.bg : "transparent",
              borderColor: activeCategory === c.value ? c.color : S.border,
              color: activeCategory === c.value ? c.color : S.muted,
            }}
          >
            {c.label} ({c.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: S.muted }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#FDF2F8" }}>
            <Scissors size={28} style={{ color: "#EC4899" }} />
          </div>
          <p className="font-semibold text-sm" style={{ color: S.text }}>কোনো সার্ভিস নেই</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>নতুন সার্ভিস যোগ করুন</p>
          <button
            onClick={() => { setEditing(null); setShowModal(true); }}
            className="mt-4 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)" }}
          >
            <Plus size={14} className="inline mr-1" /> যোগ করুন
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => {
          const catMeta = CATEGORIES.find(c => c.value === cat);
          return (
            <div key={cat}>
              {activeCategory === "all" && (
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: catMeta?.bg }}>
                    <Scissors size={11} style={{ color: catMeta?.color }} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: catMeta?.color ?? S.muted }}>
                    {catMeta?.label ?? cat}
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: S.border }} />
                </div>
              )}
              <div className="space-y-2">
                {items.map(svc => (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between p-4 rounded-xl border"
                    style={{
                      backgroundColor: S.surface, borderColor: S.border,
                      opacity: svc.isActive ? 1 : 0.6,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" style={{ color: S.text }}>{svc.name}</span>
                        {!svc.isActive && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: "#F3F4F6", color: "#9CA3AF" }}>
                            বন্ধ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs" style={{ color: S.muted }}>{svc.durationMins} মিনিট</span>
                        <span className="text-xs" style={{ color: S.muted }}>কমিশন: {Math.round(svc.commissionRate * 100)}%</span>
                        {svc.defaultStaff && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: S.muted }}>
                            <User size={10} /> {svc.defaultStaff.user.name}
                          </span>
                        )}
                        {svc.description && (
                          <span className="text-xs truncate" style={{ color: S.muted }}>{svc.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                      <span className="font-bold text-sm" style={{ color: catMeta?.color ?? S.primary }}>
                        {formatBDT(svc.price)}
                      </span>
                      <button
                        onClick={() => { setEditing(svc); setShowModal(true); }}
                        className="p-1.5 rounded-lg border"
                        style={{ borderColor: S.border }}
                      >
                        <Edit2 size={13} style={{ color: S.muted }} />
                      </button>
                      <button
                        onClick={() => toggleActive(svc)}
                        disabled={toggling === svc.id}
                        className="p-1.5 rounded-lg border"
                        style={{ borderColor: S.border }}
                      >
                        {svc.isActive
                          ? <ToggleRight size={16} style={{ color: "#10B981" }} />
                          : <ToggleLeft size={16} style={{ color: S.muted }} />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {showModal && (
        <ServiceModal
          initial={editing}
          staffList={staffList}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={load}
        />
      )}
    </div>
  );
}
