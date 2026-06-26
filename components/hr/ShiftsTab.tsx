"use client";

import { useEffect, useState } from "react";
import { Plus, X, Clock, Trash2, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import type { Shift, StaffMember } from "@/lib/hr/types";
import { SHIFT_DAYS, SHIFT_COLORS } from "@/lib/hr/types";
import { parseStaffList } from "@/lib/hr/utils";

interface Props {
  showToast: (type: "success" | "error", msg: string) => void;
}

function getWeekStart(d: Date) {
  const ws = new Date(d);
  ws.setDate(ws.getDate() - ws.getDay());
  return ws.toISOString().slice(0, 10);
}

export default function ShiftsTab({ showToast }: Props) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editShift, setEditShift] = useState<Shift | null>(null);
  const [assignShift, setAssignShift] = useState<Shift | null>(null);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));

  async function load() {
    setLoading(true);
    const [shiftsRes, staffRes] = await Promise.all([
      fetch("/api/hr/shifts").then(r => r.json()),
      fetch("/api/staff").then(r => r.json()),
    ]);
    setShifts(shiftsRes.shifts ?? []);
    setStaff(parseStaffList(staffRes) as StaffMember[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deleteShift(id: string) {
    if (!confirm("এই শিফটটি মুছে ফেলবেন?")) return;
    await fetch(`/api/hr/shifts?id=${id}`, { method: "DELETE" });
    showToast("success", "শিফট মুছে ফেলা হয়েছে");
    load();
  }

  function shiftWeek(delta: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(getWeekStart(d));
  }

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftWeek(-1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold text-gray-700">
            {weekDates[0].toLocaleDateString("bn-BD", { day: "numeric", month: "short" })} — {weekDates[6].toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <button onClick={() => shiftWeek(1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><ChevronRight size={16} /></button>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 h-9 rounded-xl text-white text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
          <Plus size={14} /> নতুন শিফট
        </button>
      </div>

      {/* Weekly calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-400">কর্মী</th>
              {weekDates.map((d, i) => (
                <th key={i} className="px-2 py-3 text-center text-xs font-bold text-gray-400">
                  {SHIFT_DAYS[i].label}<br />
                  <span className="font-normal">{d.getDate()}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.filter(s => s.isActive).map(s => (
              <tr key={s.id} className="border-b border-gray-50">
                <td className="px-4 py-2 text-sm font-semibold text-gray-900">{s.user.name}</td>
                {weekDates.map((d, i) => {
                  const dk = dayKeys[d.getDay()];
                  const assigned = shifts.filter(sh =>
                    (sh.days as string[]).includes(dk) &&
                    sh.shiftAssignments.some(a => a.staff.id === s.id && a.id)
                  );
                  return (
                    <td key={i} className="px-1 py-2 text-center">
                      {assigned.map(sh => (
                        <div key={sh.id} className="text-[9px] px-1 py-0.5 rounded mb-0.5 font-semibold text-white truncate"
                          style={{ backgroundColor: sh.color }} title={`${sh.title} ${sh.startTime}-${sh.endTime}`}>
                          {sh.title}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shift cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : shifts.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
          <Clock size={32} className="mx-auto text-purple-500 mb-3" />
          <p className="font-bold text-gray-900">কোনো শিফট নেই</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold">শিফট তৈরি করুন</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map(shift => (
            <div key={shift.id} className="rounded-2xl p-5 bg-white border-2" style={{ borderColor: shift.color + "33" }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: shift.color + "22" }}>
                    <Clock size={20} style={{ color: shift.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900">{shift.title}</h3>
                    <p className="text-xs text-gray-400">{shift.startTime} — {shift.endTime}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditShift(shift)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Pencil size={14} className="text-gray-400" /></button>
                  <button onClick={() => deleteShift(shift.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={14} className="text-red-400" /></button>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {SHIFT_DAYS.map(day => (
                  <span key={day.key} className="w-8 h-6 rounded text-xs flex items-center justify-center font-medium"
                    style={{
                      backgroundColor: (shift.days as string[]).includes(day.key) ? shift.color : "#E5E7EB",
                      color: (shift.days as string[]).includes(day.key) ? "#fff" : "#9CA3AF",
                    }}>
                    {day.label}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {shift.shiftAssignments.slice(0, 4).map(a => (
                    <div key={a.id} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white"
                      style={{ backgroundColor: shift.color }} title={a.staff.user.name}>
                      {a.staff.user.name[0]}
                    </div>
                  ))}
                  {shift.shiftAssignments.length === 0 && <span className="text-xs text-gray-400">কোনো কর্মী নেই</span>}
                </div>
                <button onClick={() => setAssignShift(shift)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ color: shift.color, backgroundColor: shift.color + "15" }}>
                  কর্মী নিয়োগ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <ShiftFormModal onClose={() => setShowCreate(false)} onSave={load} showToast={showToast} />}
      {editShift && <ShiftFormModal shift={editShift} onClose={() => setEditShift(null)} onSave={load} showToast={showToast} />}
      {assignShift && (
        <AssignModal shift={assignShift} staff={staff} weekStart={weekStart} onClose={() => setAssignShift(null)} onSave={load} showToast={showToast} />
      )}
    </div>
  );
}

function ShiftFormModal({ shift, onClose, onSave, showToast }: {
  shift?: Shift; onClose: () => void; onSave: () => void; showToast: (t: "success" | "error", m: string) => void;
}) {
  const [form, setForm] = useState({
    title: shift?.title ?? "",
    startTime: shift?.startTime ?? "09:00",
    endTime: shift?.endTime ?? "18:00",
    color: shift?.color ?? SHIFT_COLORS[0],
  });
  const [selectedDays, setSelectedDays] = useState<string[]>(shift?.days ?? ["sun", "mon", "tue", "wed", "thu"]);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || selectedDays.length === 0) return;
    setLoading(true);
    const method = shift ? "PATCH" : "POST";
    const body = shift ? { id: shift.id, ...form, days: selectedDays } : { ...form, days: selectedDays };
    const r = await fetch("/api/hr/shifts", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false);
    if (r.ok) { showToast("success", shift ? "আপডেট হয়েছে" : "শিফট তৈরি"); onSave(); onClose(); }
    else showToast("error", "সেভ করা যায়নি");
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">{shift ? "শিফট এডিট" : "নতুন শিফট"}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="শিফটের নাম *" required
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} className="h-10 px-3 rounded-xl border border-gray-200 text-sm" />
            <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} className="h-10 px-3 rounded-xl border border-gray-200 text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {SHIFT_DAYS.map(day => (
              <button key={day.key} type="button" onClick={() => setSelectedDays(p => p.includes(day.key) ? p.filter(d => d !== day.key) : [...p, day.key])}
                className="w-10 h-10 rounded-full text-xs font-semibold border"
                style={{ backgroundColor: selectedDays.includes(day.key) ? form.color : "#fff", color: selectedDays.includes(day.key) ? "#fff" : "#6B7280", borderColor: selectedDays.includes(day.key) ? form.color : "#E5E7EB" }}>
                {day.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {SHIFT_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                className="w-7 h-7 rounded-full border-2" style={{ backgroundColor: c, borderColor: form.color === c ? "#fff" : c, transform: form.color === c ? "scale(1.2)" : "scale(1)" }} />
            ))}
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60">
            {loading ? "সেভ হচ্ছে..." : shift ? "আপডেট" : "তৈরি করুন"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AssignModal({ shift, staff, weekStart, onClose, onSave, showToast }: {
  shift: Shift; staff: StaffMember[]; weekStart: string; onClose: () => void; onSave: () => void;
  showToast: (t: "success" | "error", m: string) => void;
}) {
  const assignedIds = shift.shiftAssignments.map(a => a.staff.id);
  const [loading, setLoading] = useState(false);

  async function assign(staffId: string) {
    setLoading(true);
    await fetch("/api/hr/shifts/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shiftId: shift.id, staffId, weekStart }),
    });
    setLoading(false);
    onSave();
  }

  async function unassign(assignmentId: string) {
    await fetch(`/api/hr/shifts/assign?id=${assignmentId}`, { method: "DELETE" });
    showToast("success", "নিয়োগ বাতিল");
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">কর্মী নিয়োগ — {shift.title}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>
        <div className="space-y-2">
          {staff.filter(s => s.isActive).map(s => {
            const assignment = shift.shiftAssignments.find(a => a.staff.id === s.id);
            const assigned = !!assignment;
            return (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                <span className="text-sm font-medium text-gray-900">{s.user.name}</span>
                {assigned ? (
                  <button onClick={() => assignment && unassign(assignment.id)} disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-50 text-red-600">
                    বাতিল
                  </button>
                ) : (
                  <button onClick={() => assign(s.id)} disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-emerald-600 text-white">
                    নিয়োগ
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">বন্ধ</button>
      </div>
    </div>
  );
}
