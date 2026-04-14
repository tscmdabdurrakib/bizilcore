"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users, X, ChevronDown, Check, X as XIcon, Clock, Calendar, Scissors,
  DollarSign, Loader2, UserPlus, Crown, User, Copy, Trash2, TrendingUp,
  ShieldCheck, AlertCircle,
} from "lucide-react";
import PlanGate from "@/components/PlanGate";
import { formatBDT } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────── */
interface StaffMember {
  id: string;
  role: string;
  salary: number | null;
  jobTitle: string | null;
  phone: string | null;
  isActive: boolean;
  inviteToken: string | null;
  joinedAt: string | null;
  user: { name: string; email: string };
}

interface Attendance {
  id: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  notes: string | null;
  staff: StaffMember;
}

interface CommissionEntry {
  staffId: string;
  staffName: string;
  totalRevenue: number;
  totalCommission: number;
  paidCommission: number;
  services: { apptId: string; date: string; serviceName: string; revenue: number; commission: number; paid: boolean }[];
}

/* ─── Constants ──────────────────────────────────────────── */
const ROLE_LABEL: Record<string, string> = { manager: "ম্যানেজার", staff: "স্টাফ" };
const ROLE_COLOR: Record<string, { bg: string; text: string }> = {
  manager: { bg: "#DCFCE7", text: "#16A34A" },
  staff: { bg: "#EDE9FE", text: "#7C3AED" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  present: { label: "উপস্থিত", color: "#10B981", bg: "#ECFDF5", icon: <Check size={12} /> },
  absent: { label: "অনুপস্থিত", color: "#EF4444", bg: "#FEF2F2", icon: <XIcon size={12} /> },
  late: { label: "দেরিতে", color: "#F59E0B", bg: "#FFFBEB", icon: <Clock size={12} /> },
  "half-day": { label: "অর্ধদিন", color: "#8B5CF6", bg: "#F5F3FF", icon: <Calendar size={12} /> },
  leave: { label: "ছুটি", color: "#3B82F6", bg: "#EFF6FF", icon: <Calendar size={12} /> },
};

const MONTH_NAMES = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

/* ─── Sub-components ──────────────────────────────────────── */
function StatCard({ label, value, sub, gradient, icon: Icon }: {
  label: string; value: string | number; sub?: string;
  gradient: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`} style={{ background: gradient }}>
          <Icon size={16} color="#fff" />
        </div>
        {sub && (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{sub}</span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5 font-medium">{label}</p>
      </div>
    </div>
  );
}

function InviteModal({ onClose, onInvited, showToast }: {
  onClose: () => void;
  onInvited: (member: StaffMember) => void;
  showToast: (type: "success" | "error", msg: string) => void;
}) {
  const [form, setForm] = useState({ email: "", role: "staff" });
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    const r = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setInviting(false);
    if (r.ok) {
      setInviteLink(d.inviteUrl);
      onInvited(d);
      setForm({ email: "", role: "staff" });
    } else {
      showToast("error", d.error ?? "Invite পাঠানো যায়নি।");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
              <UserPlus size={16} color="#fff" />
            </div>
            <h3 className="font-bold text-gray-900">Staff Invite করুন</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {inviteLink ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Check size={12} className="text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">Invite link তৈরি হয়েছে!</p>
            </div>
            <p className="text-xs text-gray-500 mb-3">এই link টি staff-কে পাঠান, তিনি এটা দিয়ে অ্যাকাউন্ট তৈরি করবেন।</p>
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-gray-50 border border-gray-200">
              <p className="text-xs font-mono flex-1 break-all text-gray-700">{inviteLink}</p>
              <button
                onClick={() => { navigator.clipboard.writeText(inviteLink); showToast("success", "Copy হয়েছে ✓"); }}
                className="p-1.5 rounded-lg hover:bg-gray-200 flex-shrink-0"
              >
                <Copy size={14} className="text-gray-500" />
              </button>
            </div>
            <button
              onClick={() => { setInviteLink(null); onClose(); }}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
            >
              সম্পন্ন হয়েছে
            </button>
          </div>
        ) : (
          <form onSubmit={sendInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email ঠিকানা *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="staff@example.com"
                required
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 text-gray-900 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">ভূমিকা (Role)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "manager", label: "ম্যানেজার", desc: "Settings ছাড়া সব" },
                  { value: "staff", label: "স্টাফ", desc: "শুধু অর্ডার" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, role: opt.value }))}
                    className={`p-3 rounded-xl border text-left transition-all ${form.role === opt.value ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <p className={`text-sm font-semibold ${form.role === opt.value ? "text-emerald-700" : "text-gray-700"}`}>{opt.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={inviting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
              >
                {inviting ? <Loader2 size={15} className="animate-spin mx-auto" /> : "Invite করুন"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function AttendanceModal({ staff, onClose, onSave }: {
  staff: StaffMember[]; onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    staffId: "",
    date: new Date().toISOString().slice(0, 10),
    status: "present",
    checkIn: "",
    checkOut: "",
    notes: "",
  });
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
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}>
              <Calendar size={16} color="#fff" />
            </div>
            <h3 className="font-bold text-gray-900">উপস্থিতি রেকর্ড</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">কর্মী *</label>
            <div className="relative">
              <select
                value={form.staffId}
                onChange={e => setForm(p => ({ ...p, staffId: e.target.value }))}
                required
                className="w-full h-10 px-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 text-gray-900 appearance-none"
              >
                <option value="">-- কর্মী বেছে নিন --</option>
                {staff.filter(s => s.joinedAt).map(s => (
                  <option key={s.id} value={s.id}>{s.user.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">তারিখ *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                required
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">অবস্থা *</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 text-gray-900 appearance-none"
                >
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <option key={v} value={v}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>
          </div>
          {form.status !== "absent" && form.status !== "leave" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">চেক-ইন</label>
                <input type="time" value={form.checkIn} onChange={e => setForm(p => ({ ...p, checkIn: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 text-gray-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">চেক-আউট</label>
                <input type="time" value={form.checkOut} onChange={e => setForm(p => ({ ...p, checkOut: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 text-gray-900" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">নোট</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="ঐচ্ছিক"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 text-gray-900" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              বাতিল
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}>
              {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : "সেভ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function HRPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAttModal, setShowAttModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"staff" | "attendance" | "commission">("staff");
  const [isSalon, setIsSalon] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  const [commissionData, setCommissionData] = useState<CommissionEntry[]>([]);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [payingStaffId, setPayingStaffId] = useState<string | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadStaff() {
    const res = await fetch("/api/staff");
    const data = await res.json();
    setStaff(Array.isArray(data) ? data : (data.staffMembers ?? []));
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

  useEffect(() => { load(); }, [month]);

  useEffect(() => {
    if (activeTab === "commission" && isSalon) loadCommission();
  }, [activeTab, isSalon, loadCommission]);

  async function removeStaff(id: string) {
    const r = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (r.ok) {
      setStaff(prev => prev.filter(s => s.id !== id));
      showToast("success", "Staff সরিয়ে দেওয়া হয়েছে ✓");
    } else {
      showToast("error", "সরানো যায়নি।");
    }
  }

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

  const presentCount = attendances.filter(a => a.status === "present").length;
  const absentCount = attendances.filter(a => a.status === "absent").length;
  const totalSalary = staff.reduce((s, m) => s + (m.salary ?? 0), 0);
  const activeCount = staff.filter(s => s.isActive && s.joinedAt).length;
  const pendingCount = staff.filter(s => !s.joinedAt).length;

  const TABS = [
    { key: "staff" as const, label: "কর্মী তালিকা", show: true },
    { key: "attendance" as const, label: "উপস্থিতি", show: true },
    { key: "commission" as const, label: "কমিশন", show: isSalon },
  ].filter(t => t.show);

  return (
    <PlanGate feature="staff">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-emerald-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* ─── Header ──────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
              <Users size={18} color="#fff" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900">কর্মী ব্যবস্থাপনা</h1>
              <p className="text-xs text-gray-400 font-medium">Staff তালিকা, বেতন ও উপস্থিতি এক জায়গায়</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeTab === "attendance" && (
              <button
                onClick={() => setShowAttModal(true)}
                className="flex items-center gap-2 px-4 h-9 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}
              >
                <Calendar size={14} /> উপস্থিতি নিন
              </button>
            )}
            {activeTab === "staff" && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-4 h-9 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
              >
                <UserPlus size={14} /> Invite করুন
              </button>
            )}
          </div>
        </div>

        {/* ─── Stat Cards ──────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="মোট কর্মী"
            value={staff.length}
            gradient="linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)"
            icon={Users}
          />
          <StatCard
            label="সক্রিয় কর্মী"
            value={activeCount}
            sub={pendingCount > 0 ? `${pendingCount} pending` : undefined}
            gradient="linear-gradient(135deg, #059669 0%, #047857 100%)"
            icon={ShieldCheck}
          />
          <StatCard
            label={`উপস্থিত (${MONTH_NAMES[month - 1]})`}
            value={presentCount}
            gradient="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
            icon={Check}
          />
          <StatCard
            label="মোট বেতন বিল"
            value={formatBDT(totalSalary)}
            gradient="linear-gradient(135deg, #D97706 0%, #B45309 100%)"
            icon={TrendingUp}
          />
        </div>

        {/* ─── Pill Tab Bar ─────────────────── */}
        <div className="flex gap-1 p-1 rounded-2xl w-fit overflow-x-auto bg-gray-100">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                background: activeTab === tab.key ? "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" : "transparent",
                color: activeTab === tab.key ? "#fff" : "#6B7280",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Staff Tab ────────────────────── */}
        {activeTab === "staff" && (
          <div className="space-y-4">
            {/* Permission Matrix */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">Permission Matrix</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { role: "ম্যানেজার", icon: Crown, perms: "Orders, Products, Customers, Reports — সব দেখা ও এডিট। Settings ও Billing ছাড়া।", color: "#16A34A", bg: "#DCFCE7" },
                  { role: "স্টাফ", icon: User, perms: "শুধু Orders দেখা ও তৈরি করতে পারবে।", color: "#7C3AED", bg: "#EDE9FE" },
                ].map(({ role, icon: Icon, perms, color, bg }) => (
                  <div key={role} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: bg + "60" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color }}>{role}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{perms}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : staff.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-emerald-50">
                    <Users size={28} className="text-emerald-600" />
                  </div>
                  <p className="font-bold text-gray-900">কোনো কর্মী নেই</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">উপরের Invite বাটন দিয়ে প্রথম কর্মী যোগ করুন</p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
                    style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
                  >
                    <UserPlus size={14} /> + Invite করুন
                  </button>
                </div>
              ) : (
                <div>
                  {staff.map((member, i) => {
                    const rc = ROLE_COLOR[member.role] ?? { bg: "#F3F4F6", text: "#374151" };
                    const joined = !!member.joinedAt;
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                        style={{ borderBottom: i < staff.length - 1 ? "1px solid #F3F4F6" : "none" }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
                        >
                          {member.user.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-gray-900 truncate">{member.user.name}</p>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                              style={{ backgroundColor: rc.bg, color: rc.text }}>
                              {ROLE_LABEL[member.role] ?? member.role}
                            </span>
                            {!joined && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 bg-amber-50 text-amber-600 flex items-center gap-1">
                                <AlertCircle size={9} /> Invite pending
                              </span>
                            )}
                            {joined && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 bg-emerald-50 text-emerald-600">
                                ✓ যোগ দিয়েছেন
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{member.user.email}</p>
                          {member.jobTitle && <p className="text-xs text-gray-500 truncate">{member.jobTitle}</p>}
                        </div>
                        <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                          {member.salary ? (
                            <div className="text-right">
                              <p className="text-xs text-gray-400">বেতন</p>
                              <p className="text-sm font-bold text-gray-900">{formatBDT(member.salary)}</p>
                            </div>
                          ) : null}
                        </div>
                        <button
                          onClick={() => removeStaff(member.id)}
                          className="p-2 rounded-xl hover:bg-red-50 flex-shrink-0 transition-colors"
                        >
                          <Trash2 size={15} className="text-red-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Attendance Tab ───────────────── */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative">
                <select
                  value={month}
                  onChange={e => setMonth(parseInt(e.target.value))}
                  className="h-10 px-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500 text-gray-700 appearance-none bg-white font-medium"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx} value={idx + 1}>{name} {year}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
              <div className="flex gap-3">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  উপস্থিত: {presentCount}
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold">
                  অনুপস্থিত: {absentCount}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-gray-400 text-sm">লোড হচ্ছে...</div>
              ) : attendances.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-blue-50 mx-auto">
                    <Calendar size={28} className="text-blue-500" />
                  </div>
                  <p className="font-bold text-gray-900">এই মাসে কোনো উপস্থিতি নেই</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">উপরের বাটন দিয়ে আজকের উপস্থিতি রেকর্ড করুন</p>
                  <button
                    onClick={() => setShowAttModal(true)}
                    className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                    style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}
                  >
                    উপস্থিতি নিন
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {["তারিখ", "কর্মী", "অবস্থা", "চেক-ইন", "চেক-আউট", "নোট"].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {attendances.map((att, i) => {
                        const cfg = STATUS_CONFIG[att.status] ?? STATUS_CONFIG.present;
                        return (
                          <tr key={att.id} className="hover:bg-gray-50 transition-colors"
                            style={{ borderBottom: i < attendances.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                            <td className="px-5 py-3.5 text-sm text-gray-500">
                              {new Date(att.date).toLocaleDateString("bn-BD")}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
                                  {att.staff?.user?.name?.[0]?.toUpperCase()}
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{att.staff?.user?.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                                style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                                {cfg.icon}
                                {cfg.label}
                              </span>
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

        {/* ─── Commission Tab ───────────────── */}
        {activeTab === "commission" && isSalon && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={month}
                  onChange={e => setMonth(parseInt(e.target.value))}
                  className="h-10 px-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none focus:border-pink-500 text-gray-700 appearance-none bg-white font-medium"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx} value={idx + 1}>{name} {year}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
              </div>
            </div>

            {commissionLoading ? (
              <div className="py-16 flex justify-center">
                <Loader2 size={28} className="animate-spin text-gray-400" />
              </div>
            ) : commissionData.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-pink-50">
                  <Scissors size={28} className="text-pink-500" />
                </div>
                <p className="font-bold text-gray-900">এই মাসে কোনো কমিশন নেই</p>
                <p className="text-xs text-gray-400 mt-1">সম্পন্ন অ্যাপয়েন্টমেন্ট থেকে কমিশন হিসাব হবে</p>
              </div>
            ) : (
              <div className="space-y-4">
                {commissionData.map(entry => {
                  const unpaid = entry.totalCommission - entry.paidCommission;
                  return (
                    <div key={entry.staffId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white"
                            style={{ background: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)" }}>
                            {entry.staffName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{entry.staffName}</p>
                            <p className="text-xs text-gray-400">
                              রাজস্ব: {formatBDT(entry.totalRevenue)} · কমিশন: {formatBDT(entry.totalCommission)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-400">বাকি</p>
                            <p className="font-black text-sm" style={{ color: unpaid > 0 ? "#EF4444" : "#10B981" }}>
                              {formatBDT(unpaid)}
                            </p>
                          </div>
                          {unpaid > 0 && (
                            <button
                              onClick={() => markCommissionPaid(entry.staffId)}
                              disabled={payingStaffId === entry.staffId}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            >
                              {payingStaffId === entry.staffId
                                ? <Loader2 size={12} className="animate-spin" />
                                : <DollarSign size={12} />}
                              দিয়েছি
                            </button>
                          )}
                          {unpaid === 0 && entry.totalCommission > 0 && (
                            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700">
                              ✓ পরিশোধিত
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[450px]">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                              {["সার্ভিস", "রাজস্ব", "কমিশন", "অবস্থা"].map(h => (
                                <th key={h} className="px-5 py-2.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {entry.services.map((svc, i) => (
                              <tr key={i} className="hover:bg-gray-50 transition-colors"
                                style={{ borderBottom: i < entry.services.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                                <td className="px-5 py-3">
                                  <div className="text-sm font-medium text-gray-900">{svc.serviceName}</div>
                                  <div className="text-[11px] text-gray-400">{new Date(svc.date).toLocaleDateString("bn-BD")}</div>
                                </td>
                                <td className="px-5 py-3 text-sm text-gray-700">{formatBDT(svc.revenue)}</td>
                                <td className="px-5 py-3 text-sm font-bold text-pink-600">{formatBDT(svc.commission)}</td>
                                <td className="px-5 py-3">
                                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
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
      </div>

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvited={member => setStaff(prev => [member, ...prev])}
          showToast={showToast}
        />
      )}
      {showAttModal && (
        <AttendanceModal
          staff={staff}
          onClose={() => setShowAttModal(false)}
          onSave={loadAttendance}
        />
      )}
    </PlanGate>
  );
}
