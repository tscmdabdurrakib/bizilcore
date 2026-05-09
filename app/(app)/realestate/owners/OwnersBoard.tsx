"use client";

import { useEffect, useState } from "react";
import { UserCog, Plus, X, Search, Loader2, Phone } from "lucide-react";

interface Owner {
  id: string; name: string; phone: string; nid?: string | null; address?: string | null;
  bankInfo?: string | null; note?: string | null;
  _count: { properties: number };
  properties: { id: string; propertyCode: string; title: string; status: string }[];
}

const RE_COLOR = "#0891B2";
const RE_LIGHT = "#E0F2FE";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };
const blank = { name: "", phone: "", nid: "", address: "", bankInfo: "", note: "" };

export default function OwnersBoard() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const p = new URLSearchParams(); if (search) p.set("search", search);
    const res = await fetch(`/api/realestate/owners?${p}`);
    setOwners(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const handleSave = async () => {
    if (!form.name || !form.phone) return;
    setSaving(true);
    await fetch("/api/realestate/owners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowNew(false); setForm({ ...blank }); setSaving(false); load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <UserCog size={20} style={{ color: RE_COLOR }} />
          <h1 className="text-lg font-black" style={{ color: S.text }}>Property Owner</h1>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: RE_COLOR }}>
          <Plus size={15} /> নতুন Owner
        </button>
      </div>
      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম বা ফোন..."
          className="w-full h-10 pl-9 pr-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin" style={{ color: RE_COLOR }} /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {owners.map(o => (
            <div key={o.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base"
                  style={{ backgroundColor: RE_LIGHT, color: RE_COLOR }}>{o.name[0]}</div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: RE_LIGHT, color: RE_COLOR }}>
                  {o._count.properties} property
                </span>
              </div>
              <p className="font-bold text-sm" style={{ color: S.text }}>{o.name}</p>
              <a href={`tel:${o.phone}`} className="flex items-center gap-1 text-xs mt-0.5" style={{ color: RE_COLOR }}>
                <Phone size={10} /> {o.phone}
              </a>
              {o.address && <p className="text-xs mt-1" style={{ color: S.muted }}>{o.address}</p>}
              {o.properties.length > 0 && (
                <div className="mt-3 space-y-1">
                  {o.properties.slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg"
                      style={{ backgroundColor: "#F9F9F8" }}>
                      <span className="font-semibold" style={{ color: RE_COLOR }}>{p.propertyCode}</span>
                      <span className="truncate max-w-24 mx-1" style={{ color: S.muted }}>{p.title}</span>
                      <span className="font-bold" style={{ color: p.status === "available" ? "#10B981" : "#6B7280" }}>
                        {p.status === "available" ? "✓" : "●"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {o.bankInfo && <p className="text-[10px] mt-2 px-2 py-1 rounded-lg" style={{ backgroundColor: "#F9F9F8", color: S.muted }}>🏦 {o.bankInfo}</p>}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-3" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h2 className="font-black text-base" style={{ color: S.text }}>নতুন Owner</h2>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}><X size={15} /></button>
            </div>
            {[
              { label: "নাম *", key: "name" }, { label: "ফোন *", key: "phone" },
              { label: "NID", key: "nid" }, { label: "ঠিকানা", key: "address" },
              { label: "ব্যাংক তথ্য", key: "bankInfo" }, { label: "নোট", key: "note" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.muted }}>{f.label}</label>
                <input value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center" style={{ backgroundColor: RE_COLOR }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : "✓ সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
