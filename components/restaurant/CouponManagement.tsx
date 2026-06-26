"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Tag, Check, ChevronDown, ChevronUp, Clock, Users, Gift, Package } from "lucide-react";

interface Coupon {
  id: string;
  name?: string | null;
  code: string;
  type: string;
  value: number;
  minOrder?: number | null;
  maxDiscount?: number | null;
  usedCount: number;
  maxUse?: number | null;
  expiresAt?: string | null;
  isActive: boolean;
  happyHourStart?: string | null;
  happyHourEnd?: string | null;
  happyHourDays?: number[] | null;
  memberTier?: string | null;
  bogoGetQty?: number;
  bogoGetDiscount?: number;
  bogoGetItemId?: string | null;
  applicableItemIds?: string[] | null;
  applicableCategories?: string[] | null;
  createdAt: string;
}

interface SimpleMenuItem {
  id: string;
  name: string;
  category: string;
}

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)",
  text: "var(--c-text)", muted: "var(--c-text-muted)",
  primary: "#EA580C", bg: "var(--c-bg)",
};

const DAYS = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];
const MEMBER_TIERS = ["silver", "gold", "platinum"];

const COUPON_TYPES = [
  { value: "fixed",     label: "ফিক্সড পরিমাণ",   icon: Tag },
  { value: "percent",   label: "শতাংশ (%)",         icon: Tag },
  { value: "happyhour", label: "হ্যাপি আওয়ার",     icon: Clock },
  { value: "member",    label: "মেম্বার ডিসকাউন্ট", icon: Users },
  { value: "bogo",      label: "Buy 1 Get 1",        icon: Gift },
  { value: "combo",     label: "কম্বো অফার",         icon: Package },
];

const TYPE_LABELS: Record<string, string> = {
  fixed: "ফিক্সড", percent: "%", happyhour: "হ্যাপি আওয়ার",
  member: "মেম্বার", bogo: "BOGO", combo: "কম্বো",
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  fixed:     { bg: "#DCFCE7", text: "#16A34A" },
  percent:   { bg: "#DBEAFE", text: "#1D4ED8" },
  happyhour: { bg: "#FEF3C7", text: "#D97706" },
  member:    { bg: "#F3E8FF", text: "#7C3AED" },
  bogo:      { bg: "#FCE7F3", text: "#BE185D" },
  combo:     { bg: "#FFF7ED", text: "#EA580C" },
};

function formatExpiry(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("bn-BD", { day: "2-digit", month: "short", year: "numeric" });
}

function isExpired(d: string | null | undefined) {
  if (!d) return false;
  return new Date(d) < new Date();
}

