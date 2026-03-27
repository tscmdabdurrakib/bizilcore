"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Phone, MapPin, ExternalLink, Pencil, Trash2, X, Ruler, Check } from "lucide-react";
import { formatBDT, formatRelativeDate, getStatusStyle } from "@/lib/utils";

interface Customer {
  id: string; name: string; phone: string | null; address: string | null; fbProfile: string | null; dueAmount: number;
  segment?: string;
  orders: {
    id: string; status: string; totalAmount: number; dueAmount: number; createdAt: string;
    items: { productId: string | null; comboId: string | null; comboSnapshot: string | null; product: { name: string } | null; combo: { name: string } | null }[];
  }[];
}

const SEGMENT_META: Record<string, { label: string; bg: string; color: string }> = {
  vip:      { label: "VIP",     bg: "#FFF3DC", color: "#92600A" },
  new:      { label: "নতুন",   bg: "#EEF3FD", color: "#2B5FC1" },
  active:   { label: "সক্রিয়", bg: "#DCFCE7", color: "#16A34A" },
  at_risk:  { label: "ঝুঁকিতে", bg: "#FFF0E8", color: "#C2410C" },
  dormant:  { label: "নিষ্ক্রিয়", bg: "#F3F4F6", color: "#6B7280" },
};

const inp = (f: boolean) => ({
  height: "40px", border: `1px solid ${f ? "var(--c-primary)" : "var(--c-border)"}`, borderRadius: "8px",
  color: "var(--c-text)", backgroundColor: "var(--c-surface)", padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
});

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", fbProfile: "" });
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [measurement, setMeasurement] = useState<Record<string, number | null> | null>(null);
  const [measurementLoaded, setMeasurementLoaded] = useState(false);
  const [measureEdit, setMeasureEdit] = useState(false);
  const [measureForm, setMeasureForm] = useState<Record<string, string>>({});
  const [savingMeasure, setSavingMeasure] = useState(false);

  const MEASURE_FIELDS = [
    { key: "chest", label: "বুক" }, { key: "waist", label: "কোমর" },
    { key: "hip", label: "হিপ" }, { key: "shoulder", label: "কাঁধ" },
    { key: "sleeve", label: "হাতা" }, { key: "length", label: "দৈর্ঘ্য" },
    { key: "neck", label: "গলা" }, { key: "inseam", label: "ভেতরের মাপ" },
  ];

  const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch(`/api/customers/${id}`).then(r => r.json()).then(c => {
      setCustomer(c);
      setForm({ name: c.name ?? "", phone: c.phone ?? "", address: c.address ?? "", fbProfile: c.fbProfile ?? "" });
    }).finally(() => setLoading(false));

    fetch(`/api/measurements/${id}`).then(async r => {
      if (!r.ok) return;
      const data = await r.json();
      if (data.measurement) {
        setMeasurement(data.measurement);
        const mf: Record<string, string> = {};
        ["chest","waist","hip","shoulder","sleeve","length","neck","inseam"].forEach(k => {
          mf[k] = data.measurement[k] != null ? String(data.measurement[k]) : "";
        });
        setMeasureForm(mf);
      } else {
        setMeasurement({});
        setMeasureForm({});
      }
      setMeasurementLoaded(true);
    }).catch(() => {});
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const r = await fetch(`/api/customers/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, phone: form.phone || null, address: form.address || null, fbProfile: form.fbProfile || null }),
    });
    if (r.ok) {
      const updated = await r.json();
      setCustomer(prev => prev ? { ...prev, ...updated } : prev);
      setEditModal(false);
      showToast("success", "কাস্টমার আপডেট হয়েছে ✓");
    } else showToast("error", "কিছু একটা সমস্যা হয়েছে।");
    setSaving(false);
  }

  async function handleSaveMeasure() {
    setSavingMeasure(true);
    const body: Record<string, number | null | string> = { customerId: id };
    ["chest","waist","hip","shoulder","sleeve","length","neck","inseam"].forEach(k => {
      const v = measureForm[k];
      body[k] = v !== "" ? parseFloat(v) : null;
    });
    const r = await fetch("/api/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      const updated = await r.json();
      setMeasurement(updated);
      setMeasureEdit(false);
      showToast("success", "মাপ সংরক্ষণ হয়েছে ✓");
    } else showToast("error", "মাপ সংরক্ষণ ব্যর্থ হয়েছে।");
    setSavingMeasure(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const r = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (r.ok) { router.push("/customers"); }
    else { showToast("error", "মুছে ফেলা যায়নি।"); setDeleting(false); setDeleteModal(false); }
  }

  if (loading) return <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}</div>;
  if (!customer) return <div className="text-center py-20"><p style={{ color: S.muted }}>কাস্টমার পাওয়া যায়নি।</p></div>;

  return (
    <div className="max-w-2xl">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg" style={{ color: S.text }}>কাস্টমার সম্পাদনা</h3>
              <button onClick={() => setEditModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>নাম *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required style={inp(focused === "name")} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>ফোন</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" style={inp(focused === "phone")} onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>ঠিকানা</label>
                <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="সম্পূর্ণ ঠিকানা" style={inp(focused === "address")} onFocus={() => setFocused("address")} onBlur={() => setFocused(null)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: S.text }}>Facebook Profile</label>
                <input type="url" value={form.fbProfile} onChange={e => setForm(p => ({ ...p, fbProfile: e.target.value }))} placeholder="https://facebook.com/..." style={inp(focused === "fb")} onFocus={() => setFocused("fb")} onBlur={() => setFocused(null)} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: S.primary }}>
                  {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <h3 className="font-semibold text-lg mb-2" style={{ color: S.text }}>কাস্টমার মুছে ফেলবেন?</h3>
            <p className="text-sm mb-5" style={{ color: S.secondary }}><strong>{customer.name}</strong>-কে মুছে ফেললে তাঁর সব তথ্য চলে যাবে। এই কাজ আর ফেরানো যাবে না।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: "#E24B4A" }}>
                {deleting ? "মুছছে..." : "মুছে ফেলুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link href="/customers" className="p-2 rounded-xl hover:bg-gray-100"><ChevronLeft size={20} style={{ color: S.secondary }} /></Link>
        <h2 className="font-semibold text-lg" style={{ color: S.text }}>কাস্টমার প্রোফাইল</h2>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setEditModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50 transition-colors" style={{ borderColor: S.border, color: S.secondary }}>
            <Pencil size={14} /> সম্পাদনা
          </button>
          <button onClick={() => setDeleteModal(true)} className="p-2 rounded-xl hover:bg-red-50 transition-colors">
            <Trash2 size={16} style={{ color: "#E24B4A" }} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0" style={{ backgroundColor: S.primary }}>
              {customer.name[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-xl" style={{ color: S.text }}>{customer.name}</h3>
                {customer.segment && customer.segment !== "none" && SEGMENT_META[customer.segment] && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: SEGMENT_META[customer.segment].bg, color: SEGMENT_META[customer.segment].color }}>
                    {SEGMENT_META[customer.segment].label}
                  </span>
                )}
              </div>
              <div className="space-y-1.5 mt-2">
                {customer.phone && <p className="flex items-center gap-2 text-sm" style={{ color: S.secondary }}><Phone size={14} /> {customer.phone}</p>}
                {customer.address && <p className="flex items-center gap-2 text-sm" style={{ color: S.secondary }}><MapPin size={14} /> {customer.address}</p>}
                {customer.fbProfile && (
                  <a href={customer.fbProfile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm" style={{ color: S.primary }}>
                    <ExternalLink size={14} /> Facebook
                  </a>
                )}
              </div>
            </div>
            {customer.dueAmount > 0 && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs mb-1" style={{ color: S.muted }}>বাকি</p>
                <p className="text-xl font-bold" style={{ color: "#E24B4A" }}>{formatBDT(customer.dueAmount)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "মোট অর্ডার", value: `${customer.orders.length}টি` },
            { label: "মোট কেনা", value: formatBDT(customer.orders.reduce((s, o) => s + o.totalAmount, 0)) },
            { label: "বাকি", value: formatBDT(customer.dueAmount) },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border p-3 text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <p className="text-xs mb-1" style={{ color: S.muted }}>{stat.label}</p>
              <p className="font-bold" style={{ color: S.text }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <Link href={`/orders/new?customerId=${customer.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-medium"
          style={{ backgroundColor: S.primary }}>
          + নতুন অর্ডার
        </Link>

        {measurementLoaded && (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#DDD6FE" }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" }}>
              <div className="flex items-center gap-2">
                <Ruler size={16} style={{ color: "#8B5CF6" }} />
                <h3 className="font-semibold text-sm" style={{ color: "#6D28D9" }}>মাপজোখ (ইঞ্চি)</h3>
              </div>
              <button
                onClick={() => setMeasureEdit(e => !e)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}
              >
                {measureEdit ? "বাতিল" : (Object.values(measurement ?? {}).some(v => v != null) ? "সম্পাদনা" : "মাপ যোগ")}
              </button>
            </div>

            {measureEdit ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-4 gap-3">
                  {MEASURE_FIELDS.map(f => (
                    <div key={f.key}>
                      <label className="text-[11px] font-semibold mb-1 block" style={{ color: S.secondary }}>{f.label}</label>
                      <div className="relative">
                        <input
                          type="number" min={0} step={0.25}
                          value={measureForm[f.key] ?? ""}
                          onChange={e => setMeasureForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                          className="w-full h-9 pl-2 pr-5 rounded-xl border text-sm outline-none text-center"
                          style={{ borderColor: "#DDD6FE", backgroundColor: "#FAFAFA", color: S.text }}
                          placeholder="—"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold" style={{ color: S.muted }}>″</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSaveMeasure}
                  disabled={savingMeasure}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}
                >
                  <Check size={14} /> {savingMeasure ? "সংরক্ষণ..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            ) : (
              <div className="p-4">
                {Object.values(measurement ?? {}).some(v => v != null) ? (
                  <div className="grid grid-cols-4 gap-2">
                    {MEASURE_FIELDS.map(f => {
                      const val = measurement?.[f.key];
                      return (
                        <div key={f.key} className="text-center p-2 rounded-xl" style={{ backgroundColor: val != null ? "#F5F3FF" : "#F9FAFB" }}>
                          <p className="text-[10px] mb-1" style={{ color: S.muted }}>{f.label}</p>
                          <p className="text-sm font-bold" style={{ color: val != null ? "#8B5CF6" : "#D1D5DB" }}>
                            {val != null ? `${val}″` : "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-sm py-4" style={{ color: S.muted }}>
                    এই কাস্টমারের কোনো মাপ সংরক্ষিত নেই।{" "}
                    <button onClick={() => setMeasureEdit(true)} className="underline" style={{ color: "#8B5CF6" }}>মাপ যোগ করুন</button>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          <div className="px-5 py-3 border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
            <h3 className="font-semibold text-sm" style={{ color: S.text }}>অর্ডার ইতিহাস</h3>
          </div>
          {customer.orders.length === 0 ? (
            <div className="text-center py-10"><p className="text-sm" style={{ color: S.muted }}>কোনো অর্ডার নেই।</p></div>
          ) : (
            customer.orders.map((o, i) => {
              const st = getStatusStyle(o.status);
              return (
                <Link key={o.id} href={`/orders/${o.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 border-b last:border-0 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: S.border }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono mb-0.5" style={{ color: S.muted }}>#{o.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm truncate" style={{ color: S.secondary }}>
                      {o.items.slice(0, 2).map(it => {
                        if (it.comboId) {
                          if (it.comboSnapshot) { try { return (JSON.parse(it.comboSnapshot) as { name: string }).name; } catch { /* fall through */ } }
                          return it.combo?.name ?? "কমবো";
                        }
                        return it.product?.name ?? "পণ্য";
                      }).join(", ")}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm" style={{ color: S.text }}>{formatBDT(o.totalAmount)}</p>
                    <div className="flex items-center gap-2 justify-end mt-0.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: st.bg, color: st.text }}>{st.label}</span>
                      <span className="text-xs" style={{ color: S.muted }}>{formatRelativeDate(o.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
