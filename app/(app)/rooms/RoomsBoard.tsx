"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Bed, Loader2, Pencil, Trash2, X, Save, Search, RefreshCw } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Room {
  id: string;
  number: string;
  type: string;
  floor: string;
  capacity: number;
  ratePerNight: number;
  status: string;
  amenities: string[];
  description: string | null;
  imageUrl: string | null;
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  vacant:      { label: "খালি",          bg: "#E1F5EE", color: "#0F6E56" },
  occupied:    { label: "ভরা",           bg: "#E6F1FB", color: "#0C447C" },
  reserved:    { label: "রিজার্ভড",      bg: "#FFF3DC", color: "#B45309" },
  cleaning:    { label: "ক্লিনিং",       bg: "#F1EFE8", color: "#444441" },
  maintenance: { label: "মেইনটেন্যান্স", bg: "#FCEBEB", color: "#791F1F" },
};

const TYPE_LABELS: Record<string, string> = {
  single: "সিঙ্গেল",
  double: "ডাবল",
  twin:   "টুইন",
  suite:  "সুইট",
  family: "ফ্যামিলি",
  deluxe: "ডিলাক্স",
};

const AMENITY_OPTIONS = ["AC", "WiFi", "TV", "Geyser", "Mini-Fridge", "Balcony", "Sea-view"];

interface RoomForm {
  number: string;
  type: string;
  floor: string;
  capacity: number;
  ratePerNight: number;
  status: string;
  amenities: string[];
  description: string;
}

const EMPTY_FORM: RoomForm = {
  number: "", type: "single", floor: "1st",
  capacity: 2, ratePerNight: 0, status: "vacant",
  amenities: [], description: "",
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function RoomsBoard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState<RoomForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const res = await fetch("/api/rooms", { cache: "no-store" });
      if (res.ok) setRooms(await res.json());
    } catch {}
    if (silent) setRefreshing(false);
    setLoading(false);
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (r: Room) => {
    setEditing(r);
    setForm({
      number: r.number, type: r.type, floor: r.floor,
      capacity: r.capacity, ratePerNight: r.ratePerNight, status: r.status,
      amenities: r.amenities ?? [], description: r.description ?? "",
    });
    setError(null);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.number.trim() || !form.ratePerNight) {
      setError("রুম নম্বর ও ভাড়া দরকার");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = editing ? `/api/rooms/${editing.id}` : "/api/rooms";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "সমস্যা হয়েছে");
      } else {
        setShowModal(false);
        await fetchRooms();
      }
    } catch {
      setError("সার্ভার সমস্যা");
    }
    setSaving(false);
  };

  const remove = async (room: Room) => {
    if (!confirm(`রুম ${room.number} ডিলিট করবেন?`)) return;
    const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "ডিলিট করা যায়নি");
      return;
    }
    await fetchRooms();
  };

  const filtered = rooms.filter(r => {
    if (filter !== "all" && r.status !== filter) return false;
    if (search && !r.number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts: Record<string, number> = { all: rooms.length };
  for (const r of rooms) counts[r.status] = (counts[r.status] ?? 0) + 1;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E1F5EE" }}>
            <Bed size={20} style={{ color: "#0F6E56" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>রুম ম্যানেজমেন্ট</h1>
            <p className="text-xs" style={{ color: S.muted }}>মোট {rooms.length}টি রুম</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRooms(true)}
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: "#E6F1FB", color: "#0C447C" }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ backgroundColor: "#0F6E56" }}
          >
            <Plus size={16} /> নতুন রুম
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-3 border flex flex-col sm:flex-row gap-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="রুম নম্বর সার্চ..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border"
            style={{ borderColor: S.border, backgroundColor: "var(--c-bg-alt, #F8F8F4)" }}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: "all", label: "সব" },
            { key: "vacant", label: "খালি" },
            { key: "occupied", label: "ভরা" },
            { key: "reserved", label: "রিজার্ভড" },
            { key: "cleaning", label: "ক্লিনিং" },
            { key: "maintenance", label: "মেইনটেন্যান্স" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
              style={{
                backgroundColor: filter === t.key ? "#0F6E56" : "var(--c-bg-alt, #F8F8F4)",
                color: filter === t.key ? "#fff" : S.text,
              }}
            >
              {t.label} ({counts[t.key] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Rooms grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin" style={{ color: "#0F6E56" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <Bed size={36} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: S.text }}>কোনো রুম নেই</p>
          <p className="text-xs mb-4" style={{ color: S.muted }}>প্রথম রুম যোগ করে শুরু করুন</p>
          <button onClick={openNew} className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: "#0F6E56" }}>
            নতুন রুম যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(room => {
            const s = STATUS_META[room.status] ?? STATUS_META.vacant;
            return (
              <div key={room.id} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xl font-bold" style={{ color: S.text }}>রুম {room.number}</p>
                    <p className="text-xs" style={{ color: S.muted }}>{TYPE_LABELS[room.type] ?? room.type} · ফ্লোর {room.floor}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                </div>
                <p className="text-base font-bold mt-2" style={{ color: "#0F6E56" }}>{formatBDT(room.ratePerNight)}<span className="text-[10px] font-normal" style={{ color: S.muted }}> /রাত</span></p>
                <p className="text-[11px]" style={{ color: S.muted }}>সর্বোচ্চ {room.capacity} জন</p>
                {room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {room.amenities.slice(0, 3).map(a => (
                      <span key={a} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--c-bg-alt, #F8F8F4)", color: S.muted }}>{a}</span>
                    ))}
                    {room.amenities.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: S.muted }}>+{room.amenities.length - 3}</span>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
                  <button onClick={() => openEdit(room)} className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: "#E6F1FB", color: "#0C447C" }}>
                    <Pencil size={11} /> এডিট
                  </button>
                  <button onClick={() => remove(room)} className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: "#FCEBEB", color: "#791F1F" }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b sticky top-0 bg-white flex items-center justify-between" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>{editing ? `রুম ${editing.number} এডিট` : "নতুন রুম"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>রুম নম্বর *</label>
                  <input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>ফ্লোর</label>
                  <input value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>টাইপ</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }}>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>ক্যাপাসিটি (জন)</label>
                  <input type="number" min={1} value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>ভাড়া / রাত (৳) *</label>
                  <input type="number" min={0} value={form.ratePerNight} onChange={e => setForm({ ...form, ratePerNight: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>স্ট্যাটাস</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }}>
                    {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>অ্যামেনিটিজ</label>
                <div className="flex flex-wrap gap-1.5">
                  {AMENITY_OPTIONS.map(a => {
                    const on = form.amenities.includes(a);
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setForm({
                          ...form,
                          amenities: on ? form.amenities.filter(x => x !== a) : [...form.amenities, a],
                        })}
                        className="text-[11px] px-2 py-1 rounded-lg border font-medium"
                        style={{
                          backgroundColor: on ? "#0F6E56" : "var(--c-bg-alt, #F8F8F4)",
                          color: on ? "#fff" : S.text,
                          borderColor: on ? "#0F6E56" : S.border,
                        }}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>বিবরণ</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
              </div>

              {error && <p className="text-xs" style={{ color: "#791F1F" }}>{error}</p>}
            </div>
            <div className="p-5 border-t sticky bottom-0 bg-white flex gap-2" style={{ borderColor: S.border }}>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl font-semibold text-sm" style={{ backgroundColor: "var(--c-bg-alt, #F8F8F4)", color: S.text }}>
                বাতিল
              </button>
              <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ backgroundColor: "#0F6E56" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
