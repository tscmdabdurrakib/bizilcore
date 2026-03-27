"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, X, ChevronDown, Check, X as XIcon, Clock, Calendar, Scissors, DollarSign, Loader2 } from "lucide-react";
import PlanGate from "@/components/PlanGate";
import { formatBDT } from "@/lib/utils";

interface Staff {
  id: string;
  role: string;
  salary: number | null;
  jobTitle: string | null;
  phone: string | null;
  isActive: boolean;
  user: { name: string };
}

interface Attendance {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  notes: string | null;
  staff: Staff;
}

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  primary: "var(--c-primary)",
  bg: "var(--c-bg)",
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  present: { label: "উপস্থিত", color: "#10B981", bg: "#ECFDF5", icon: <Check size={12} /> },
  absent: { label: "অনুপস্থিত", color: "#EF4444", bg: "#FEF2F2", icon: <XIcon size={12} /> },
  late: { label: "দেরিতে", color: "#F59E0B", bg: "#FFFBEB", icon: <Clock size={12} /> },
  "half-day": { label: "অর্ধদিন", color: "#8B5CF6", bg: "#F5F3FF", icon: <Calendar size={12} /> },
  leave: { label: "ছুটি", color: "#3B82F6", bg: "#EFF6FF", icon: <Calendar size={12} /> },
};

