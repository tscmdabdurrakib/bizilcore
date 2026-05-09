"use client";

import { useEffect, useState, useCallback } from "react";
import { Home, Plus, X, Search, Loader2, Bed, Bath, MapPin, ChevronRight, Edit2, Check } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Property {
  id: string; propertyCode: string; title: string; type: string; listingType: string;
  area: number; areaUnit: string; floor?: number; bedrooms?: number; bathrooms?: number;
  location: string; salePrice?: number; rentPrice?: number; negotiable: boolean;
  status: string; amenities: string[]; images: string[]; description?: string;
  owner?: { id: string; name: string; phone: string } | null;
  _count?: { leads: number; deals: number };
}

const RE_COLOR = "#0891B2";
const RE_LIGHT = "#E0F2FE";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const TYPE_META: Record<string, { label: string; color: string }> = {
  flat:       { label: "Flat",       color: "#3B82F6" },
  house:      { label: "House",      color: "#10B981" },
  plot:       { label: "Plot",       color: "#F59E0B" },
  commercial: { label: "Commercial", color: "#8B5CF6" },
  office:     { label: "Office",     color: "#0891B2" },
  warehouse:  { label: "Warehouse",  color: "#6B7280" },
};
const STATUS_META: Record<string, { label: string; color: string }> = {
  available:         { label: "Available",          color: "#10B981" },
  under_negotiation: { label: "আলোচনায়",           color: "#F59E0B" },
  sold:              { label: "Sold",               color: "#6B7280" },
  rented:            { label: "Rented",             color: "#3B82F6" },
  withdrawn:         { label: "Withdrawn",          color: "#EF4444" },
};
const AMENITY_LIST = ["Parking","Elevator","Generator","Gym","Rooftop","Security","Gas Line","Municipality Water","CCTV","Swimming Pool"];
const TYPES = [{ key: "all", label: "সব" }, ...Object.entries(TYPE_META).map(([k, v]) => ({ key: k, label: v.label }))];
const LISTING_TYPES = [{ key: "all", label: "Sale+Rent" }, { key: "sale", label: "বিক্রয়" }, { key: "rent", label: "ভাড়া" }];
const STATUSES = [{ key: "all", label: "সব" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ key: k, label: v.label }))];

const blank = { title: "", type: "flat", listingType: "sale", area: "", areaUnit: "sqft", floor: "", totalFloors: "", bedrooms: "", bathrooms: "", location: "", address: "", salePrice: "", rentPrice: "", negotiable: true, facing: "", readyToMove: true, description: "", amenities: [] as string[], ownerName: "", ownerPhone: "", ownerId: "" };

