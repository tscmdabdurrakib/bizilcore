"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, X, Loader2, Edit2, Trash2, CheckCircle } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface TourPackage {
  id: string;
  name: string;
  destination: string;
  type: string;
  duration: string;
  inclusions: string[];
  exclusions: string[];
  adultPrice: number;
  childPrice?: number;
  infantPrice?: number;
  maxPersons?: number;
  description?: string;
  itinerary?: Array<{ day: number; title: string; details: string }>;
  imageUrl?: string;
  isActive: boolean;
}

const PACKAGE_TYPES = [
  { value: "domestic",      label: "দেশীয়" },
  { value: "international", label: "আন্তর্জাতিক" },
  { value: "hajj",          label: "হজ" },
  { value: "umrah",         label: "উমরাহ" },
  { value: "honeymoon",     label: "হানিমুন" },
  { value: "group",         label: "গ্রুপ ট্যুর" },
];

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  domestic:      { color: "#0891B2", bg: "#ECFEFF" },
  international: { color: "#7C3AED", bg: "#F5F3FF" },
  hajj:          { color: "#0F6E56", bg: "#E1F5EE" },
  umrah:         { color: "#0F6E56", bg: "#D1FAE5" },
  honeymoon:     { color: "#EC4899", bg: "#FDF2F8" },
  group:         { color: "#F59E0B", bg: "#FFFBEB" },
};

