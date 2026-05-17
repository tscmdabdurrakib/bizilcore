"use client";

import { useEffect, useState, useCallback } from "react";
import { PawPrint, Plus, X, Search, Loader2, Phone } from "lucide-react";
import Link from "next/link";
import DatePicker from "@/components/ui/DatePicker";

interface Pet {
  id: string; name: string; type: string; breed?: string | null; gender?: string | null;
  weight?: number | null; color?: string | null; isActive: boolean;
  customer: { id: string; name: string; phone?: string | null };
  _count: { appointments: number; healthLogs: number };
  healthLogs: { nextDueDate: string | null; logType: string }[];
  appointments: { date: string; type: string }[];
}

const PET_COLOR = "#EA580C";
const PET_LIGHT = "#FFF7ED";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const PET_TYPES = [
  { key: "all", label: "সব", icon: "🐾" },
  { key: "dog", label: "কুকুর", icon: "🐕" },
  { key: "cat", label: "বিড়াল", icon: "🐈" },
  { key: "bird", label: "পাখি", icon: "🐦" },
  { key: "fish", label: "মাছ", icon: "🐟" },
  { key: "rabbit", label: "খরগোশ", icon: "🐇" },
  { key: "turtle", label: "কচ্ছপ", icon: "🐢" },
  { key: "other", label: "অন্যান্য", icon: "🐾" },
];

const blank = { ownerName: "", ownerPhone: "", name: "", type: "dog", breed: "", gender: "", color: "", weight: "", dateOfBirth: "", microchipId: "", allergies: "", chronicIllness: "" };

export default function PetsBoard() {
  const [pets, setPets]       = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeTab, setTypeTab] = useState("all");
  const [search, setSearch]   = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm]       = useState({ ...blank });
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (typeTab !== "all") p.set("type", typeTab);
    if (search) p.set("search", search);
    const res = await fetch(`/api/petshop/pets?${p}`);
    setPets(await res.json());
    setLoading(false);
  }, [typeTab, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") setShowNew(true);
  }, []);

  const handleSave = async () => {
    if (!form.ownerName || !form.ownerPhone || !form.name) return;
    setSaving(true);
    try {
      await fetch("/api/petshop/pets", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      setShowNew(false); setForm({ ...blank }); load();
    } finally { setSaving(false); }
  };

  const iconFor = (type: string) => PET_TYPES.find(p => p.key === type)?.icon ?? "🐾";

  function daysUntil(d: string | null) {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <PawPrint size={20} style={{ color: PET_COLOR }} />
          <h1 className="text-lg font-black" style={{ color: S.text }}>পশু-পাখি রেজিস্ট্রি</h1>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: PET_COLOR }}>
          <Plus size={15} /> নতুন রেজিস্ট্রেশন
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পোষা প্রাণীর নাম বা মালিকের ফোন..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
      </div>

      {/* Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {PET_TYPES.map(t => (
          <button key={t.key} onClick={() => setTypeTab(t.key)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border flex items-center gap-1"
            style={typeTab === t.key ? { backgroundColor: PET_COLOR, color: "#fff", borderColor: PET_COLOR } : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin" style={{ color: PET_COLOR }} /></div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <span className="text-5xl">🐾</span>
          <p className="text-sm" style={{ color: S.muted }}>কোনো পশু-পাখি রেজিস্ট্রেশন পাওয়া যায়নি</p>
          <button onClick={() => setShowNew(true)} className="text-sm font-bold" style={{ color: PET_COLOR }}>+ নতুন রেজিস্ট্রেশন</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map(pet => {
            const nextDue = pet.healthLogs[0];
            const days = nextDue ? daysUntil(nextDue.nextDueDate) : null;
            const overdue = days !== null && days < 0;
            const dueSoon = days !== null && days >= 0 && days <= 7;
            return (
              <Link key={pet.id} href={`/petshop/pets/${pet.id}`}
                className="rounded-2xl border p-4 transition-all hover:shadow-md block"
                style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: PET_LIGHT }}>
                      {iconFor(pet.type)}
                    </div>
                    <div>
                      <p className="font-black text-base" style={{ color: S.text }}>{pet.name}</p>
                      <p className="text-xs" style={{ color: S.muted }}>{pet.breed ?? PET_TYPES.find(t => t.key === pet.type)?.label ?? pet.type}</p>
                    </div>
                  </div>
                  {!pet.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>Inactive</span>
                  )}
                </div>

                <div className="border-t pt-3" style={{ borderColor: S.border }}>
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{pet.customer.name}</p>
                  {pet.customer.phone && (
                    <a href={`tel:${pet.customer.phone}`} onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs mt-0.5" style={{ color: PET_COLOR }}>
                      <Phone size={10} /> {pet.customer.phone}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {pet._count.appointments > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}>
                      {pet._count.appointments} appt
                    </span>
                  )}
                  {pet._count.healthLogs > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: PET_LIGHT, color: PET_COLOR }}>
                      {pet._count.healthLogs} log
                    </span>
                  )}
                  {(overdue || dueSoon) && nextDue && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: overdue ? "#FEE2E2" : "#FFFBEB", color: overdue ? "#EF4444" : "#F59E0B" }}>
                      {overdue ? `${nextDue.logType} overdue!` : `${nextDue.logType} ${days}d`}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New Pet Registration Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl" style={{ backgroundColor: S.surface }}>
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10" style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="font-black text-base" style={{ color: S.text }}>নতুন রেজিস্ট্রেশন</h2>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}><X size={15} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Owner */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>মালিকের তথ্য</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                    placeholder="মালিকের নাম *" className="h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                  <input value={form.ownerPhone} onChange={e => setForm(f => ({ ...f, ownerPhone: e.target.value }))}
                    placeholder="ফোন নম্বর *" className="h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                </div>
              </div>

              {/* Pet Info */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>পোষা প্রাণীর তথ্য</p>
                <div className="space-y-2">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="পোষা প্রাণীর নাম *" className="w-full h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                  <div className="grid grid-cols-3 gap-2">
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="h-11 px-2 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>
                      {PET_TYPES.filter(p => p.key !== "all").map(p => <option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}
                    </select>
                    <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                      className="h-11 px-2 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>
                      <option value="">লিঙ্গ</option><option value="male">নর</option><option value="female">মাদি</option><option value="unknown">অজানা</option>
                    </select>
                    <input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                      placeholder="ওজন (kg)" type="number" className="h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
                      placeholder="জাত (ঐচ্ছিক)" className="h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                    <input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                      placeholder="রঙ" className="h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                    <DatePicker
  value={form.dateOfBirth}
  onChange={v => setForm(f => ({ ...f, dateOfBirth: v }))}
  className="h-11 px-3 rounded-xl border text-sm"
  style={{ borderColor: S.border, color: S.text }}
/>
                    <input value={form.microchipId} onChange={e => setForm(f => ({ ...f, microchipId: e.target.value }))}
                      placeholder="Microchip ID" className="h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                  </div>
                  <textarea value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
                    placeholder="Allergies (ঐচ্ছিক)" rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ borderColor: S.border, color: S.text }} />
                  <textarea value={form.chronicIllness} onChange={e => setForm(f => ({ ...f, chronicIllness: e.target.value }))}
                    placeholder="দীর্ঘস্থায়ী রোগ (ঐচ্ছিক)" rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none" style={{ borderColor: S.border, color: S.text }} />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2" style={{ backgroundColor: PET_COLOR }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : "✓ রেজিস্ট্রেশন করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