function AttendanceModal({
  staff,
  onClose,
  onSave,
}: {
  staff: Staff[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    staffId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "present",
    checkIn: "",
    checkOut: "",
    notes: "",
  });
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.staffId) return;
    setLoading(true);
    await fetch("/api/hr/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
            উপস্থিতি রেকর্ড
          </h3>
          <button onClick={onClose}>
            <X size={18} style={{ color: S.muted }} />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
              কর্মী *
            </label>
            <div className="relative">
              <select
                value={form.staffId}
                onChange={(e) => setForm((p) => ({ ...p, staffId: e.target.value }))}
                style={{ ...inp(focused === "staff"), appearance: "none", paddingRight: "32px" }}
                required
                onFocus={() => setFocused("staff")}
                onBlur={() => setFocused(null)}
              >
                <option value="">-- কর্মী বেছে নিন --</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
                তারিখ *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                required
                style={inp(focused === "date")}
                onFocus={() => setFocused("date")}
                onBlur={() => setFocused(null)}
              />
            </div>
            <div>
              <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
                অবস্থা *
              </label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  style={{ ...inp(focused === "status"), appearance: "none", paddingRight: "32px" }}
                  onFocus={() => setFocused("status")}
                  onBlur={() => setFocused(null)}
                >
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <option key={v} value={v}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: S.muted }} />
              </div>
            </div>
          </div>

          {form.status !== "absent" && form.status !== "leave" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
                  চেক-ইন
                </label>
                <input
                  type="time"
                  value={form.checkIn}
                  onChange={(e) => setForm((p) => ({ ...p, checkIn: e.target.value }))}
                  style={inp(focused === "ci")}
                  onFocus={() => setFocused("ci")}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
                  চেক-আউট
                </label>
                <input
                  type="time"
                  value={form.checkOut}
                  onChange={(e) => setForm((p) => ({ ...p, checkOut: e.target.value }))}
                  style={inp(focused === "co")}
                  onFocus={() => setFocused("co")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs mb-1 font-medium" style={{ color: S.muted }}>
              নোট
            </label>
            <input
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="ঐচ্ছিক"
              style={inp(focused === "notes")}
              onFocus={() => setFocused("notes")}
              onBlur={() => setFocused(null)}
            />
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
              {loading ? "সেভ..." : "সেভ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CommissionEntry {
  staffId: string;
  staffName: string;
  totalRevenue: number;
  totalCommission: number;
  paidCommission: number;
  services: { apptId: string; date: string; serviceName: string; revenue: number; commission: number; paid: boolean }[];
}

export default function HRPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"staff" | "attendance" | "commission">("staff");
  const [isSalon, setIsSalon] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const [commissionData, setCommissionData] = useState<CommissionEntry[]>([]);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [payingStaffId, setPayingStaffId] = useState<string | null>(null);

  async function loadStaff() {
    const res = await fetch("/api/staff");
    const data = await res.json();
    setStaff(data.staffMembers ?? []);
  }

  async function loadAttendance() {
    const res = await fetch(`/api/hr/attendance?month=${month}&year=${year}`);
    const data = await res.json();
    setAttendances(data.attendances ?? []);
  }

  const loadCommission = useCallback(async () => {
    setCommissionLoading(true);
    const res = await fetch(`/api/appointments/commission?month=${month}&year=${year}`);
    const data = await res.json();
    setCommissionData(data.staff ?? []);
    setCommissionLoading(false);
  }, [month, year]);

  async function load() {
    setLoading(true);
    await Promise.all([loadStaff(), loadAttendance()]);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      setIsSalon(d.shop?.businessType === "salon");
    });
  }, []);

  useEffect(() => {
    load();
  }, [month]);

  useEffect(() => {
    if (activeTab === "commission" && isSalon) loadCommission();
  }, [activeTab, isSalon, loadCommission]);

  async function markCommissionPaid(staffId: string) {
    setPayingStaffId(staffId);
    await fetch("/api/appointments/commission", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, month, year }),
    });
    await loadCommission();
    setPayingStaffId(null);
  }

  const monthNames = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
  ];

  const presentCount = attendances.filter((a) => a.status === "present").length;
  const absentCount = attendances.filter((a) => a.status === "absent").length;
  const totalSalary = staff.reduce((s, m) => s + (m.salary ?? 0), 0);

  return (
    <PlanGate feature="staff">
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--c-primary) 0%, #0A5442 100%)" }}>
            <Users size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>কর্মী ব্যবস্থাপনা</h1>
            <p className="text-xs" style={{ color: S.muted }}>Staff তালিকা, বেতন ও উপস্থিতি এক জায়গায়</p>
          </div>
        </div>
        {activeTab === "attendance" && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
          >
            <Check size={16} /> উপস্থিতি নিন
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "মোট কর্মী", value: staff.length, color: "var(--c-primary)", bg: "var(--c-primary-light)" },
          { label: "সক্রিয় কর্মী", value: staff.filter((s) => s.isActive).length, color: "#059669", bg: "#DCFCE7" },
          { label: `উপস্থিত (${monthNames[month - 1]})`, value: presentCount, color: "var(--c-primary)", bg: "var(--c-primary-light)" },
          { label: "মোট বেতন", value: `৳${totalSalary.toLocaleString("bn-BD")}`, color: "#D97706", bg: "#FEF3C7" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: stat.bg }}>
              <Users size={15} style={{ color: stat.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: S.muted }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl w-fit overflow-x-auto" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
        {[
          { key: "staff" as const, label: "কর্মী তালিকা", show: true },
          { key: "attendance" as const, label: "উপস্থিতি", show: true },
          { key: "commission" as const, label: "কমিশন", show: isSalon },
        ].filter(t => t.show).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            style={{
              backgroundColor: activeTab === tab.key ? S.primary : "transparent",
              color: activeTab === tab.key ? "#fff" : S.muted,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "staff" && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
          {loading ? (
            <div className="p-5 space-y-3 animate-pulse">
              {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: S.bg }} />)}
            </div>
          ) : staff.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center" style={{ backgroundColor: S.surface }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--c-primary-light)" }}>
                <Users size={28} style={{ color: "var(--c-primary)" }} />
              </div>
              <p className="font-semibold text-sm" style={{ color: S.text }}>কোনো কর্মী নেই</p>
              <p className="text-xs mt-1.5" style={{ color: S.muted }}>Settings থেকে কর্মী আমন্ত্রণ জানান</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
                  {["নাম", "পদবী", "ভূমিকা", "ফোন", "বেতন", "অবস্থা"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: S.muted }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="transition-colors" style={{ borderBottom: `1px solid ${S.border}` }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--c-primary-light)")} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: S.primary }}
                        >
                          {member.user.name[0]}
                        </div>
                        <span className="text-sm font-medium" style={{ color: S.text }}>
                          {member.user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: S.muted }}>
                      {member.jobTitle || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: S.text }}>
                      {member.role}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: S.muted }}>
                      {member.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: S.text }}>
                      {member.salary ? `৳${member.salary.toLocaleString("bn-BD")}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          color: member.isActive ? "#10B981" : "#EF4444",
                          backgroundColor: member.isActive ? "#ECFDF5" : "#FEF2F2",
                        }}
                      >
                        {member.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "attendance" && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              style={{ ...inp(false), width: "auto" }}
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx + 1}>
                  {name} {year}
                </option>
              ))}
            </select>
            <div className="flex gap-4 text-sm" style={{ color: S.muted }}>
              <span>উপস্থিত: <strong style={{ color: "#10B981" }}>{presentCount}</strong></span>
              <span>অনুপস্থিত: <strong style={{ color: "#EF4444" }}>{absentCount}</strong></span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${S.border}` }}>
            {loading ? (
              <div className="p-12 text-center" style={{ color: S.muted }}>
                লোড হচ্ছে...
              </div>
            ) : attendances.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar size={36} style={{ color: S.muted }} className="mx-auto mb-3" />
                <p className="font-medium" style={{ color: S.text }}>
                  এই মাসে কোনো উপস্থিতি রেকর্ড নেই
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-3 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: S.primary }}
                >
                  উপস্থিতি নিন
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr style={{ backgroundColor: S.surface, borderBottom: `1px solid ${S.border}` }}>
                    {["তারিখ", "কর্মী", "অবস্থা", "চেক-ইন", "চেক-আউট", "নোট"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: S.muted }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((att) => {
                    const cfg = STATUS_CONFIG[att.status] ?? STATUS_CONFIG.present;
                    return (
                      <tr key={att.id} className="transition-colors" style={{ borderBottom: `1px solid ${S.border}` }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--c-primary-light)")} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "")}>
                        <td className="px-4 py-3 text-sm" style={{ color: S.muted }}>
                          {new Date(att.date).toLocaleDateString("bn-BD")}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: S.text }}>
                          {att.staff?.user?.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: S.muted }}>
                          {att.checkIn ? new Date(att.checkIn).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: S.muted }}>
                          {att.checkOut ? new Date(att.checkOut).toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: S.muted }}>
                          {att.notes || "—"}
                        </td>
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

      {activeTab === "commission" && isSalon && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={month}
              onChange={e => setMonth(parseInt(e.target.value))}
              style={{ height: "40px", border: `1px solid ${S.border}`, borderRadius: "8px", color: S.text, backgroundColor: S.surface, padding: "0 12px", fontSize: "14px", outline: "none", width: "auto" }}
            >
              {["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"].map((name, idx) => (
                <option key={idx} value={idx + 1}>{name} {year}</option>
              ))}
            </select>
          </div>

          {commissionLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 size={28} className="animate-spin" style={{ color: S.muted }} />
            </div>
          ) : commissionData.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#FDF2F8" }}>
                <Scissors size={28} style={{ color: "#EC4899" }} />
              </div>
              <p className="font-semibold text-sm" style={{ color: S.text }}>এই মাসে কোনো কমিশন নেই</p>
              <p className="text-xs mt-1" style={{ color: S.muted }}>সম্পন্ন অ্যাপয়েন্টমেন্ট থেকে কমিশন হিসাব হবে</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commissionData.map(entry => {
                const unpaid = entry.totalCommission - entry.paidCommission;
                return (
                  <div key={entry.staffId} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${S.border}` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: "#EC4899" }}>
                          {entry.staffName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: S.text }}>{entry.staffName}</p>
                          <p className="text-xs" style={{ color: S.muted }}>
                            মোট রাজস্ব: {formatBDT(entry.totalRevenue)} · কমিশন: {formatBDT(entry.totalCommission)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs" style={{ color: S.muted }}>বাকি</p>
                          <p className="font-bold text-sm" style={{ color: unpaid > 0 ? "#EF4444" : "#10B981" }}>
                            {formatBDT(unpaid)}
                          </p>
                        </div>
                        {unpaid > 0 && (
                          <button
                            onClick={() => markCommissionPaid(entry.staffId)}
                            disabled={payingStaffId === entry.staffId}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                            style={{ backgroundColor: "#ECFDF5", color: "#10B981", border: "1px solid #10B981" }}
                          >
                            {payingStaffId === entry.staffId
                              ? <Loader2 size={12} className="animate-spin" />
                              : <DollarSign size={12} />
                            }
                            Commission দিয়েছি
                          </button>
                        )}
                        {unpaid === 0 && entry.totalCommission > 0 && (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ backgroundColor: "#ECFDF5", color: "#10B981" }}>
                            ✓ পরিশোধিত
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[450px]">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                            {["সার্ভিস", "রাজস্ব", "কমিশন", "অবস্থা"].map(h => (
                              <th key={h} className="px-4 py-2 text-left text-xs font-semibold" style={{ color: S.muted }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {entry.services.map((svc, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${S.border}` }}>
                              <td className="px-4 py-2.5">
                                <div className="text-xs font-medium" style={{ color: S.text }}>{svc.serviceName}</div>
                                <div className="text-[10px]" style={{ color: S.muted }}>{new Date(svc.date).toLocaleDateString("bn-BD")}</div>
                              </td>
                              <td className="px-4 py-2.5 text-xs" style={{ color: S.text }}>{formatBDT(svc.revenue)}</td>
                              <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: "#EC4899" }}>{formatBDT(svc.commission)}</td>
                              <td className="px-4 py-2.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                                  style={{ backgroundColor: svc.paid ? "#ECFDF5" : "#FEF2F2", color: svc.paid ? "#10B981" : "#EF4444" }}>
                                  {svc.paid ? "পরিশোধিত" : "বাকি"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showModal && <AttendanceModal staff={staff} onClose={() => setShowModal(false)} onSave={loadAttendance} />}
    </div>
    </PlanGate>
  );
}
