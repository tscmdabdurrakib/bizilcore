"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Calendar, Clock, Users, Phone, MapPin,
  CheckSquare, Square, Plus, X, Building2, Package, DollarSign,
  Pencil, ChevronDown,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Hall { id: string; name: string; capacity: number }
interface EventPackageData { id: string; name: string; price: number }
interface EventVendor {
  id: string; category: string; vendorName: string;
  contactPhone: string | null; quotedAmount: number | null;
  paidAmount: number; status: string; note: string | null;
}
interface EventPayment {
  id: string; amount: number; method: string; note: string | null; paidAt: string;
}
interface ChecklistItem { task: string; done: boolean; dueTime?: string }

interface HallEvent {
  id: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string | null;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  setupTime: string | null;
  guestCount: number;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: string;
  internalNotes: string | null;
  checklist: ChecklistItem[] | null;
  customItems: Array<{ desc: string; price: number }> | null;
  hall: Hall;
  package: EventPackageData | null;
  vendors: EventVendor[];
  payments: EventPayment[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "💍 বিবাহ", birthday: "🎂 জন্মদিন", aqiqa: "👶 আকিকা",
  corporate: "💼 Corporate", seminar: "🎓 Seminar",
  mehndi: "💃 Mehndi", reception: "🎉 Reception", other: "🎊 অন্যান্য",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  enquiry:      { label: "Enquiry",    color: "#6B7280", bg: "#F3F4F6" },
  confirmed:    { label: "নিশ্চিত",   color: "#3B82F6", bg: "#EFF6FF" },
  advance_paid: { label: "অগ্রিম দেওয়া", color: "#7C3AED", bg: "#F5F3FF" },
  completed:    { label: "সম্পন্ন",   color: "#0F6E56", bg: "#E1F5EE" },
  cancelled:    { label: "বাতিল",     color: "#EF4444", bg: "#FEE2E2" },
};

const STATUSES = ["enquiry", "confirmed", "advance_paid", "completed", "cancelled"];

const PAYMENT_METHODS = [
  { value: "cash", label: "নগদ" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank", label: "Bank Transfer" },
];

const VENDOR_CATEGORIES: Record<string, string> = {
  catering: "Catering", decoration: "Decoration", photography: "Photography",
  dj_music: "DJ / Music", cake: "Cake", transport: "Transport", other: "অন্যান্য",
};

const DEFAULT_CHECKLISTS: Record<string, string[]> = {
  wedding: ["Decoration setup", "Catering team arrival", "Stage lighting test", "Sound check", "Parking arrangement", "Dressing room ready"],
  birthday: ["Cake delivery", "Decoration setup", "Sound check", "Seating arrangement"],
  aqiqa: ["Catering setup", "Seating arrangement", "Decoration"],
  corporate: ["AV equipment test", "Seating arrangement", "Refreshment setup"],
  seminar: ["Projector test", "Sound check", "Seating arrangement", "Registration desk"],
  other: ["Decoration setup", "Sound check", "Catering arrangement"],
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  bg: "var(--c-bg)",
};

export default function EventDetail({ id }: { id: string }) {
  const [event, setEvent] = useState<HallEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "cash", note: "" });
  const [vendorForm, setVendorForm] = useState({ category: "catering", vendorName: "", contactPhone: "", quotedAmount: "" });
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingVendor, setSavingVendor] = useState(false);
  const [newTask, setNewTask] = useState("");

  const fetchEvent = useCallback(async () => {
    const res = await fetch(`/api/convention/events/${id}`);
    if (res.ok) {
      const data = await res.json();
      if (!data.checklist) {
        const defaultTasks = (DEFAULT_CHECKLISTS[data.eventType] ?? DEFAULT_CHECKLISTS.other).map((task) => ({ task, done: false }));
        data.checklist = defaultTasks;
        await fetch(`/api/convention/events/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checklist: defaultTasks }),
        });
      }
      setEvent(data);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const handleStatusChange = async (newStatus: string) => {
    setShowStatusPicker(false);
    await fetch(`/api/convention/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchEvent();
  };

  const handlePaymentSubmit = async () => {
    if (!paymentForm.amount) return;
    setSavingPayment(true);
    await fetch(`/api/convention/events/${id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentForm),
    });
    setSavingPayment(false);
    setShowPaymentModal(false);
    setPaymentForm({ amount: "", method: "cash", note: "" });
    fetchEvent();
  };

  const handleVendorSubmit = async () => {
    if (!vendorForm.vendorName) return;
    setSavingVendor(true);
    await fetch(`/api/convention/events/${id}/vendors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vendorForm),
    });
    setSavingVendor(false);
    setShowVendorModal(false);
    setVendorForm({ category: "catering", vendorName: "", contactPhone: "", quotedAmount: "" });
    fetchEvent();
  };

  const handleChecklistToggle = async (idx: number) => {
    if (!event) return;
    const newChecklist = event.checklist!.map((item, i) =>
      i === idx ? { ...item, done: !item.done } : item
    );
    setEvent((e) => e ? { ...e, checklist: newChecklist } : e);
    await fetch(`/api/convention/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: newChecklist }),
    });
  };

  const handleAddTask = async () => {
    if (!newTask.trim() || !event) return;
    const newChecklist = [...(event.checklist ?? []), { task: newTask, done: false }];
    setEvent((e) => e ? { ...e, checklist: newChecklist } : e);
    setNewTask("");
    await fetch(`/api/convention/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checklist: newChecklist }),
    });
  };

  const handleVendorStatus = async (vendorId: string, status: string) => {
    await fetch(`/api/convention/events/${id}/vendors`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, status }),
    });
    fetchEvent();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "#7C3AED" }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p style={{ color: S.muted }}>ইভেন্ট পাওয়া যায়নি</p>
        <Link href="/convention/events" className="text-sm font-semibold mt-2 block" style={{ color: "#7C3AED" }}>
          ইভেন্ট তালিকায় ফিরুন
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.confirmed;
  const evDate = new Date(event.eventDate);
  const checklist = event.checklist ?? [];
  const doneCount = checklist.filter((x) => x.done).length;

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/convention/events" className="p-2 rounded-xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <ArrowLeft size={16} style={{ color: S.muted }} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold truncate" style={{ color: S.text }}>{event.clientName}</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}>
              {statusCfg.label}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
              {event.bookingNumber}
            </span>
          </div>
          <p className="text-xs" style={{ color: S.muted }}>{EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setShowStatusPicker(!showStatusPicker)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
          >
            Status পরিবর্তন <ChevronDown size={12} />
          </button>
          {showStatusPicker && (
            <div className="absolute top-full left-0 mt-1 z-10 rounded-xl border shadow-lg overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              {STATUSES.map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left text-xs font-medium hover:opacity-80"
                    style={{ backgroundColor: event.status === s ? cfg.bg : S.surface, color: cfg.color }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ backgroundColor: "#0F6E56" }}
        >
          <DollarSign size={12} /> পেমেন্ট নিন
        </button>
        <button
          onClick={() => setShowVendorModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}
        >
          <Plus size={12} /> Vendor
        </button>
      </div>

      {/* Event Info Card */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: S.text }}>ইভেন্ট বিবরণ</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-start gap-2">
            <Building2 size={14} style={{ color: "#7C3AED" }} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px]" style={{ color: S.muted }}>হল</p>
              <p className="text-xs font-semibold" style={{ color: S.text }}>{event.hall.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={14} style={{ color: "#7C3AED" }} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px]" style={{ color: S.muted }}>তারিখ</p>
              <p className="text-xs font-semibold" style={{ color: S.text }}>
                {evDate.toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock size={14} style={{ color: "#7C3AED" }} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px]" style={{ color: S.muted }}>সময়</p>
              <p className="text-xs font-semibold" style={{ color: S.text }}>{event.startTime} - {event.endTime}</p>
              {event.setupTime && <p className="text-[10px]" style={{ color: S.muted }}>Setup: {event.setupTime}</p>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users size={14} style={{ color: "#7C3AED" }} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px]" style={{ color: S.muted }}>অতিথি</p>
              <p className="text-xs font-semibold" style={{ color: S.text }}>{event.guestCount} জন</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone size={14} style={{ color: "#7C3AED" }} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px]" style={{ color: S.muted }}>ফোন</p>
              <p className="text-xs font-semibold" style={{ color: S.text }}>{event.clientPhone}</p>
            </div>
          </div>
          {event.clientAddress && (
            <div className="flex items-start gap-2">
              <MapPin size={14} style={{ color: "#7C3AED" }} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px]" style={{ color: S.muted }}>ঠিকানা</p>
                <p className="text-xs font-semibold" style={{ color: S.text }}>{event.clientAddress}</p>
              </div>
            </div>
          )}
          {event.package && (
            <div className="flex items-start gap-2">
              <Package size={14} style={{ color: "#7C3AED" }} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px]" style={{ color: S.muted }}>প্যাকেজ</p>
                <p className="text-xs font-semibold" style={{ color: S.text }}>{event.package.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h2 className="text-sm font-bold mb-3" style={{ color: S.text }}>আর্থিক সারসংক্ষেপ</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: "মোট", value: event.totalAmount, color: "#7C3AED", bg: "#F5F3FF" },
            { label: "পরিশোধিত", value: event.advancePaid, color: "#0F6E56", bg: "#E1F5EE" },
            { label: "বাকি", value: event.dueAmount, color: event.dueAmount > 0 ? "#EF4444" : "#0F6E56", bg: event.dueAmount > 0 ? "#FEE2E2" : "#E1F5EE" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: item.bg }}>
              <p className="text-[10px] font-medium mb-0.5" style={{ color: item.color }}>{item.label}</p>
              <p className="text-sm font-bold" style={{ color: item.color }}>{formatBDT(item.value)}</p>
            </div>
          ))}
        </div>

        {event.payments.length > 0 && (
          <div>
            <p className="text-[11px] font-bold mb-2" style={{ color: S.muted }}>পেমেন্ট ইতিহাস</p>
            <div className="space-y-1.5">
              {event.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: S.bg }}>
                  <div>
                    <span className="text-xs font-semibold" style={{ color: S.text }}>{formatBDT(p.amount)}</span>
                    <span className="text-[10px] ml-1.5 px-1.5 py-0.5 rounded" style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>{p.method}</span>
                    {p.note && <span className="text-[10px] ml-1" style={{ color: S.muted }}>· {p.note}</span>}
                  </div>
                  <p className="text-[10px]" style={{ color: S.muted }}>
                    {new Date(p.paidAt).toLocaleDateString("bn-BD")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vendors */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold" style={{ color: S.text }}>Vendor তালিকা</h2>
          <button
            onClick={() => setShowVendorModal(true)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: "#EFF6FF", color: "#3B82F6" }}
          >
            + যোগ করুন
          </button>
        </div>

        {event.vendors.length === 0 ? (
          <p className="text-xs text-center py-3" style={{ color: S.muted }}>কোনো Vendor যোগ করা হয়নি</p>
        ) : (
          <div className="space-y-2">
            {event.vendors.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: S.bg }}>
                <div>
                  <p className="text-xs font-semibold" style={{ color: S.text }}>{v.vendorName}</p>
                  <p className="text-[10px]" style={{ color: S.muted }}>
                    {VENDOR_CATEGORIES[v.category] ?? v.category}
                    {v.contactPhone && ` · ${v.contactPhone}`}
                    {v.quotedAmount && ` · ${formatBDT(v.quotedAmount)}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleVendorStatus(v.id, v.status === "confirmed" ? "cancelled" : "confirmed")}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: v.status === "confirmed" ? "#E1F5EE" : "#FEE2E2",
                      color: v.status === "confirmed" ? "#0F6E56" : "#EF4444",
                    }}
                  >
                    {v.status === "confirmed" ? "নিশ্চিত" : "বাতিল"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold" style={{ color: S.text }}>
            ইভেন্ট চেকলিস্ট
            {checklist.length > 0 && (
              <span className="ml-2 text-[11px] font-normal" style={{ color: S.muted }}>
                {doneCount}/{checklist.length} সম্পন্ন
              </span>
            )}
          </h2>
        </div>

        <div className="space-y-1.5 mb-3">
          {checklist.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleChecklistToggle(idx)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all"
              style={{ backgroundColor: item.done ? "#E1F5EE" : S.bg }}
            >
              {item.done
                ? <CheckSquare size={15} style={{ color: "#0F6E56" }} className="flex-shrink-0" />
                : <Square size={15} style={{ color: S.muted }} className="flex-shrink-0" />}
              <span
                className="text-xs"
                style={{
                  color: item.done ? "#0F6E56" : S.text,
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.task}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            placeholder="নতুন কাজ যোগ করুন..."
            className="flex-1 px-3 py-2 rounded-xl border text-sm"
            style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
          />
          <button
            onClick={handleAddTask}
            className="px-3 py-2 rounded-xl text-white text-sm font-bold"
            style={{ backgroundColor: "#7C3AED" }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Internal Notes */}
      {event.internalNotes && (
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "#B45309" }}>অভ্যন্তরীণ নোট</p>
          <p className="text-sm" style={{ color: "#92400E" }}>{event.internalNotes}</p>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-5 w-full max-w-sm" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ color: S.text }}>পেমেন্ট নিন</h2>
              <button onClick={() => setShowPaymentModal(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl p-3 mb-1" style={{ backgroundColor: "#FEE2E2" }}>
                <p className="text-xs" style={{ color: "#EF4444" }}>বাকি: <span className="font-bold">{formatBDT(event.dueAmount)}</span></p>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>পরিমাণ (৳) *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder={String(event.dueAmount)}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: S.text }}>পদ্ধতি</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentForm((f) => ({ ...f, method: pm.value }))}
                      className="py-2 rounded-xl border text-xs font-medium"
                      style={{
                        backgroundColor: paymentForm.method === pm.value ? "#E1F5EE" : S.bg,
                        borderColor: paymentForm.method === pm.value ? "#0F6E56" : S.border,
                        color: paymentForm.method === pm.value ? "#0F6E56" : S.muted,
                      }}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>নোট</label>
                <input
                  value={paymentForm.note}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="পেমেন্ট নোট"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>
              <button
                onClick={handlePaymentSubmit}
                disabled={savingPayment || !paymentForm.amount}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#0F6E56" }}
              >
                {savingPayment && <Loader2 size={14} className="animate-spin" />}
                পেমেন্ট নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="rounded-2xl p-5 w-full max-w-sm" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-base" style={{ color: S.text }}>Vendor যোগ করুন</h2>
              <button onClick={() => setShowVendorModal(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>Category</label>
                <select
                  value={vendorForm.category}
                  onChange={(e) => setVendorForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                >
                  {Object.entries(VENDOR_CATEGORIES).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>Vendor নাম *</label>
                <input
                  value={vendorForm.vendorName}
                  onChange={(e) => setVendorForm((f) => ({ ...f, vendorName: e.target.value }))}
                  placeholder="Vendor-এর নাম"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>ফোন নম্বর</label>
                <input
                  value={vendorForm.contactPhone}
                  onChange={(e) => setVendorForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: S.text }}>কোটেড পরিমাণ (৳)</label>
                <input
                  type="number"
                  value={vendorForm.quotedAmount}
                  onChange={(e) => setVendorForm((f) => ({ ...f, quotedAmount: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl border text-sm"
                  style={{ backgroundColor: S.bg, borderColor: S.border, color: S.text }}
                />
              </div>
              <button
                onClick={handleVendorSubmit}
                disabled={savingVendor || !vendorForm.vendorName}
                className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: "#3B82F6" }}
              >
                {savingVendor && <Loader2 size={14} className="animate-spin" />}
                Vendor যোগ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Picker Backdrop */}
      {showStatusPicker && (
        <div className="fixed inset-0 z-[9]" onClick={() => setShowStatusPicker(false)} />
      )}
    </div>
  );
}