const EMPTY_FORM = {
  name: "", code: "", type: "percent", value: "",
  minOrder: "", maxDiscount: "", maxUse: "", expiresAt: "",
  happyHourStart: "15:00", happyHourEnd: "18:00",
  happyHourDays: [0, 1, 2, 3, 4, 5, 6] as number[],
  memberTier: "silver",
  bogoGetQty: "1", bogoGetDiscount: "100", bogoGetItemId: "",
  applicableItemIds: [] as string[],
  applicableCategories: [] as string[],
};

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<SimpleMenuItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [rC, rM] = await Promise.all([
        fetch("/api/restaurant/coupons"),
        fetch("/api/restaurant/menu-items?limit=200"),
      ]);
      if (rC.ok) {
        setCoupons(await rC.json());
      } else {
        const err = await rC.json().catch(() => ({}));
        setLoadError((err as { error?: string }).error ?? "কুপন লোড করা যায়নি");
      }
      if (rM.ok) {
        const data = await rM.json();
        const items: SimpleMenuItem[] = (Array.isArray(data) ? data : data.items ?? []).map(
          (m: { id: string; name: string; category?: string }) => ({
            id: m.id, name: m.name, category: m.category ?? "",
          })
        );
        setMenuItems(items);
      }
    } catch {
      setLoadError("কুপন লোড করা যায়নি");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditCoupon(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (c: Coupon) => {
    setEditCoupon(c);
    setForm({
      name: c.name ?? "",
      code: c.code,
      type: c.type,
      value: String(c.value),
      minOrder: c.minOrder ? String(c.minOrder) : "",
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      maxUse: c.maxUse ? String(c.maxUse) : "",
      expiresAt: c.expiresAt ? c.expiresAt.substring(0, 10) : "",
      happyHourStart: c.happyHourStart ?? "15:00",
      happyHourEnd: c.happyHourEnd ?? "18:00",
      happyHourDays: c.happyHourDays ?? [0, 1, 2, 3, 4, 5, 6],
      memberTier: c.memberTier ?? "silver",
      bogoGetQty: String(c.bogoGetQty ?? 1),
      bogoGetDiscount: String(c.bogoGetDiscount ?? 100),
      bogoGetItemId: c.bogoGetItemId ?? "",
      applicableItemIds: c.applicableItemIds ?? [],
      applicableCategories: c.applicableCategories ?? [],
    });
    setShowModal(true);
  };

  const toggleApplicableItem = (id: string) => {
    setForm(f => ({
      ...f,
      applicableItemIds: f.applicableItemIds.includes(id)
        ? f.applicableItemIds.filter(x => x !== id)
        : [...f.applicableItemIds, id],
    }));
  };

  const toggleApplicableCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      applicableCategories: f.applicableCategories.includes(cat)
        ? f.applicableCategories.filter(x => x !== cat)
        : [...f.applicableCategories, cat],
    }));
  };

  const menuCategories = Array.from(new Set(menuItems.map(m => m.category).filter(Boolean))).sort();

  const toggleDay = (d: number) => {
    setForm(prev => ({
      ...prev,
      happyHourDays: prev.happyHourDays.includes(d)
        ? prev.happyHourDays.filter(x => x !== d)
        : [...prev.happyHourDays, d].sort(),
    }));
  };

  const save = async () => {
    if (!form.code.trim()) { showToast("error", "কুপন কোড আবশ্যক"); return; }
    if (!form.value) { showToast("error", "মান আবশ্যক"); return; }
    setSaving(true);
    const payload = {
      name: form.name || null,
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minOrder: form.minOrder ? Number(form.minOrder) : null,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      maxUse: form.maxUse ? Number(form.maxUse) : null,
      expiresAt: form.expiresAt || null,
      happyHourStart: form.type === "happyhour" ? form.happyHourStart : null,
      happyHourEnd: form.type === "happyhour" ? form.happyHourEnd : null,
      happyHourDays: form.type === "happyhour" ? form.happyHourDays : null,
      memberTier: form.type === "member" ? form.memberTier : null,
      bogoGetQty: form.type === "bogo" ? Number(form.bogoGetQty) : 1,
      bogoGetDiscount: form.type === "bogo" ? Number(form.bogoGetDiscount) : 100,
      bogoGetItemId: form.type === "bogo" && form.bogoGetItemId ? form.bogoGetItemId : null,
      applicableItemIds: ["bogo", "combo", "happyhour", "percent", "fixed", "member"].includes(form.type) && form.applicableItemIds.length > 0
        ? form.applicableItemIds : null,
      applicableCategories: form.applicableCategories.length > 0 ? form.applicableCategories : null,
    };
    try {
      const url = editCoupon ? `/api/restaurant/coupons/${editCoupon.id}` : "/api/restaurant/coupons";
      const method = editCoupon ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await r.json();
      if (!r.ok) { showToast("error", data.error ?? "সেভ হয়নি"); setSaving(false); return; }
      showToast("success", editCoupon ? "আপডেট হয়েছে" : "কুপন তৈরি হয়েছে");
      setShowModal(false);
      load();
    } catch { showToast("error", "Error"); }
    setSaving(false);
  };

  const toggleActive = async (c: Coupon) => {
    try {
      const r = await fetch(`/api/restaurant/coupons/${c.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      if (r.ok) { setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, isActive: !c.isActive } : x)); }
    } catch {}
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("এই কুপন মুছে ফেলবেন?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`/api/restaurant/coupons/${id}`, { method: "DELETE" });
      if (r.ok) { setCoupons(prev => prev.filter(c => c.id !== id)); showToast("success", "মুছে ফেলা হয়েছে"); }
    } catch {}
    setDeleting(null);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-32">
      <Loader2 size={24} className="animate-spin" style={{ color: S.primary }} />
    </div>
  );

  return (
    <div className="min-h-[200px]">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      {loadError && (
        <div className="mb-4 p-3 rounded-xl text-xs font-semibold border"
          style={{ borderColor: "#FECACA", backgroundColor: "#FEF2F2", color: "#B91C1C" }}>
          {loadError}
          <button type="button" onClick={() => { setLoading(true); load(); }} className="ml-2 underline">
            আবার চেষ্টা
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-base" style={{ color: S.text }}>কুপন ও ডিসকাউন্ট</h2>
          <p className="text-xs mt-0.5" style={{ color: S.muted }}>{coupons.length}টি কুপন</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: S.primary }}>
          <Plus size={15} /> নতুন কুপন
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Tag size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">কোনো কুপন নেই</p>
          <p className="text-xs mt-1">প্রথম কুপন তৈরি করুন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => {
            const expired = isExpired(c.expiresAt);
            const tc = TYPE_COLORS[c.type] ?? TYPE_COLORS.fixed;
            const isExpanded = expandedId === c.id;
            return (
              <div key={c.id} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm font-mono tracking-wide" style={{ color: S.text }}>{c.code}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: tc.bg, color: tc.text }}>
                        {TYPE_LABELS[c.type] ?? c.type}
                      </span>
                      {expired && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600">মেয়াদ শেষ</span>}
                      {!c.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-gray-100 text-gray-500">অক্রিয়</span>}
                    </div>
                    {c.name && <p className="text-xs mb-1" style={{ color: S.muted }}>{c.name}</p>}
                    <div className="flex items-center gap-3 text-[11px]" style={{ color: S.muted }}>
                      <span className="font-semibold" style={{ color: S.primary }}>
                        {c.type === "fixed" ? `৳${c.value}` : c.type === "percent" ? `${c.value}%` : c.type === "happyhour" ? `${c.value}% অফ` : c.type === "member" ? `${c.value}% মেম্বার` : "BOGO"}
                      </span>
                      <span>ব্যবহার: {c.usedCount}{c.maxUse ? `/${c.maxUse}` : ""}</span>
                      {c.minOrder && <span>মিন: ৳{c.minOrder}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleActive(c)}
                      className="relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0"
                      style={{ backgroundColor: c.isActive && !expired ? S.primary : "#D1D5DB", minWidth: "40px", height: "22px" }}>
                      <span className="absolute top-0.5 transition-all rounded-full w-4 h-4 bg-white shadow"
                        style={{ left: (c.isActive && !expired) ? "calc(100% - 18px)" : "2px" }} />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                      style={{ color: S.muted }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button onClick={() => openEdit(c)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 transition-colors text-blue-500">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => deleteCoupon(c.id)} disabled={!!deleting}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors text-red-500">
                      {deleting === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t text-xs space-y-1.5" style={{ borderColor: S.border, color: S.muted }}>
                    {c.type === "happyhour" && (
                      <>
                        <p><span className="font-semibold">সময়:</span> {c.happyHourStart} – {c.happyHourEnd}</p>
                        <p><span className="font-semibold">দিন:</span> {(c.happyHourDays ?? []).map(d => DAYS[d]).join(", ")}</p>
                      </>
                    )}
                    {c.type === "member" && <p><span className="font-semibold">স্তর:</span> {c.memberTier?.toUpperCase()}</p>}
                    {c.type === "bogo" && (
                      <p><span className="font-semibold">BOGO:</span> {c.bogoGetQty}টি আইটেমে {c.bogoGetDiscount}% ছাড়</p>
                    )}
                    {c.maxDiscount && <p><span className="font-semibold">সর্বোচ্চ ছাড়:</span> ৳{c.maxDiscount}</p>}
                    {c.expiresAt && <p><span className="font-semibold">মেয়াদ:</span> {formatExpiry(c.expiresAt)}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ backgroundColor: S.surface }}>
            <div className="p-5 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-base" style={{ color: S.text }}>
                {editCoupon ? "কুপন সম্পাদনা" : "নতুন কুপন তৈরি"}
              </h3>
              <button onClick={() => setShowModal(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: S.muted }}>কুপনের ধরন</label>
                <div className="grid grid-cols-3 gap-2">
                  {COUPON_TYPES.map(t => (
                    <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      className="flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold transition-all"
                      style={{
                        borderColor: form.type === t.value ? S.primary : S.border,
                        backgroundColor: form.type === t.value ? "#FFF7ED" : S.bg,
                        color: form.type === t.value ? S.primary : S.muted,
                      }}>
                      <t.icon size={14} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>কুপনের নাম (ঐচ্ছিক)</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="গ্রীষ্মকালীন অফার"
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>কুপন কোড *</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="SAVE20"
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none font-mono tracking-wider"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>
                  {form.type === "fixed" ? "ছাড়ের পরিমাণ (৳) *" : form.type === "bogo" ? "BOGO ছাড় শতাংশ (%)" : "ছাড়ের হার (%) *"}
                </label>
                <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === "fixed" ? "50" : "20"}
                  className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                  style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
              </div>

              {/* Category scope (happy hour, percent, fixed, member) */}
              {["happyhour", "percent", "fixed", "member"].includes(form.type) && menuCategories.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: S.muted }}>প্রযোজ্য ক্যাটাগরি (ঐচ্ছিক)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {menuCategories.map(cat => (
                      <button key={cat} type="button" onClick={() => toggleApplicableCategory(cat)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border"
                        style={{
                          backgroundColor: form.applicableCategories.includes(cat) ? "#FFF7ED" : S.bg,
                          color: form.applicableCategories.includes(cat) ? S.primary : S.muted,
                          borderColor: form.applicableCategories.includes(cat) ? S.primary : S.border,
                        }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Happy Hour fields */}
              {form.type === "happyhour" && (
                <div className="space-y-3 p-3 rounded-xl border" style={{ borderColor: "#F59E0B", backgroundColor: "#FFFBEB" }}>
                  <p className="text-xs font-bold" style={{ color: "#D97706" }}>⏰ হ্যাপি আওয়ার সেটিংস</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>শুরুর সময়</label>
                      <input type="time" value={form.happyHourStart} onChange={e => setForm(f => ({ ...f, happyHourStart: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                        style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>শেষের সময়</label>
                      <input type="time" value={form.happyHourEnd} onChange={e => setForm(f => ({ ...f, happyHourEnd: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                        style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2" style={{ color: S.muted }}>প্রযোজ্য দিন</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS.map((d, i) => (
                        <button key={i} onClick={() => toggleDay(i)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            backgroundColor: form.happyHourDays.includes(i) ? "#F59E0B" : S.bg,
                            color: form.happyHourDays.includes(i) ? "#fff" : S.muted,
                            border: `1px solid ${form.happyHourDays.includes(i) ? "#F59E0B" : S.border}`,
                          }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Member tier */}
              {form.type === "member" && (
                <div className="p-3 rounded-xl border" style={{ borderColor: "#7C3AED", backgroundColor: "#F5F3FF" }}>
                  <label className="block text-xs font-bold mb-2" style={{ color: "#7C3AED" }}>👑 মেম্বার স্তর</label>
                  <div className="flex gap-2">
                    {MEMBER_TIERS.map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, memberTier: t }))}
                        className="flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all border"
                        style={{
                          backgroundColor: form.memberTier === t ? "#7C3AED" : S.surface,
                          color: form.memberTier === t ? "#fff" : S.muted,
                          borderColor: form.memberTier === t ? "#7C3AED" : S.border,
                        }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* BOGO fields */}
              {form.type === "bogo" && (
                <div className="p-3 rounded-xl border" style={{ borderColor: "#BE185D", backgroundColor: "#FDF2F8" }}>
                  <p className="text-xs font-bold mb-3" style={{ color: "#BE185D" }}>🎁 BOGO সেটিংস</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>বিনামূল্যে পরিমাণ</label>
                      <input type="number" value={form.bogoGetQty} onChange={e => setForm(f => ({ ...f, bogoGetQty: e.target.value }))}
                        min="1" className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                        style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>ছাড় % (100=বিনামূল্যে)</label>
                      <input type="number" value={form.bogoGetDiscount} onChange={e => setForm(f => ({ ...f, bogoGetDiscount: e.target.value }))}
                        min="1" max="100" className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                        style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }} />
                    </div>
                  </div>
                  {menuItems.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>বিনামূল্যে/ছাড় আইটেম (ঐচ্ছিক — খালি = একই আইটেম)</label>
                      <select value={form.bogoGetItemId} onChange={e => setForm(f => ({ ...f, bogoGetItemId: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                        style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}>
                        <option value="">ট্রিগার আইটেমের মতো</option>
                        {menuItems.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Combo fields */}
              {form.type === "combo" && (
                <div className="p-3 rounded-xl border" style={{ borderColor: "#EA580C", backgroundColor: "#FFF7ED" }}>
                  <p className="text-xs font-bold mb-1" style={{ color: "#EA580C" }}>📦 কম্বো অফার সেটিংস</p>
                  <p className="text-xs mb-3" style={{ color: S.muted }}>নিচের সব আইটেম কার্টে থাকলে ছাড় প্রযোজ্য হবে</p>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>ছাড়ের পরিমাণ</label>
                  <p className="text-xs mb-2" style={{ color: S.muted }}>≤100 = শতাংশ (%), &gt;100 = টাকার পরিমাণ (৳)</p>
                </div>
              )}

              {/* Applicable items selector */}
              {(["bogo", "combo", "happyhour"] as string[]).includes(form.type) && menuItems.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: S.muted }}>
                    {form.type === "bogo" ? "BOGO ট্রিগার আইটেম" :
                      form.type === "combo" ? "কম্বো আইটেমসমূহ (সব থাকলে ছাড় পাবে)" :
                      "প্রযোজ্য মেনু আইটেম (ঐচ্ছিক)"}
                  </label>
                  <div className="max-h-40 overflow-y-auto border rounded-xl p-2 space-y-1" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                    {menuItems.map(m => (
                      <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors">
                        <input type="checkbox" checked={form.applicableItemIds.includes(m.id)}
                          onChange={() => toggleApplicableItem(m.id)}
                          className="rounded" />
                        <span className="text-xs flex-1" style={{ color: S.text }}>{m.name}</span>
                        {m.category && <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: "#FFF7ED", color: "#EA580C" }}>{m.category}</span>}
                      </label>
                    ))}
                  </div>
                  {form.applicableItemIds.length > 0 && (
                    <p className="text-xs mt-1" style={{ color: "#EA580C" }}>✓ {form.applicableItemIds.length}টি আইটেম নির্বাচিত</p>
                  )}
                </div>
              )}

              {/* Common fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>সর্বনিম্ন অর্ডার (৳)</label>
                  <input type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
                    placeholder="০" className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>সর্বোচ্চ ছাড় (৳)</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))}
                    placeholder="সীমাহীন" className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>সর্বোচ্চ ব্যবহার</label>
                  <input type="number" value={form.maxUse} onChange={e => setForm(f => ({ ...f, maxUse: e.target.value }))}
                    placeholder="সীমাহীন" className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: S.muted }}>মেয়াদ শেষ তারিখ</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                    style={{ borderColor: S.border, backgroundColor: S.bg, color: S.text }} />
                </div>
              </div>
            </div>

            <div className="p-5 border-t flex gap-3" style={{ borderColor: S.border }}>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border"
                style={{ borderColor: S.border, color: S.muted }}>
                বাতিল
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{ backgroundColor: S.primary }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
