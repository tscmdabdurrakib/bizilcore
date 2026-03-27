"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, X, FileText, Camera, User, Stethoscope, Loader2, Check, Trash2, Package2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface PrescriptionItem {
  id: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  medicine: { id: string; brandName: string } | null;
}

interface Prescription {
  id: string;
  patientName: string;
  patientPhone: string | null;
  doctorName: string | null;
  photoUrl: string | null;
  note: string | null;
  saleTotal: number;
  createdAt: string;
  items: PrescriptionItem[];
}

interface MedicineOption {
  id: string;
  brandName: string;
  genericName: string | null;
  sellPrice: number;
  unit: string;
}

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)",
  muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)",
};

const EMPTY_FORM = { patientName: "", patientPhone: "", doctorName: "", photoUrl: "", note: "" };

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [medicines, setMedicines] = useState<MedicineOption[]>([]);
  const [cartItems, setCartItems] = useState<{ medicineId: string | null; medicineName: string; quantity: number; unitPrice: number; subtotal: number }[]>([]);
  const [medSearch, setMedSearch] = useState("");
  const [medSuggestions, setMedSuggestions] = useState<MedicineOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [detail, setDetail] = useState<Prescription | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const r = await fetch(`/api/prescriptions?${params}`);
    const data = await r.json();
    setPrescriptions(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  const fetchMedicines = useCallback(async () => {
    const r = await fetch("/api/medicines");
    const data = await r.json();
    setMedicines(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchPrescriptions, 300);
    return () => clearTimeout(t);
  }, [fetchPrescriptions]);

  useEffect(() => {
    if (showModal) fetchMedicines();
  }, [showModal, fetchMedicines]);

  useEffect(() => {
    if (!medSearch.trim()) { setMedSuggestions([]); return; }
    const q = medSearch.toLowerCase();
    setMedSuggestions(medicines.filter(m =>
      m.brandName.toLowerCase().includes(q) || (m.genericName ?? "").toLowerCase().includes(q)
    ).slice(0, 8));
  }, [medSearch, medicines]);

  function addMedicineToCart(m: MedicineOption) {
    setCartItems(prev => {
      const exists = prev.find(i => i.medicineId === m.id);
      if (exists) return prev.map(i => i.medicineId === m.id ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice } : i);
      return [...prev, { medicineId: m.id, medicineName: m.brandName, quantity: 1, unitPrice: m.sellPrice, subtotal: m.sellPrice }];
    });
    setMedSearch("");
    setMedSuggestions([]);
  }

  function addManualItem() {
    if (!medSearch.trim()) return;
    setCartItems(prev => [...prev, { medicineId: null, medicineName: medSearch.trim(), quantity: 1, unitPrice: 0, subtotal: 0 }]);
    setMedSearch("");
    setMedSuggestions([]);
  }

  function updateQty(i: number, qty: number) {
    setCartItems(prev => prev.map((it, idx) => idx === i ? { ...it, quantity: qty, subtotal: qty * it.unitPrice } : it));
  }

  function updatePrice(i: number, price: number) {
    setCartItems(prev => prev.map((it, idx) => idx === i ? { ...it, unitPrice: price, subtotal: it.quantity * price } : it));
  }

  function removeItem(i: number) {
    setCartItems(prev => prev.filter((_, idx) => idx !== i));
  }

  const cartTotal = cartItems.reduce((s, i) => s + i.subtotal, 0);

  async function handleSave() {
    if (!form.patientName.trim()) { showToast("error", "রোগীর নাম আবশ্যক।"); return; }
    setSaving(true);
    const r = await fetch("/api/prescriptions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items: cartItems }),
    });
    setSaving(false);
    if (r.ok) {
      showToast("success", "প্রেসক্রিপশন সেভ হয়েছে ✓");
      setShowModal(false);
      setForm({ ...EMPTY_FORM });
      setCartItems([]);
      fetchPrescriptions();
    } else {
      const d = await r.json();
      showToast("error", d.error ?? "সেভ ব্যর্থ হয়েছে।");
    }
  }

  const inp = (label: string, key: keyof typeof form, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>{label}</label>
      <input type={type} value={form[key]} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 14, outline: "none" }} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      {/* Add Prescription Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="rounded-2xl p-6 w-full max-w-2xl my-4" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg" style={{ color: S.text }}>প্রেসক্রিপশন যোগ করুন</h3>
              <button onClick={() => setShowModal(false)} style={{ color: S.muted }}><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {/* Patient Info */}
              <div className="p-4 rounded-xl border" style={{ borderColor: S.border }}>
                <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: S.muted }}>
                  <User size={12} /> রোগীর তথ্য
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("রোগীর নাম *", "patientName", "text", "যেমন: আব্দুল করিম")}
                  {inp("মোবাইল নম্বর", "patientPhone", "tel", "01XXXXXXXXX")}
                </div>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: S.border }}>
                <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: S.muted }}>
                  <Stethoscope size={12} /> ডাক্তারের তথ্য
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inp("ডাক্তারের নাম", "doctorName", "text", "যেমন: Dr. রহিম")}
                  {inp("প্রেসক্রিপশন ছবি URL", "photoUrl", "url", "https://...")}
                </div>
              </div>

              {/* Medicine Cart */}
              <div className="p-4 rounded-xl border" style={{ borderColor: S.border }}>
                <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: S.muted }}>
                  <Package2 size={12} /> ওষুধ যোগ করুন
                </p>

                <div className="relative mb-3">
                  <input type="text" value={medSearch} onChange={e => setMedSearch(e.target.value)}
                    placeholder="ওষুধের নাম লিখুন..."
                    style={{ width: "100%", height: 40, border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "0 12px", fontSize: 14, outline: "none" }} />
                  {medSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 rounded-xl border shadow-lg z-20 mt-1 overflow-hidden"
                      style={{ backgroundColor: S.surface, borderColor: S.border }}>
                      {medSuggestions.map(m => (
                        <button key={m.id} onClick={() => addMedicineToCart(m)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/5 text-left transition-colors">
                          <div>
                            <p className="text-sm font-medium" style={{ color: S.text }}>{m.brandName}</p>
                            {m.genericName && <p className="text-xs" style={{ color: S.muted }}>{m.genericName}</p>}
                          </div>
                          <span className="text-sm font-bold font-mono" style={{ color: "#10B981" }}>{formatBDT(m.sellPrice)}</span>
                        </button>
                      ))}
                      {medSearch.trim() && (
                        <button onClick={addManualItem}
                          className="w-full flex items-center gap-2 px-4 py-2.5 border-t text-sm text-left hover:bg-black/5 transition-colors"
                          style={{ borderColor: S.border, color: S.secondary }}>
                          <Plus size={13} /> "{medSearch}" হাতে যোগ করুন
                        </button>
                      )}
                    </div>
                  )}
                  {medSearch.trim() && medSuggestions.length === 0 && (
                    <button onClick={addManualItem}
                      className="mt-1.5 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border"
                      style={{ borderColor: S.border, color: S.secondary, backgroundColor: S.surface }}>
                      <Plus size={12} /> "{medSearch}" হাতে যোগ করুন
                    </button>
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="space-y-2">
                    {cartItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border" style={{ borderColor: S.border }}>
                        <p className="flex-1 text-sm font-medium truncate" style={{ color: S.text }}>{item.medicineName}</p>
                        <input type="number" value={item.quantity} min={1}
                          onChange={e => updateQty(i, Number(e.target.value))}
                          style={{ width: 60, height: 32, border: `1px solid ${S.border}`, borderRadius: 6, backgroundColor: S.surface, color: S.text, padding: "0 8px", fontSize: 13, outline: "none", textAlign: "center" }} />
                        <span className="text-xs" style={{ color: S.muted }}>×</span>
                        <input type="number" value={item.unitPrice} min={0}
                          onChange={e => updatePrice(i, Number(e.target.value))}
                          style={{ width: 80, height: 32, border: `1px solid ${S.border}`, borderRadius: 6, backgroundColor: S.surface, color: S.text, padding: "0 8px", fontSize: 13, outline: "none", textAlign: "right" }} />
                        <span className="text-xs font-bold font-mono w-20 text-right" style={{ color: "#10B981" }}>{formatBDT(item.subtotal)}</span>
                        <button onClick={() => removeItem(i)} style={{ color: "#E24B4A" }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1">
                      <span className="text-sm font-bold" style={{ color: S.text }}>মোট: <span style={{ color: "#10B981" }}>{formatBDT(cartTotal)}</span></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.secondary }}>মন্তব্য</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  rows={2} placeholder="অতিরিক্ত তথ্য..."
                  style={{ width: "100%", border: `1px solid ${S.border}`, borderRadius: 8, backgroundColor: S.surface, color: S.text, padding: "10px 12px", fontSize: 14, outline: "none", resize: "none" }} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ backgroundColor: "#8B5CF6" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="rounded-2xl p-6 w-full max-w-lg my-4" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: S.text }}>প্রেসক্রিপশন বিস্তারিত</h3>
              <button onClick={() => setDetail(null)} style={{ color: S.muted }}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs" style={{ color: S.muted }}>রোগী</p><p className="font-semibold" style={{ color: S.text }}>{detail.patientName}</p></div>
                {detail.patientPhone && <div><p className="text-xs" style={{ color: S.muted }}>মোবাইল</p><p className="font-semibold" style={{ color: S.text }}>{detail.patientPhone}</p></div>}
                {detail.doctorName && <div><p className="text-xs" style={{ color: S.muted }}>ডাক্তার</p><p className="font-semibold" style={{ color: S.text }}>{detail.doctorName}</p></div>}
                <div><p className="text-xs" style={{ color: S.muted }}>তারিখ</p><p className="font-semibold" style={{ color: S.text }}>{new Date(detail.createdAt).toLocaleDateString("bn-BD")}</p></div>
              </div>
              {detail.photoUrl && (
                <div>
                  <p className="text-xs font-medium mb-1.5" style={{ color: S.muted }}>প্রেসক্রিপশন ছবি</p>
                  <a href={detail.photoUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border"
                    style={{ borderColor: S.border, color: S.primary }}>
                    <Camera size={14} /> ছবি দেখুন
                  </a>
                </div>
              )}
              {detail.items.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: S.muted }}>ওষুধ তালিকা</p>
                  <div className="space-y-1.5">
                    {detail.items.map(it => (
                      <div key={it.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ backgroundColor: S.surface }}>
                        <span className="text-sm" style={{ color: S.text }}>{it.medicineName}</span>
                        <span className="text-xs font-mono" style={{ color: S.secondary }}>{it.quantity}× {formatBDT(it.unitPrice)} = {formatBDT(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-2 pt-2 border-t" style={{ borderColor: S.border }}>
                    <span className="text-sm font-bold" style={{ color: S.text }}>মোট: <span style={{ color: "#8B5CF6" }}>{formatBDT(detail.saleTotal)}</span></span>
                  </div>
                </div>
              )}
              {detail.note && <div><p className="text-xs" style={{ color: S.muted }}>মন্তব্য</p><p className="text-sm mt-0.5" style={{ color: S.text }}>{detail.note}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}>
            <FileText size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>প্রেসক্রিপশন</h1>
            <p className="text-xs" style={{ color: S.muted }}>মোট {prescriptions.length}টি রেকর্ড</p>
          </div>
        </div>
        <button onClick={() => { setForm({ ...EMPTY_FORM }); setCartItems([]); setShowModal(true); }}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}>
          <Plus size={16} /> প্রেসক্রিপশন যোগ করুন
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 h-10 rounded-xl border w-full max-w-sm" style={{ borderColor: S.border, backgroundColor: S.surface }}>
        <Search size={15} style={{ color: S.muted }} />
        <input className="flex-1 bg-transparent outline-none text-sm" placeholder="রোগী / ডাক্তার খুঁজুন..."
          value={search} onChange={e => setSearch(e.target.value)} style={{ color: S.text }} />
      </div>

      {/* Prescription List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: "#8B5CF6" }} />
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={40} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="font-medium" style={{ color: S.text }}>কোনো প্রেসক্রিপশন নেই।</p>
          <p className="text-sm mt-1" style={{ color: S.muted }}>উপরের বোতামে ক্লিক করে যোগ করুন।</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {prescriptions.map(p => (
            <button key={p.id} onClick={() => setDetail(p)}
              className="text-left p-4 rounded-2xl border hover:shadow-md transition-all"
              style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F5F3FF" }}>
                  <FileText size={15} style={{ color: "#8B5CF6" }} />
                </div>
                {p.photoUrl && (
                  <div className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}>
                    <Camera size={10} /> ছবি আছে
                  </div>
                )}
              </div>
              <p className="font-semibold text-sm" style={{ color: S.text }}>{p.patientName}</p>
              {p.doctorName && <p className="text-xs mt-0.5" style={{ color: S.muted }}>Dr. {p.doctorName}</p>}
              {p.patientPhone && <p className="text-xs" style={{ color: S.muted }}>{p.patientPhone}</p>}
              <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: S.border }}>
                <span className="text-xs" style={{ color: S.muted }}>{new Date(p.createdAt).toLocaleDateString("bn-BD")}</span>
                <span className="text-sm font-bold font-mono" style={{ color: "#8B5CF6" }}>{formatBDT(p.saleTotal)}</span>
              </div>
              {p.items.length > 0 && (
                <p className="text-xs mt-1" style={{ color: S.muted }}>{p.items.length}টি ওষুধ</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
