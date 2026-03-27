"use client";

import { useEffect, useState } from "react";
import { Plus, X, Clock, Trash2 } from "lucide-react";

interface ShiftAssignment {
  id: string;
  staff: { id: string; user: { name: string } };
}

interface Shift {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  days: string[];
  color: string;
  shiftAssignments: ShiftAssignment[];
}

interface Staff {
  id: string;
  user: { name: string };
}

const DAYS = [
  { key: "sun", label: "রবি" },
  { key: "mon", label: "সোম" },
  { key: "tue", label: "মঙ্গল" },
  { key: "wed", label: "বুধ" },
  { key: "thu", label: "বৃহঃ" },
  { key: "fri", label: "শুক্র" },
  { key: "sat", label: "শনি" },
];

const COLORS = [
  "#0F6E56", "#3B82F6", "#8B5CF6", "#EC4899",
  "#F59E0B", "#EF4444", "#14B8A6", "#6366F1",
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "var(--c-primary)",
};

const inp = (f: boolean) => ({
  height: "40px",
  border: `1px solid ${f ? "var(--c-primary)" : "var(--c-border)"}`,
  borderRadius: "8px",
  color: "var(--c-text)",
  backgroundColor: "var(--c-surface)",
  padding: "0 12px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
});

function CreateShiftModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    title: "",
    startTime: "09:00",
    endTime: "18:00",
    color: COLORS[0],
  });
  const [selectedDays, setSelectedDays] = useState<string[]>(["sun", "mon", "tue", "wed", "thu"]);
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleDay(day: string) {
    setSelectedDays((p) => (p.includes(day) ? p.filter((d) => d !== day) : [...p, day]));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || selectedDays.length === 0) return;
    setLoading(true);
    await fetch("/api/hr/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, days: selectedDays }),
    });
    setLoading(false);
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: S.surface }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-base" style={{ color: S.text }}>
            নতুন শিফট
          </h3>
          <button onClick={onClose}>
            <X size={18} style={{ color: S.muted }} />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
              শিফটের নাম *
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="যেমন: মর্নিং শিফট"
              required
              style={inp(focused === "title")}
              onFocus={() => setFocused("title")}
              onBlur={() => setFocused(null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
                শুরুর সময়
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                style={inp(focused === "st")}
                onFocus={() => setFocused("st")}
                onBlur={() => setFocused(null)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
                শেষের সময়
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                style={inp(focused === "et")}
                onFocus={() => setFocused("et")}
                onBlur={() => setFocused(null)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-2 font-medium" style={{ color: S.muted }}>
              কার্যদিবস
            </label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => toggleDay(day.key)}
                  className="w-10 h-10 rounded-full text-xs font-semibold border transition-colors"
                  style={{
                    backgroundColor: selectedDays.includes(day.key) ? form.color : S.surface,
                    color: selectedDays.includes(day.key) ? "#fff" : S.muted,
                    borderColor: selectedDays.includes(day.key) ? form.color : S.border,
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs mb-2 font-medium" style={{ color: S.muted }}>
              রঙ
            </label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, color }))}
                  className="w-7 h-7 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: color,
                    borderColor: form.color === color ? "#fff" : color,
                    transform: form.color === color ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: S.border, color: S.text }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: S.primary }}
            >
              {loading ? "তৈরি হচ্ছে..." : "শিফট তৈরি"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignStaffModal({
  shift,
  staff,
  onClose,
  onSave,
}: {
  shift: Shift;
  staff: Staff[];
  onClose: () => void;
  onSave: () => void;
}) {
  const assignedIds = shift.shiftAssignments.map((a) => a.staff.id);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const [loading, setLoading] = useState(false);

  async function assign(staffId: string) {
    setLoading(true);
    await fetch("/api/hr/shifts/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId: shift.id, staffId, weekStart: weekStartStr }),
    });
    setLoading(false);
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl p-6 w-full max-w-sm" style={{ backgroundColor: S.surface }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: S.text }}>
            কর্মী নিয়োগ — {shift.title}
          </h3>
          <button onClick={onClose}>
            <X size={18} style={{ color: S.muted }} />
          </button>
        </div>
        <div className="space-y-2">
          {staff.map((s) => {
            const assigned = assignedIds.includes(s.id);
            return (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ border: `1px solid ${S.border}` }}
              >
                <span className="text-sm font-medium" style={{ color: S.text }}>
                  {s.user.name}
                </span>
                <button
                  onClick={() => !assigned && assign(s.id)}
                  disabled={assigned || loading}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                  style={{
                    backgroundColor: assigned ? "#ECFDF5" : S.primary,
                    color: assigned ? "#10B981" : "#fff",
                  }}
                >
                  {assigned ? "নিয়োগিত" : "নিয়োগ করুন"}
                </button>
              </div>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl border text-sm font-medium"
          style={{ borderColor: S.border, color: S.text }}
        >
          বন্ধ করুন
        </button>
      </div>
    </div>
  );
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignShift, setAssignShift] = useState<Shift | null>(null);

  async function load() {
    setLoading(true);
    const [shiftsRes, staffRes] = await Promise.all([
      fetch("/api/hr/shifts").then((r) => r.json()),
      fetch("/api/staff").then((r) => r.json()),
    ]);
    setShifts(shiftsRes.shifts ?? []);
    setStaff(staffRes.staffMembers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteShift(id: string) {
    if (!confirm("এই শিফটটি মুছে ফেলবেন?")) return;
    await fetch(`/api/hr/shifts?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}>
            <Clock size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>শিফট ম্যানেজমেন্ট</h1>
            <p className="text-xs" style={{ color: S.muted }}>কর্মীদের কাজের শিফট নির্ধারণ ও পরিচালনা করুন</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
        >
          <Plus size={16} />
          নতুন শিফট
        </button>
      </div>

      {loading ? (
        <div className="p-5 space-y-3 animate-pulse rounded-2xl" style={{ border: `1px solid ${S.border}` }}>
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl" style={{ backgroundColor: S.surface }} />)}
        </div>
      ) : shifts.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center rounded-2xl" style={{ border: `1px solid ${S.border}`, backgroundColor: S.surface }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #F3E8FF 0%, #DDD6FE 100%)" }}>
            <Clock size={28} color="#7C3AED" />
          </div>
          <p className="font-semibold text-sm" style={{ color: S.text }}>কোনো শিফট নেই</p>
          <p className="text-xs mt-1.5 mb-4" style={{ color: S.muted }}>কর্মীদের জন্য প্রথম শিফট তৈরি করুন</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)" }}
          >
            <Plus size={15} /> শিফট তৈরি করুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="rounded-2xl p-5"
              style={{ border: `2px solid ${shift.color}22`, backgroundColor: S.surface }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: shift.color + "22" }}>
                    <Clock size={20} style={{ color: shift.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: S.text }}>
                      {shift.title}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                      {shift.startTime} — {shift.endTime}
                    </p>
                  </div>
                </div>
                <button onClick={() => deleteShift(shift.id)} className="hover:opacity-70">
                  <Trash2 size={15} style={{ color: S.muted }} />
                </button>
              </div>

              <div className="flex gap-1 mb-3">
                {DAYS.map((day) => (
                  <span
                    key={day.key}
                    className="w-8 h-6 rounded text-xs flex items-center justify-center font-medium"
                    style={{
                      backgroundColor: (shift.days as string[]).includes(day.key) ? shift.color : S.border,
                      color: (shift.days as string[]).includes(day.key) ? "#fff" : S.muted,
                    }}
                  >
                    {day.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {shift.shiftAssignments.slice(0, 4).map((a) => (
                    <div
                      key={a.id}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2"
                      style={{ backgroundColor: shift.color, borderColor: S.surface }}
                      title={a.staff.user.name}
                    >
                      {a.staff.user.name[0]}
                    </div>
                  ))}
                  {shift.shiftAssignments.length > 4 && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2"
                      style={{ backgroundColor: S.border, color: S.muted, borderColor: S.surface }}
                    >
                      +{shift.shiftAssignments.length - 4}
                    </div>
                  )}
                  {shift.shiftAssignments.length === 0 && (
                    <span className="text-xs" style={{ color: S.muted }}>
                      কোনো কর্মী নেই
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setAssignShift(shift)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ color: shift.color, backgroundColor: shift.color + "15" }}
                >
                  কর্মী নিয়োগ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateShiftModal onClose={() => setShowCreateModal(false)} onSave={load} />
      )}
      {assignShift && (
        <AssignStaffModal
          shift={assignShift}
          staff={staff}
          onClose={() => setAssignShift(null)}
          onSave={load}
        />
      )}
    </div>
  );
}
