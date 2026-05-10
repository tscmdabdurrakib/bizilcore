"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, X, Pencil, Trash2, Loader2, BedDouble, CheckSquare, Square } from "lucide-react";

interface TreatmentRoom {
  id: string;
  name: string;
  type: string;
  capacity: number;
  amenities: string[];
  rateExtra: number;
  isActive: boolean;
}

const S = {
  surface: "var(--c-surface)", border: "var(--c-border)",
  text: "var(--c-text)", muted: "var(--c-text-muted)", bg: "var(--c-bg)",
};
const SPA_COLOR = "#9333EA";
const SPA_BG = "#FAF5FF";

const ROOM_TYPES = [
  { value: "standard", label: "স্ট্যান্ডার্ড" },
  { value: "vip", label: "VIP রুম" },
  { value: "couple", label: "কাপল স্যুট" },
  { value: "group", label: "গ্রুপ রুম" },
];

const AMENITIES_OPTIONS = [
  { value: "bath", label: "বাথটাব" },
  { value: "shower", label: "শাওয়ার" },
  { value: "steam", label: "স্টিম" },
  { value: "jacuzzi", label: "জাকুজি" },
  { value: "sauna", label: "সানা" },
  { value: "ac", label: "এয়ার কন্ডিশন" },
  { value: "music", label: "মিউজিক সিস্টেম" },
  { value: "tv", label: "টিভি" },
];

const inp = (focused: boolean) => ({
  height: "40px",
  border: `1px solid ${focused ? SPA_COLOR : "var(--c-border)"}`,
  borderRadius: "8px", color: "var(--c-text)", backgroundColor: "var(--c-surface)",
  padding: "0 12px", fontSize: "14px", outline: "none", width: "100%",
});

const ROOM_TYPE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  standard: { label: "স্ট্যান্ডার্ড", color: "#6B7280", bg: "#F3F4F6" },
  vip:      { label: "VIP",           color: "#D97706", bg: "#FEF3C7" },
  couple:   { label: "কাপল স্যুট",   color: "#EC4899", bg: "#FDF2F8" },
  group:    { label: "গ্রুপ",         color: "#0891B2", bg: "#ECFEFF" },
};

