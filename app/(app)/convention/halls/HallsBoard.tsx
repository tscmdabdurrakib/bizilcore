"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Building2, Plus, X, Loader2, Users, DollarSign,
  CheckCircle2, Circle, Pencil, Trash2, RefreshCw,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Hall {
  id: string;
  name: string;
  capacity: number;
  ratePerDay: number;
  ratePerHour: number | null;
  rateHalfDay: number | null;
  amenities: string[];
  floorArea: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  todayStatus: "booked" | "available";
}

const AMENITY_LABELS: Record<string, string> = {
  ac: "AC",
  stage: "Stage",
  sound_system: "Sound System",
  projector: "Projector",
  parking: "Parking",
  catering_kitchen: "Catering Kitchen",
  dressing_room: "Dressing Room",
  wifi: "WiFi",
  generator: "Generator Backup",
  decoration_allowed: "Decoration Allowed",
};

const ALL_AMENITIES = Object.keys(AMENITY_LABELS);

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

const initialForm = {
  name: "", capacity: "", ratePerDay: "", ratePerHour: "",
  rateHalfDay: "", floorArea: "", description: "", imageUrl: "",
  amenities: [] as string[],
};

export default function HallsBoard() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchHalls = useCallback(async () => {
    const res = await fetch("/api/convention/halls");
    if (res.ok) setHalls(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchHalls(); }, [fetchHalls]);

  const handleAmenityToggle = (a: string) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));
  };

  const openEditForm = (hall: Hall) => {
    setForm({
      name: hall.name,
      capacity: String(hall.capacity),
      ratePerDay: String(hall.ratePerDay),
      ratePerHour: hall.ratePerHour ? String(hall.ratePerHour) : "",
      rateHalfDay: hall.rateHalfDay ? String(hall.rateHalfDay) : "",
      floorArea: hall.floorArea ?? "",
      description: hall.description ?? "",
      imageUrl: hall.imageUrl ?? "",
      amenities: hall.amenities,
    });
    setEditId(hall.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.capacity || !form.ratePerDay) return;
    setSaving(true);
    try {
      const url = editId ? `/api/convention/halls/${editId}` : "/api/convention/halls";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setForm(initialForm);
        setEditId(null);
        fetchHalls();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("এই হলটি মুছে দিতে চান?")) return;
    await fetch(`/api/convention/halls/${id}`, { method: "DELETE" });
    fetchHalls();
  };

  const handleToggleActive = async (hall: Hall) => {
    await fetch(`/api/convention/halls/${hall.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !hall.isActive }),
    });
    fetchHalls();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>হল ম্যানেজমেন্ট</h1>
          <p className="text-xs" style={{ color: S.muted }}>{halls.length}টি হল নিবন্ধিত</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchHalls} className="p-2 rounded-xl" style={{ backgroundColor: S.border }}>
            <RefreshCw size={15} style={{ color: S.muted }} />
          </button>
          <button
            onClick={() => { setForm(initialForm); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#7C3AED" }}
          >
            <Plus size={15} /> হল যোগ করুন
          </button>
        </div>
      </div>

      {/* Hall Cards */}
      {halls.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Building2 size={40} className="mx-auto mb-3 opacity-30" style={{ color: S.muted }} />
          <p className="text-sm font-medium" style={{ color: S.muted }}>কোনো হল যোগ করা হয়নি</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#7C3AED" }}
          >
            প্রথম হল যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {halls.map((hall) => (
            <div
              key={hall.id}
              className="rounded-2xl p-4 border"
              style={{
                backgroundColor: S.surface,
                borderColor: S.border,
                opacity: hall.isActive ? 1 : 0.6,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm" style={{ color: S.text }}>{hall.name}</h3>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: hall.todayStatus === "booked" ? "#FEE2E2" : "#E1F5EE",
                        color: hall.todayStatus === "booked" ? "#EF4444" : "#0F6E56",
                      }}
                    >
                      {hall.todayStatus === "booked" ? "আজ বুকড" : "আজ খালি"}
                    </span>
                  </div>
                  {hall.floorArea && (
                    <p className="text-[11px] mt-0.5" style={{ color: S.muted }}>{hall.floorArea}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleToggleActive(hall)}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: S.border }}
                    title={hall.isActive ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                  >
                    {hall.isActive
                      ? <CheckCircle2 size={14} style={{ color: "#0F6E56" }} />
                      : <Circle size={14} style={{ color: S.muted }} />}
                  </button>
                  <button onClick={() => openEditForm(hall)} className="p-1.5 rounded-lg" style={{ backgroundColor: S.border }}>
                    <Pencil size={14} style={{ color: S.muted }} />
                  </button>
                  <button onClick={() => handleDelete(hall.id)} className="p-1.5 rounded-lg" style={{ backgroundColor: "#FEE2E2" }}>
                    <Trash2 size={14} style={{ color: "#EF4444" }} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl p-2.5" style={{ backgroundColor: S.bg }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Users size={12} style={{ color: "#7C3AED" }} />
                    <p className="text-[10px]" style={{ color: S.muted }}>সর্বোচ্চ অতিথি</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: S.text }}>{hall.capacity} জন</p>
                </div>
                <div className="rounded-xl p-2.5" style={{ backgroundColor: S.bg }}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <DollarSign size={12} style={{ color: "#0F6E56" }} />
                    <p className="text-[10px]" style={{ color: S.muted }}>প্রতিদিনের ভাড়া</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(hall.ratePerDay)}</p>
                </div>
                {hall.rateHalfDay && (
                  <div className="rounded-xl p-2.5" style={{ backgroundColor: S.bg }}>
                    <p className="text-[10px] mb-0.5" style={{ color: S.muted }}>হাফ ডে ভাড়া</p>
                    <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(hall.rateHalfDay)}</p>
                  </div>
                )}
                {hall.ratePerHour && (
                  <div className="rounded-xl p-2.5" style={{ backgroundColor: S.bg }}>
                    <p className="text-[10px] mb-0.5" style={{ color: S.muted }}>প্রতি ঘণ্টা ভাড়া</p>
                    <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(hall.ratePerHour)}</p>
                  </div>
                )}
              </div>

              {hall.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {hall.amenities.map((a) => (
                    <span
                      key={a}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#F5F3FF", color: "#7C3AED" }}
                    >
                      {AMENITY_LABELS[a] ?? a}
                    </span>
                  ))}
                </div>
              )}

              {hall.description && (
                <p className="text-[11px] mt-2" style={{ color: S.muted }}>{hall.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ color: S.text }}>
                {editId ? "হল সম্পাদনা করুন" : "নতুন হল যোগ করুন"}
              </h2>
              <button onClick={() => { setShowForm(false); setEditId(null); }}>
                <X size={20} style={{ color: S.muted }} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>হলের নাম *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="যেমন: Main Hall"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>সর্বোচ্চ ধারণক্ষমতা *</label>
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    placeholder="500"
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>প্রতিদিনের ভাড়া (৳) *</label>
                  <input
                    type="number"
                    value={form.ratePerDay}
                    onChange={(e) => setForm((f) => ({ ...f, ratePerDay: e.target.value }))}
                    placeholder="50000"
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>হাফ ডে ভাড়া (৳)</label>
                  <input
                    type="number"
                    value={form.rateHalfDay}
                    onChange={(e) => setForm((f) => ({ ...f, rateHalfDay: e.target.value }))}
                    placeholder="30000"
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>প্রতি ঘণ্টা ভাড়া (৳)</label>
                  <input
                    type="number"
                    value={form.ratePerHour}
                    onChange={(e) => setForm((f) => ({ ...f, ratePerHour: e.target.value }))}
                    placeholder="5000"
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>মোট আয়তন</label>
                <input
                  value={form.floorArea}
                  onChange={(e) => setForm((f) => ({ ...f, floorArea: e.target.value }))}
                  placeholder="যেমন: 5000 sqft"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: S.text }}>সুবিধাসমূহ</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_AMENITIES.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => handleAmenityToggle(a)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium text-left"
                      style={{
                        backgroundColor: form.amenities.includes(a) ? "#F5F3FF" : S.bg,
                        borderColor: form.amenities.includes(a) ? "#7C3AED" : S.border,
                        color: form.amenities.includes(a) ? "#7C3AED" : S.muted,
                      }}
                    >
                      {form.amenities.includes(a) ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      {AMENITY_LABELS[a]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>বিবরণ</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  placeholder="হলের বিবরণ লিখুন..."
                  className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving || !form.name || !form.capacity || !form.ratePerDay}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#7C3AED" }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