export default function PropertiesBoard() {
  const [props, setProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Property | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [saving, setSaving] = useState(false);
  const [typeTab, setTypeTab] = useState("all");
  const [listTab, setListTab] = useState("all");
  const [statusTab, setStatusTab] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (typeTab !== "all") p.set("type", typeTab);
    if (listTab !== "all") p.set("listingType", listTab);
    if (statusTab !== "all") p.set("status", statusTab);
    if (search) p.set("search", search);
    const res = await fetch(`/api/realestate/properties?${p}`);
    setProps(await res.json());
    setLoading(false);
  }, [typeTab, listTab, statusTab, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") setShowNew(true);
  }, []);

  const toggleAmenity = (a: string) => setForm(f => ({
    ...f, amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a],
  }));

  const handleSave = async () => {
    if (!form.title || !form.location || !form.area) return;
    setSaving(true);
    try {
      await fetch("/api/realestate/properties", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      setShowNew(false);
      setForm({ ...blank });
      load();
    } finally { setSaving(false); }
  };

  const handleStatusUpdate = async (propId: string, status: string) => {
    await fetch(`/api/realestate/properties/${propId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    load();
    if (selected?.id === propId) setSelected(p => p ? { ...p, status } : p);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Home size={20} style={{ color: RE_COLOR }} />
          <h1 className="text-lg font-black" style={{ color: S.text }}>Property তালিকা</h1>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: RE_COLOR }}>
          <Plus size={15} /> নতুন Property
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম বা এলাকা দিয়ে খুঁজুন..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setTypeTab(t.key)}
              className="px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap border"
              style={typeTab === t.key ? { backgroundColor: RE_COLOR, color: "#fff", borderColor: RE_COLOR } : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {LISTING_TYPES.map(t => (
            <button key={t.key} onClick={() => setListTab(t.key)}
              className="px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap border"
              style={listTab === t.key ? { backgroundColor: "#0F6E56", color: "#fff", borderColor: "#0F6E56" } : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
              {t.label}
            </button>
          ))}
          {STATUSES.map(t => (
            <button key={t.key} onClick={() => setStatusTab(t.key)}
              className="px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap border"
              style={statusTab === t.key ? { backgroundColor: "#6B7280", color: "#fff", borderColor: "#6B7280" } : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={26} className="animate-spin" style={{ color: RE_COLOR }} /></div>
      ) : props.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: RE_LIGHT }}>
            <Home size={22} style={{ color: RE_COLOR }} />
          </div>
          <p className="text-sm" style={{ color: S.muted }}>কোনো property পাওয়া যায়নি</p>
          <button onClick={() => setShowNew(true)} className="text-sm font-bold" style={{ color: RE_COLOR }}>+ নতুন যোগ করুন</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {props.map(p => {
            const tm = TYPE_META[p.type] ?? { label: p.type, color: "#6B7280" };
            const sm = STATUS_META[p.status] ?? { label: p.status, color: "#6B7280" };
            return (
              <div key={p.id} onClick={() => setSelected(p)}
                className="rounded-2xl border overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                style={{ backgroundColor: S.surface, borderColor: selected?.id === p.id ? RE_COLOR : S.border }}>
                {/* Image placeholder */}
                <div className="h-36 flex items-center justify-center relative" style={{ backgroundColor: `${tm.color}15` }}>
                  {p.images[0] ? (
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  ) : (
                    <Home size={40} style={{ color: tm.color, opacity: 0.5 }} />
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: tm.color, color: "#fff" }}>{tm.label}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: sm.color, color: "#fff" }}>{sm.label}</span>
                  </div>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold bg-white/90" style={{ color: RE_COLOR }}>{p.propertyCode}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-sm leading-snug" style={{ color: S.text }}>{p.title}</h3>
                  <div className="flex items-center gap-1 mt-1" style={{ color: S.muted }}>
                    <MapPin size={11} /><span className="text-xs">{p.location}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: S.muted }}>
                    <span>{p.area} {p.areaUnit}</span>
                    {p.bedrooms && <span className="flex items-center gap-0.5"><Bed size={11} />{p.bedrooms}BR</span>}
                    {p.bathrooms && <span className="flex items-center gap-0.5"><Bath size={11} />{p.bathrooms}BA</span>}
                  </div>
                  <div className="mt-3">
                    {p.salePrice && <p className="font-black text-base" style={{ color: RE_COLOR }}>{formatBDT(p.salePrice)}</p>}
                    {p.rentPrice && <p className="text-sm font-bold" style={{ color: "#10B981" }}>{formatBDT(p.rentPrice)}/মাস</p>}
                    {p.negotiable && <p className="text-xs" style={{ color: S.muted }}>Negotiable</p>}
                  </div>
                  {(p._count?.leads || p._count?.deals) ? (
                    <div className="flex gap-2 mt-2">
                      {p._count.leads > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F5F3FF", color: "#8B5CF6" }}>{p._count.leads} lead</span>}
                      {p._count.deals > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFFBEB", color: "#F59E0B" }}>{p._count.deals} deal</span>}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm h-full overflow-y-auto p-5 space-y-4"
            style={{ backgroundColor: S.surface }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: RE_LIGHT, color: RE_COLOR }}>{selected.propertyCode}</span>
                <h2 className="font-bold text-base mt-1" style={{ color: S.text }}>{selected.title}</h2>
                <div className="flex items-center gap-1 mt-0.5" style={{ color: S.muted }}>
                  <MapPin size={11} /><span className="text-xs">{selected.location}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}><X size={15} /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: "Area", value: `${selected.area} ${selected.areaUnit}` },
                { label: "Type", value: TYPE_META[selected.type]?.label ?? selected.type },
                ...(selected.bedrooms ? [{ label: "Bedroom", value: String(selected.bedrooms) }] : []),
                ...(selected.bathrooms ? [{ label: "Bathroom", value: String(selected.bathrooms) }] : []),
              ].map(i => (
                <div key={i.label} className="rounded-xl p-2" style={{ backgroundColor: "#F9F9F8" }}>
                  <p className="text-[10px]" style={{ color: S.muted }}>{i.label}</p>
                  <p className="font-bold" style={{ color: S.text }}>{i.value}</p>
                </div>
              ))}
            </div>

            {selected.salePrice && (
              <div className="rounded-xl p-3" style={{ backgroundColor: RE_LIGHT }}>
                <p className="text-xs" style={{ color: S.muted }}>বিক্রয় মূল্য</p>
                <p className="font-black text-xl" style={{ color: RE_COLOR }}>{formatBDT(selected.salePrice)}</p>
              </div>
            )}
            {selected.rentPrice && (
              <div className="rounded-xl p-3" style={{ backgroundColor: "#ECFDF5" }}>
                <p className="text-xs" style={{ color: S.muted }}>ভাড়া</p>
                <p className="font-black text-xl" style={{ color: "#10B981" }}>{formatBDT(selected.rentPrice)}/মাস</p>
              </div>
            )}

            {selected.owner && (
              <div className="rounded-xl p-3 border" style={{ borderColor: S.border }}>
                <p className="text-xs font-bold mb-1" style={{ color: S.muted }}>OWNER</p>
                <p className="font-semibold text-sm" style={{ color: S.text }}>{selected.owner.name}</p>
                <a href={`tel:${selected.owner.phone}`} className="text-xs" style={{ color: RE_COLOR }}>{selected.owner.phone}</a>
              </div>
            )}

            {selected.amenities.length > 0 && (
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>AMENITIES</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.amenities.map(a => (
                    <span key={a} className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ backgroundColor: RE_LIGHT, color: RE_COLOR }}>
                      <Check size={10} /> {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Status Update */}
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>STATUS আপডেট করুন</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <button key={k} onClick={() => handleStatusUpdate(selected.id, k)}
                    className="py-2 rounded-xl text-xs font-bold border transition-all"
                    style={selected.status === k
                      ? { backgroundColor: v.color, color: "#fff", borderColor: v.color }
                      : { backgroundColor: "transparent", color: v.color, borderColor: `${v.color}60` }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {selected.description && (
              <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: "#F9F9F8", color: S.muted }}>
                {selected.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Property Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl" style={{ backgroundColor: S.surface }}>
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b z-10"
              style={{ borderColor: S.border, backgroundColor: S.surface }}>
              <h2 className="font-black text-base" style={{ color: S.text }}>নতুন Property যোগ করুন</h2>
              <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: S.border }}><X size={15} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Basic */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>মূল তথ্য</p>
                <div className="space-y-3">
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Property title *" className="w-full h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>
                      {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <select value={form.listingType} onChange={e => setForm(f => ({ ...f, listingType: e.target.value }))}
                      className="h-11 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>
                      <option value="sale">বিক্রয়</option><option value="rent">ভাড়া</option><option value="both">উভয়</option>
                    </select>
                    <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="এলাকা / শহর *" className="col-span-2 h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                  </div>
                </div>
              </div>

              {/* Details */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>বিস্তারিত</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Area *", key: "area", placeholder: "1200" },
                    { label: "Bed", key: "bedrooms", placeholder: "3" },
                    { label: "Bath", key: "bathrooms", placeholder: "2" },
                    { label: "Floor", key: "floor", placeholder: "5" },
                    { label: "Total Floors", key: "totalFloors", placeholder: "12" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-semibold mb-0.5 block" style={{ color: S.muted }}>{f.label}</label>
                      <input type="number" value={(form as Record<string, string | boolean | string[]>)[f.key] as string}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} className="w-full h-10 px-3 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-semibold mb-0.5 block" style={{ color: S.muted }}>Unit</label>
                    <select value={form.areaUnit} onChange={e => setForm(f => ({ ...f, areaUnit: e.target.value }))}
                      className="w-full h-10 px-2 rounded-xl border text-xs" style={{ borderColor: S.border, color: S.text }}>
                      {["sqft","katha","bigha","acre"].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>মূল্য</p>
                <div className="grid grid-cols-2 gap-2">
                  {(form.listingType === "sale" || form.listingType === "both") && (
                    <input type="number" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                      placeholder="বিক্রয় মূল্য (৳)" className="h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                  )}
                  {(form.listingType === "rent" || form.listingType === "both") && (
                    <input type="number" value={form.rentPrice} onChange={e => setForm(f => ({ ...f, rentPrice: e.target.value }))}
                      placeholder="ভাড়া / মাস (৳)" className="h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                  )}
                  <label className="flex items-center gap-2 cursor-pointer col-span-2">
                    <input type="checkbox" checked={form.negotiable} onChange={e => setForm(f => ({ ...f, negotiable: e.target.checked }))} />
                    <span className="text-sm" style={{ color: S.text }}>Negotiable</span>
                  </label>
                </div>
              </div>

              {/* Owner */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>Owner তথ্য (ঐচ্ছিক)</p>
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))}
                    placeholder="Owner নাম" className="h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                  <input value={form.ownerPhone} onChange={e => setForm(f => ({ ...f, ownerPhone: e.target.value }))}
                    placeholder="ফোন নম্বর" className="h-11 px-4 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }} />
                </div>
              </div>

              {/* Amenities */}
              <div>
                <p className="text-xs font-bold mb-2" style={{ color: S.muted }}>Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_LIST.map(a => (
                    <button key={a} onClick={() => toggleAmenity(a)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                      style={form.amenities.includes(a)
                        ? { backgroundColor: RE_COLOR, color: "#fff", borderColor: RE_COLOR }
                        : { backgroundColor: S.surface, color: S.muted, borderColor: S.border }}>
                      {form.amenities.includes(a) && "✓ "}{a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="বিবরণ (ঐচ্ছিক)" rows={3}
                className="w-full px-4 py-3 rounded-xl border text-sm resize-none" style={{ borderColor: S.border, color: S.text }} />

              <div className="flex gap-2">
                <button onClick={() => setShowNew(false)} className="flex-1 py-3 rounded-xl border font-semibold text-sm" style={{ borderColor: S.border, color: S.text }}>বাতিল</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: RE_COLOR }}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : "✓ সেভ করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