function RoomModal({
  room, onClose, onSave,
}: { room: TreatmentRoom | null; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    name: room?.name ?? "",
    type: room?.type ?? "standard",
    capacity: room?.capacity ?? 1,
    amenities: room?.amenities ?? [],
    rateExtra: room?.rateExtra ?? 0,
    isActive: room?.isActive ?? true,
  });
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function toggleAmenity(val: string) {
    setForm(p => ({
      ...p,
      amenities: p.amenities.includes(val)
        ? p.amenities.filter(a => a !== val)
        : [...p.amenities, val],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!form.name.trim()) { setErr("রুমের নাম আবশ্যিক।"); return; }
    setLoading(true);
    const url = room ? `/api/spa/rooms/${room.id}` : "/api/spa/rooms";
    const method = room ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setErr(d.error ?? "সেভ করা যায়নি।"); return; }
    onSave(); onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: S.surface }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base" style={{ color: S.text }}>
            {room ? "রুম সম্পাদনা" : "নতুন রুম যোগ করুন"}
          </h3>
          <button onClick={onClose}><X size={18} style={{ color: S.muted }} /></button>
        </div>

        {err && <div className="mb-3 p-3 rounded-xl text-sm" style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>{err}</div>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>রুমের নাম *</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Room 1, VIP Suite, Couple Room..."
              style={inp(focused === "name")}
              onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>রুমের ধরন</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={{ ...inp(focused === "type"), appearance: "none" }}
                onFocus={() => setFocused("type")} onBlur={() => setFocused(null)}
              >
                {ROOM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>ধারণ ক্ষমতা (জন)</label>
              <input
                type="number" min={1} max={10}
                value={form.capacity}
                onChange={e => setForm(p => ({ ...p, capacity: Number(e.target.value) }))}
                style={inp(focused === "cap")}
                onFocus={() => setFocused("cap")} onBlur={() => setFocused(null)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>অতিরিক্ত চার্জ (৳)</label>
            <input
              type="number" min={0}
              value={form.rateExtra}
              onChange={e => setForm(p => ({ ...p, rateExtra: Number(e.target.value) }))}
              placeholder="0 = কোনো অতিরিক্ত চার্জ নেই"
              style={inp(focused === "rate")}
              onFocus={() => setFocused("rate")} onBlur={() => setFocused(null)}
            />
          </div>

          <div>
            <label className="block text-xs mb-2 font-medium" style={{ color: S.muted }}>সুযোগ-সুবিধা</label>
            <div className="grid grid-cols-2 gap-2">
              {AMENITIES_OPTIONS.map(a => {
                const checked = form.amenities.includes(a.value);
                return (
                  <button
                    key={a.value} type="button"
                    onClick={() => toggleAmenity(a.value)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs text-left transition-all"
                    style={{
                      backgroundColor: checked ? SPA_BG : S.surface,
                      borderColor: checked ? SPA_COLOR : S.border,
                      color: checked ? SPA_COLOR : S.text,
                    }}
                  >
                    {checked ? <CheckSquare size={13} /> : <Square size={13} />}
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {room && (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: S.text }}>সক্রিয়</label>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                className="w-11 h-6 rounded-full transition-colors flex items-center px-0.5"
                style={{ backgroundColor: form.isActive ? SPA_COLOR : "#D1D5DB" }}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow transition-transform"
                  style={{ transform: form.isActive ? "translateX(20px)" : "translateX(0)" }} />
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: S.border, color: S.text }}>
              বাতিল
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${SPA_COLOR} 0%, #7E22CE 100%)` }}>
              {loading ? "সেভ..." : "সেভ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SpaRoomsPage() {
  const [rooms, setRooms] = useState<TreatmentRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRoom, setEditRoom] = useState<TreatmentRoom | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/spa/rooms");
    const data = await res.json();
    setRooms(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    setDeleting(true);
    const res = await fetch(`/api/spa/rooms/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error ?? "মুছতে পারা যায়নি।"); }
    setDeleting(false);
    setDeleteId(null);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${SPA_COLOR} 0%, #7E22CE 100%)` }}>
            <BedDouble size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>ট্রিটমেন্ট রুম</h1>
            <p className="text-xs" style={{ color: S.muted }}>রুম পরিচালনা ও সুযোগ-সুবিধা</p>
          </div>
        </div>
        <button
          onClick={() => { setEditRoom(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
          style={{ background: `linear-gradient(135deg, ${SPA_COLOR} 0%, #7E22CE 100%)` }}
        >
          <Plus size={16} /> রুম যোগ করুন
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 size={28} className="animate-spin" style={{ color: SPA_COLOR }} />
        </div>
      ) : rooms.length === 0 ? (
        <div className="py-16 flex flex-col items-center rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: SPA_BG }}>
            <BedDouble size={28} style={{ color: SPA_COLOR }} />
          </div>
          <p className="font-semibold text-sm mb-1" style={{ color: S.text }}>কোনো রুম যোগ করা হয়নি</p>
          <p className="text-xs mb-4" style={{ color: S.muted }}>ট্রিটমেন্ট রুম যোগ করে বুকিং শুরু করুন</p>
          <button onClick={() => { setEditRoom(null); setShowModal(true); }}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: `linear-gradient(135deg, ${SPA_COLOR} 0%, #7E22CE 100%)` }}>
            <Plus size={14} className="inline mr-1" /> প্রথম রুম যোগ করুন
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map(room => {
            const badge = ROOM_TYPE_BADGE[room.type] ?? ROOM_TYPE_BADGE.standard;
            return (
              <div key={room.id} className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border, opacity: room.isActive ? 1 : 0.6 }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm" style={{ color: S.text }}>{room.name}</h3>
                      {!room.isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">নিষ্ক্রিয়</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                      <span className="text-xs" style={{ color: S.muted }}>{room.capacity}জন</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditRoom(room); setShowModal(true); }}
                      className="p-2 rounded-lg transition-colors hover:opacity-70"
                      style={{ backgroundColor: SPA_BG }}>
                      <Pencil size={13} style={{ color: SPA_COLOR }} />
                    </button>
                    <button onClick={() => setDeleteId(room.id)}
                      className="p-2 rounded-lg transition-colors hover:opacity-70"
                      style={{ backgroundColor: "#FEF2F2" }}>
                      <Trash2 size={13} style={{ color: "#EF4444" }} />
                    </button>
                  </div>
                </div>

                {room.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {room.amenities.map(a => {
                      const opt = AMENITIES_OPTIONS.find(o => o.value === a);
                      return (
                        <span key={a} className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                          style={{ borderColor: S.border, color: S.muted }}>
                          {opt?.label ?? a}
                        </span>
                      );
                    })}
                  </div>
                )}

                {room.rateExtra > 0 && (
                  <p className="text-xs font-medium" style={{ color: SPA_COLOR }}>
                    +৳{room.rateExtra.toLocaleString("bn-BD")} অতিরিক্ত চার্জ
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <RoomModal
          room={editRoom}
          onClose={() => { setShowModal(false); setEditRoom(null); }}
          onSave={load}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: S.surface }}>
            <h3 className="font-semibold mb-2" style={{ color: S.text }}>রুম মুছবেন?</h3>
            <p className="text-sm mb-5" style={{ color: S.muted }}>এই রুমটি স্থায়ীভাবে মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.text }}>
                বাতিল
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: "#EF4444" }}>
                {deleting ? "মুছছি..." : "হ্যাঁ, মুছুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
