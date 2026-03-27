"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Ruler, Search, Plus, X, Check, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { S } from "@/lib/theme";

interface MeasurementData {
  id?: string;
  chest: number | null;
  waist: number | null;
  hip: number | null;
  shoulder: number | null;
  sleeve: number | null;
  length: number | null;
  neck: number | null;
  inseam: number | null;
  notes: string | null;
  updatedAt?: string;
}

interface CustomerWithMeasurement {
  id: string;
  name: string;
  phone: string | null;
  measurements: MeasurementData[];
}

const MEASURE_FIELDS: { key: keyof MeasurementData; label: string; labelBn: string }[] = [
  { key: "chest",    label: "Chest",    labelBn: "বুক" },
  { key: "waist",    label: "Waist",    labelBn: "কোমর" },
  { key: "hip",      label: "Hip",      labelBn: "হিপ" },
  { key: "shoulder", label: "Shoulder", labelBn: "কাঁধ" },
  { key: "sleeve",   label: "Sleeve",   labelBn: "হাতা" },
  { key: "length",   label: "Length",   labelBn: "দৈর্ঘ্য" },
  { key: "neck",     label: "Neck",     labelBn: "গলা" },
  { key: "inseam",   label: "Inseam",   labelBn: "ভেতরের মাপ" },
];

const EMPTY_FORM = {
  chest: "", waist: "", hip: "", shoulder: "",
  sleeve: "", length: "", neck: "", inseam: "", notes: "",
};

function hasMeasurement(m: MeasurementData[] | undefined) {
  if (!m || m.length === 0) return false;
  return MEASURE_FIELDS.some(f => m[0][f.key] !== null && m[0][f.key] !== undefined);
}