const emptyForm = {
  name: "", destination: "", type: "domestic", duration: "",
  adultPrice: "", childPrice: "", infantPrice: "", maxPersons: "",
  description: "", inclusions: [] as string[], exclusions: [] as string[],
  itinerary: [] as Array<{ day: number; title: string; details: string }>,
  imageUrl: "", isActive: true,
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

const inputCls = "w-full border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500";
const inputStyle = { borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)", color: "var(--c-text)" };

export default function PackagesBoard() {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TourPackage | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [chipInput, setChipInput] = useState({ inclusions: "", exclusions: "" });
  const [itineraryDay, setItineraryDay] = useState({ title: "", details: "" });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/travel/packages");
    if (res.ok) setPackages(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (pkg: TourPackage) => {
    setEditing(pkg);
    setForm({
      name: pkg.name, destination: pkg.destination, type: pkg.type, duration: pkg.duration,
      adultPrice: String(pkg.adultPrice), childPrice: pkg.childPrice ? String(pkg.childPrice) : "",
      infantPrice: pkg.infantPrice ? String(pkg.infantPrice) : "",
      maxPersons: pkg.maxPersons ? String(pkg.maxPersons) : "",
      description: pkg.description ?? "", inclusions: [...pkg.inclusions], exclusions: [...pkg.exclusions],
      itinerary: pkg.itinerary ? [...pkg.itinerary] : [],
      imageUrl: pkg.imageUrl ?? "", isActive: pkg.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.destination || !form.adultPrice) return;
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const body = editing ? { ...form, id: editing.id } : form;
    const res = await fetch("/api/travel/packages", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { await load(); setShowForm(false); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই প্যাকেজটি নিষ্ক্রিয় করবেন?")) return;
    await fetch(`/api/travel/packages?id=${id}`, { method: "DELETE" });
    await load();
  };

  const addChip = (field: "inclusions" | "exclusions") => {
    const val = chipInput[field].trim();
    if (!val) return;
    setForm(f => ({ ...f, [field]: [...f[field], val] }));
    setChipInput(c => ({ ...c, [field]: "" }));
  };

  const removeChip = (field: "inclusions" | "exclusions", idx: number) => {
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));
  };

  const addItineraryDay = () => {
    if (!itineraryDay.title) return;
    setForm(f => ({
      ...f,
      itinerary: [...f.itinerary, { day: f.itinerary.length + 1, title: itineraryDay.title, details: itineraryDay.details }],
    }));
    setItineraryDay({ title: "", details: "" });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#0891B2" }} /></div>;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: S.text }}>ট্যুর প্যাকেজ</h1>
          <p className="text-sm" style={{ color: S.muted }}>{packages.filter(p => p.isActive).length}টি সক্রিয় প্যাকেজ</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#0891B2" }}>
          <Plus size={16} /> নতুন প্যাকেজ
        </button>
      </div>

      {/* Package Grid */}
      {packages.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <MapPin size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো প্যাকেজ নেই। প্রথম প্যাকেজ তৈরি করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const typeColor = TYPE_COLORS[pkg.type] ?? { color: "#6B7280", bg: "#F3F4F6" };
            const typeLabel = PACKAGE_TYPES.find(t => t.value === pkg.type)?.label ?? pkg.type;
            return (
              <div key={pkg.id} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border, opacity: pkg.isActive ? 1 : 0.5 }}>
                {pkg.imageUrl ? (
                  <div className="h-36 overflow-hidden">
                    <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center" style={{ backgroundColor: typeColor.bg }}>
                    <MapPin size={28} style={{ color: typeColor.color }} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-sm leading-tight" style={{ color: S.text }}>{pkg.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: typeColor.bg, color: typeColor.color }}>{typeLabel}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: S.muted }}><MapPin size={11} className="inline mr-0.5" />{pkg.destination} · {pkg.duration}</p>
                  <p className="text-sm font-bold mb-3" style={{ color: "#0891B2" }}>জনপ্রতি {formatBDT(pkg.adultPrice)}</p>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(pkg)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-gray-50" style={{ borderColor: S.border, color: S.text }}>
                      <Edit2 size={12} /> সম্পাদনা
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors hover:bg-red-50" style={{ borderColor: "#FCA5A5" }}>
                      <Trash2 size={13} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 overflow-y-auto" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 space-y-4 mb-10" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ color: S.text }}>{editing ? "প্যাকেজ সম্পাদনা" : "নতুন প্যাকেজ তৈরি"}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>প্যাকেজের নাম *</label>
                <input className={inputCls} style={inputStyle} placeholder="যেমন: Cox's Bazar 3D/2N" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>গন্তব্য *</label>
                <input className={inputCls} style={inputStyle} placeholder="Cox's Bazar" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ধরন *</label>
                <select className={inputCls} style={inputStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {PACKAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সময়কাল *</label>
                <input className={inputCls} style={inputStyle} placeholder="3 Days / 2 Nights" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>সর্বোচ্চ যাত্রী</label>
                <input className={inputCls} style={inputStyle} type="number" placeholder="30" value={form.maxPersons} onChange={e => setForm(f => ({ ...f, maxPersons: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>প্রাপ্তবয়স্ক মূল্য *</label>
                <input className={inputCls} style={inputStyle} type="number" placeholder="৳" value={form.adultPrice} onChange={e => setForm(f => ({ ...f, adultPrice: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>শিশু মূল্য</label>
                <input className={inputCls} style={inputStyle} type="number" placeholder="৳" value={form.childPrice} onChange={e => setForm(f => ({ ...f, childPrice: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ইনফ্যান্ট মূল্য</label>
                <input className={inputCls} style={inputStyle} type="number" placeholder="৳" value={form.infantPrice} onChange={e => setForm(f => ({ ...f, infantPrice: e.target.value }))} />
              </div>
            </div>

            {/* Inclusions */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>কী কী থাকছে (inclusions)</label>
              <div className="flex gap-2 mb-2">
                <input className={inputCls} style={inputStyle} placeholder="যেমন: হোটেল, নাস্তা..." value={chipInput.inclusions} onChange={e => setChipInput(c => ({ ...c, inclusions: e.target.value }))} onKeyDown={e => e.key === "Enter" && addChip("inclusions")} />
                <button onClick={() => addChip("inclusions")} className="px-3 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#0891B2" }}>যোগ</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.inclusions.map((inc, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
                    <CheckCircle size={10} /> {inc}
                    <button onClick={() => removeChip("inclusions", i)} className="hover:opacity-70"><X size={10} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Exclusions */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>কী কী থাকছে না (exclusions)</label>
              <div className="flex gap-2 mb-2">
                <input className={inputCls} style={inputStyle} placeholder="যেমন: ভিসা, লাঞ্চ..." value={chipInput.exclusions} onChange={e => setChipInput(c => ({ ...c, exclusions: e.target.value }))} onKeyDown={e => e.key === "Enter" && addChip("exclusions")} />
                <button onClick={() => addChip("exclusions")} className="px-3 py-2 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#EF4444" }}>যোগ</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {form.exclusions.map((exc, i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
                    <X size={10} /> {exc}
                    <button onClick={() => removeChip("exclusions", i)} className="hover:opacity-70"><X size={10} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Itinerary */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>দিনওয়ারি সূচি (Itinerary)</label>
              {form.itinerary.map((item, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5 p-2.5 rounded-xl" style={{ backgroundColor: "#ECFEFF" }}>
                  <span className="text-xs font-bold w-12 flex-shrink-0" style={{ color: "#0891B2" }}>দিন {item.day}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: S.text }}>{item.title}</p>
                    {item.details && <p className="text-xs" style={{ color: S.muted }}>{item.details}</p>}
                  </div>
                  <button onClick={() => setForm(f => ({ ...f, itinerary: f.itinerary.filter((_, j) => j !== i).map((d, j) => ({ ...d, day: j + 1 })) }))}><X size={13} style={{ color: S.muted }} /></button>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input className={inputCls} style={inputStyle} placeholder="শিরোনাম" value={itineraryDay.title} onChange={e => setItineraryDay(d => ({ ...d, title: e.target.value }))} />
                <input className={inputCls} style={inputStyle} placeholder="বিবরণ" value={itineraryDay.details} onChange={e => setItineraryDay(d => ({ ...d, details: e.target.value }))} />
              </div>
              <button onClick={addItineraryDay} className="mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ backgroundColor: "#7C3AED" }}>+ দিন যোগ করুন</button>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>বিবরণ</label>
              <textarea className={inputCls} style={{ ...inputStyle, height: "80px", resize: "none" }} placeholder="প্যাকেজ সম্পর্কে বিস্তারিত..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: S.muted }}>ছবির URL</label>
              <input className={inputCls} style={inputStyle} placeholder="https://..." value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.adultPrice} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "#0891B2" }}>
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
