"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, CheckCircle, XCircle, Clock, Loader2, Save } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import type { StaffMember } from "@/lib/hr/types";
import { STATUS_CONFIG, MONTH_NAMES } from "@/lib/hr/types";

type AttStatus = "present" | "absent" | "late" | "half-day" | "leave";

const BTN: Record<AttStatus, { label: string; bg: string; color: string; icon: React.ComponentType<{ size: number }> }> = {
  present: { label: "উপস্থিত", bg: "#ECFDF5", color: "#10B981", icon: CheckCircle },
  absent: { label: "অনুপস্থিত", bg: "#FEF2F2", color: "#EF4444", icon: XCircle },
  late: { label: "দেরিতে", bg: "#FFFBEB", color: "#F59E0B", icon: Clock },
  "half-day": { label: "অর্ধদিন", bg: "#F5F3FF", color: "#8B5CF6", icon: Clock },
  leave: { label: "ছুটি", bg: "#EFF6FF", color: "#3B82F6", icon: Calendar },
};

interface AttendanceRow {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  notes: string | null;
  staff: StaffMember;
}

interface Props {
  staff: StaffMember[];
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function AttendanceTab({ staff, month, year, onMonthChange, showToast }: Props) {
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, AttStatus>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attendances, setAttendances] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [staffFilter, setStaffFilter] = useState("");

  const activeStaff = staff.filter(s => s.isActive && (s.joinedAt || s.phone));

  const loadDaily = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/hr/attendance?date=${date}`);
    const data = await res.json();
    const existing = data.attendances ?? [];
    const currentActive = staff.filter(s => s.isActive && (s.joinedAt || s.phone));
    const initial: Record<string, AttStatus> = {};
    for (const s of currentActive) {
      const found = existing.find((a: AttendanceRow) => a.staff?.id === s.id || (a as { staffId?: string }).staffId === s.id);
      initial[s.id] = (found?.status as AttStatus) ?? "present";
    }
    setMarks(initial);
    setLoading(false);
    setSaved(false);
  }, [date, staff]);

  const loadMonthly = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/hr/attendance?month=${month}&year=${year}`);
    const data = await res.json();
    setAttendances(data.attendances ?? []);
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    if (view === "daily") loadDaily();
    else loadMonthly();
  }, [view, loadDaily, loadMonthly]);

  function markAll(status: AttStatus) {
    const m: Record<string, AttStatus> = {};
    for (const s of activeStaff) m[s.id] = status;
    setMarks(m);
  }

  async function saveDaily() {
    setSaving(true);
    const records = activeStaff.map(s => ({ staffId: s.id, status: marks[s.id] ?? "present" }));
    const r = await fetch("/api/hr/attendance/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, records }),
    });
    setSaving(false);
    if (r.ok) {
      setSaved(true);
      showToast("success", "উপস্থিতি সেভ হয়েছে ✓");
    } else {
      showToast("error", "সেভ করা যায়নি");
    }
  }

  const presentCount = attendances.filter(a => a.status === "present").length;
  const absentCount = attendances.filter(a => a.status === "absent").length;
  const filteredMonthly = staffFilter
    ? attendances.filter(a => a.staff?.id === staffFilter)
    : attendances;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <button onClick={() => setView("daily")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${view === "daily" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
            দৈনিক বোর্ড
          </button>
          <button onClick={() => setView("monthly")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${view === "monthly" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}>
            মাসিক তালিকা
          </button>
        </div>
        {view === "monthly" && (
          <div className="flex gap-3 items-center">
            <select value={month} onChange={e => onMonthChange(parseInt(e.target.value))}
              className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white font-medium">
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx + 1}>{name} {year}</option>
              ))}
            </select>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">উপস্থিত: {presentCount}</span>
            <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-red-50 text-red-600">অনুপস্থিত: {absentCount}</span>
          </div>
        )}
      </div>

      {view === "daily" ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <DatePicker value={date} onChange={v => setDate(v)} className="h-10 px-3 rounded-xl border border-gray-200 text-sm" />
              <span className="text-xs text-gray-400">{activeStaff.length} জন কর্মী</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => markAll("present")} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">সবাই উপস্থিত</button>
              <button onClick={saveDaily} disabled={saving || activeStaff.length === 0}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {saved ? "সেভ হয়েছে ✓" : "সেভ করুন"}
              </button>
            </div>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">লোড হচ্ছে...</div>
          ) : activeStaff.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-bold text-gray-900">কোনো সক্রিয় কর্মী নেই</p>
              <p className="text-xs text-gray-400 mt-1">প্রথমে টিম ট্যাবে কর্মী যোগ করুন</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeStaff.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                    {s.user.name[0]?.toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 flex-1 min-w-0 truncate">{s.user.name}</p>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {(Object.keys(BTN) as AttStatus[]).map(status => {
                      const cfg = BTN[status];
                      const Icon = cfg.icon;
                      const active = marks[s.id] === status;
                      return (
                        <button key={status} onClick={() => setMarks(p => ({ ...p, [s.id]: status }))}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all"
                          style={{
                            backgroundColor: active ? cfg.bg : "transparent",
                            color: active ? cfg.color : "#9CA3AF",
                            borderColor: active ? cfg.color : "#E5E7EB",
                          }}>
                          <Icon size={10} />
                          <span className="hidden sm:inline">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white">
            <option value="">সব কর্মী</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
          </select>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400 text-sm">লোড হচ্ছে...</div>
            ) : filteredMonthly.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar size={32} className="mx-auto text-blue-400 mb-3" />
                <p className="font-bold text-gray-900">এই মাসে কোনো উপস্থিতি নেই</p>
                <p className="text-xs text-gray-400 mt-1">দৈনিক বোর্ড থেকে উপস্থিতি নিন</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["তারিখ", "কর্মী", "অবস্থা", "চেক-ইন", "চেক-আউট", "নোট"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonthly.map((att, i) => {
                      const cfg = STATUS_CONFIG[att.status] ?? STATUS_CONFIG.present;
                      return (
                        <tr key={att.id} className="hover:bg-gray-50" style={{ borderBottom: i < filteredMonthly.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                          <td className="px-5 py-3.5 text-sm text-gray-500">{new Date(att.date).toLocaleDateString("bn-BD")}</td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{att.staff?.user?.name}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ color: cfg.color, backgroundColor: cfg.bg }}>{cfg.label}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-500">
                            {att.checkIn ? new Date(att.checkIn).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-500">
                            {att.checkOut ? new Date(att.checkOut).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-400">{att.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