export default function MeasurementsPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "with" | "without">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/measurements");
    if (r.status === 403) {
      router.push("/dashboard");
      return;
    }
    const d = await r.json();
    setCustomers(Array.isArray(d) ? d : []);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  function startEdit(c: CustomerWithMeasurement) {
    const m = c.measurements[0];
    setForm({
      chest:    m?.chest    != null ? String(m.chest)    : "",
      waist:    m?.waist    != null ? String(m.waist)    : "",
      hip:      m?.hip      != null ? String(m.hip)      : "",
      shoulder: m?.shoulder != null ? String(m.shoulder) : "",
      sleeve:   m?.sleeve   != null ? String(m.sleeve)   : "",
      length:   m?.length   != null ? String(m.length)   : "",
      neck:     m?.neck     != null ? String(m.neck)     : "",
      inseam:   m?.inseam   != null ? String(m.inseam)   : "",
      notes:    m?.notes    ?? "",
    });
    setEditingId(c.id);
    setExpandedId(c.id);
  }

  async function handleSave(customerId: string) {
    setSaving(true);
    const body: Record<string, number | string | null> = { customerId };
    MEASURE_FIELDS.forEach(f => {
      const val = (form as Record<string, string>)[f.key as string];
      body[f.key as string] = val !== "" ? parseFloat(val) : null;
    });
    body.notes = form.notes.trim() || null;

    const r = await fetch("/api/measurements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      setEditingId(null);
      load();
    } else {
      const data = await r.json();
      alert(data.error ?? "সংরক্ষণ ব্যর্থ হয়েছে।");
    }
    setSaving(false);
  }

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone?.includes(search) ?? false);
    const matchFilter =
      filter === "all" ? true :
      filter === "with" ? hasMeasurement(c.measurements) :
      !hasMeasurement(c.measurements);
    return matchSearch && matchFilter;
  });

  const withCount = customers.filter(c => hasMeasurement(c.measurements)).length;
  const withoutCount = customers.length - withCount;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)" }}>
            <Ruler size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>মাপজোখ</h1>
            <p className="text-xs" style={{ color: S.muted }}>কাস্টমারদের মাপ ও সাইজ</p>
          </div>
        </div>
        <Link
          href="/customers/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #EC4899, #BE185D)" }}
        >
          <Plus size={14} /> নতুন কাস্টমার
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "মোট কাস্টমার", value: customers.length, color: S.text,    bg: S.surface  },
          { label: "মাপ আছে",     value: withCount,          color: "#EC4899", bg: "#FDF2F8"  },
          { label: "মাপ নেই",     value: withoutCount,       color: "#F59E0B", bg: "#FFFBEB"  },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 border" style={{ backgroundColor: s.bg, borderColor: S.border }}>
            <p className="text-xs mb-1" style={{ color: S.muted }}>{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 p-1 rounded-xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {(["all", "with", "without"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filter === f ? { backgroundColor: "#EC4899", color: "#fff" } : { color: S.secondary }}
            >
              {f === "all" ? "সব" : f === "with" ? "মাপ আছে" : "মাপ নেই"}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="নাম বা নম্বর..."
            className="w-full h-9 pl-8 pr-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ backgroundColor: S.surface }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#FDF2F8" }}>
            <Ruler size={28} style={{ color: "#EC4899" }} />
          </div>
          <p className="font-semibold text-sm" style={{ color: S.secondary }}>কোনো কাস্টমার পাওয়া যায়নি</p>
          <Link href="/customers/new" className="mt-2 text-xs font-medium" style={{ color: "#EC4899" }}>
            + নতুন কাস্টমার যোগ করুন
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const m = c.measurements[0];
            const hasMeas = hasMeasurement(c.measurements);
            const isEditing = editingId === c.id;
            const isExpanded = expandedId === c.id;

            return (
              <div
                key={c.id}
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: S.surface, borderColor: S.border }}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ backgroundColor: hasMeas ? "#FDF2F8" : "#F3F4F6", color: hasMeas ? "#EC4899" : "#9CA3AF" }}
                      >
                        {c.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: S.text }}>{c.name}</p>
                        {c.phone && <p className="text-xs" style={{ color: S.muted }}>{c.phone}</p>}
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={hasMeas
                          ? { backgroundColor: "#FDF2F8", color: "#EC4899" }
                          : { backgroundColor: "#FEF9C3", color: "#CA8A04" }}
                      >
                        {hasMeas ? "✓ মাপ আছে" : "মাপ নেই"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(c)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #EC4899, #BE185D)" }}
                      >
                        {hasMeas ? "সম্পাদনা" : "মাপ যোগ"}
                      </button>
                      {hasMeas && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : c.id)}
                          className="p-1.5 rounded-xl border"
                          style={{ borderColor: S.border, color: S.muted }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: S.border }}>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {MEASURE_FIELDS.map(f => (
                          <div key={f.key}>
                            <label className="text-[11px] font-semibold mb-1 block" style={{ color: S.secondary }}>
                              {f.labelBn} <span className="font-normal opacity-60">({f.label})</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                step={0.25}
                                value={(form as Record<string, string>)[f.key as string]}
                                onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                                className="w-full h-9 pl-3 pr-7 rounded-xl border text-sm outline-none"
                                style={{ borderColor: S.border, backgroundColor: "#FAFAFA", color: S.text }}
                                placeholder="—"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold" style={{ color: S.muted }}>″</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold mb-1 block" style={{ color: S.secondary }}>নোট</label>
                        <textarea
                          rows={2}
                          value={form.notes}
                          onChange={e => setForm(fm => ({ ...fm, notes: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                          style={{ borderColor: S.border, backgroundColor: "#FAFAFA", color: S.text }}
                          placeholder="বিশেষ মাপ বা নোট..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSave(c.id)}
                          disabled={saving}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                          style={{ background: "linear-gradient(135deg, #EC4899, #BE185D)" }}
                        >
                          <Check size={14} /> {saving ? "সংরক্ষণ..." : "সংরক্ষণ"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-xl border text-sm font-medium"
                          style={{ borderColor: S.border, backgroundColor: S.surface, color: S.secondary }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {!isEditing && isExpanded && hasMeas && m && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: S.border }}>
                      <div className="grid grid-cols-4 gap-3">
                        {MEASURE_FIELDS.map(f => {
                          const val = m[f.key];
                          return (
                            <div key={f.key} className="text-center p-2.5 rounded-xl" style={{ backgroundColor: val != null ? "#FDF2F8" : "#F9FAFB" }}>
                              <p className="text-[10px] mb-1" style={{ color: S.muted }}>{f.labelBn}</p>
                              <p className="text-sm font-bold" style={{ color: val != null ? "#EC4899" : "#D1D5DB" }}>
                                {val != null ? `${val}″` : "—"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      {m.notes && (
                        <p className="mt-3 text-xs rounded-xl p-3" style={{ backgroundColor: "#FFFBEB", color: "#92400E" }}>
                          📝 {m.notes}
                        </p>
                      )}
                      {m.updatedAt && (
                        <p className="text-[10px] mt-2" style={{ color: S.muted }}>
                          সর্বশেষ আপডেট: {new Date(m.updatedAt).toLocaleDateString("bn-BD")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
