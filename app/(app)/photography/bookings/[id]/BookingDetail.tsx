"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatBDT } from "@/lib/utils";
import {
  Camera, Calendar, MapPin, Users, Phone, ArrowLeft,
  Loader2, CheckCircle, Clock, Truck, Link2, Copy,
  Plus, X, Edit2, Save, AlertTriangle, Heart,
  Briefcase, User, Package, Star, ShoppingBag,
  ExternalLink, Check,
} from "lucide-react";

interface BookingEquipmentItem {
  id: string;
  quantity: number;
  equipment: { id: string; name: string; category: string };
}

interface Booking {
  id: string;
  bookingNumber: string;
  clientName: string;
  clientPhone: string;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  venue?: string;
  duration?: string;
  totalAmount: number;
  costAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: string;
  shootingDone: boolean;
  editingDone: boolean;
  deliveryDate?: string;
  deliveredAt?: string;
  driveLink?: string;
  notes?: string;
  showInPortfolio: boolean;
  checklist?: Record<string, boolean>;
  package?: { name: string; type: string; editingDays: number; duration: string } | null;
  team: Array<{ id: string; staffName: string; role: string }>;
  equipment: BookingEquipmentItem[];
  payments: Array<{ id: string; amount: number; method: string; note?: string; paidAt: string }>;
  customer?: { id: string; name: string; phone: string } | null;
  createdAt: string;
}

const PHOTO_COLOR = "#DB2777";
const PHOTO_BG = "#FDF2F8";
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)" };

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  enquiry:      { label: "Enquiry",      color: "#6B7280", bg: "#F3F4F6" },
  confirmed:    { label: "Confirmed",    color: "#0891B2", bg: "#ECFEFF" },
  advance_paid: { label: "Advance Paid", color: "#7C3AED", bg: "#F5F3FF" },
  shooting_done:{ label: "Shoot Done",  color: "#D97706", bg: "#FEF3C7" },
  editing:      { label: "Editing",     color: "#DB2777", bg: "#FDF2F8" },
  delivered:    { label: "Delivered",   color: "#0F6E56", bg: "#E1F5EE" },
  cancelled:    { label: "বাতিল",       color: "#DC2626", bg: "#FEE2E2" },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "বিবাহ", birthday: "জন্মদিন", corporate: "কর্পোরেট",
  portrait: "পোর্ট্রেট", product: "প্রোডাক্ট", other: "অন্যান্য",
};

const TEAM_ROLE_LABELS: Record<string, string> = {
  lead_photographer: "Lead Photographer",
  "2nd_photographer": "২য় ফটোগ্রাফার",
  videographer: "ভিডিওগ্রাফার",
  drone_operator: "Drone Operator",
  editor: "এডিটর",
};

const CHECKLIST_LABELS: Record<string, string> = {
  advanceConfirmed: "অগ্রিম নিশ্চিত",
  venueConfirmed: "ভেন্যু নিশ্চিত",
  shotListDiscussed: "Shot List আলোচনা",
  equipmentPacked: "সরঞ্জাম প্যাক",
  teamInformed: "Team জানানো",
  backupCharged: "Backup চার্জ",
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "bank", label: "Bank" },
];

interface Props { id: string }

export default function BookingDetail({ id }: Props) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ driveLink: "", note: "", finalPayment: "", method: "cash" });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "cash", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/photography/bookings/${id}`, { cache: "no-store" });
      if (res.ok) setBooking(await res.json());
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patch = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/photography/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setBooking(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleShootDone = () => patch({ shootingDone: true, status: "editing" });

  const handleDeliver = async () => {
    if (!deliveryForm.driveLink) return;
    setSaving(true);
    try {
      if (deliveryForm.finalPayment && parseFloat(deliveryForm.finalPayment) > 0) {
        await fetch("/api/photography/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: id,
            amount: parseFloat(deliveryForm.finalPayment),
            method: deliveryForm.method,
            note: "ফাইনাল পেমেন্ট",
          }),
        });
      }
      await patch({ status: "delivered", driveLink: deliveryForm.driveLink, deliveredAt: new Date().toISOString() });
      setShowDeliveryForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentForm.amount) return;
    setSaving(true);
    try {
      await fetch("/api/photography/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: id, amount: parseFloat(paymentForm.amount), method: paymentForm.method, note: paymentForm.note }),
      });
      setShowPaymentForm(false);
      setPaymentForm({ amount: "", method: "cash", note: "" });
      load();
    } finally {
      setSaving(false);
    }
  };

  const toggleChecklist = (key: string) => {
    if (!booking) return;
    const current = booking.checklist ?? {};
    patch({ checklist: { ...current, [key]: !current[key] } });
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: PHOTO_COLOR }} /></div>;
  if (!booking) return <p className="text-center py-12 text-sm" style={{ color: S.muted }}>বুকিং পাওয়া যায়নি</p>;

  const sm = STATUS_META[booking.status] ?? STATUS_META.confirmed;
  const profit = booking.totalAmount - booking.costAmount;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border" style={{ borderColor: S.border }}>
          <ArrowLeft size={16} style={{ color: S.muted }} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold" style={{ color: S.text }}>{booking.clientName}</h1>
          <p className="text-sm" style={{ color: S.muted }}>{booking.bookingNumber}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
      </div>

      {/* Event info */}
      <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2">
          <Camera size={16} style={{ color: PHOTO_COLOR }} />
          <span className="font-semibold text-sm" style={{ color: S.text }}>ইভেন্ট তথ্য</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs" style={{ color: S.muted }}>ধরন</p>
            <p className="font-medium" style={{ color: S.text }}>{EVENT_TYPE_LABELS[booking.eventType] ?? booking.eventType}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: S.muted }}>তারিখ</p>
            <p className="font-medium" style={{ color: S.text }}>
              {new Date(booking.eventDate).toLocaleDateString("bn-BD", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
              {booking.eventTime && ` · ${booking.eventTime}`}
            </p>
          </div>
          {booking.venue && (
            <div className="col-span-2">
              <p className="text-xs" style={{ color: S.muted }}>ভেন্যু</p>
              <p className="font-medium flex items-center gap-1" style={{ color: S.text }}><MapPin size={12} />{booking.venue}</p>
            </div>
          )}
          {booking.package && (
            <div className="col-span-2">
              <p className="text-xs" style={{ color: S.muted }}>প্যাকেজ</p>
              <p className="font-medium" style={{ color: S.text }}>{booking.package.name} ({booking.package.duration})</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: S.border }}>
          <Phone size={13} style={{ color: S.muted }} />
          <a href={`tel:${booking.clientPhone}`} className="text-sm font-medium" style={{ color: PHOTO_COLOR }}>{booking.clientPhone}</a>
        </div>
      </div>

      {/* Financial summary */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs" style={{ color: S.muted }}>মোট</p>
            <p className="font-bold text-lg" style={{ color: S.text }}>{formatBDT(booking.totalAmount)}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: S.muted }}>পেয়েছি</p>
            <p className="font-bold text-lg" style={{ color: "#0F6E56" }}>{formatBDT(booking.advancePaid)}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: S.muted }}>বাকি</p>
            <p className="font-bold text-lg" style={{ color: booking.dueAmount > 0 ? "#DC2626" : "#0F6E56" }}>{formatBDT(booking.dueAmount)}</p>
          </div>
        </div>
        {booking.costAmount > 0 && (
          <div className="mt-3 pt-3 border-t text-center" style={{ borderColor: S.border }}>
            <p className="text-xs" style={{ color: S.muted }}>লাভ: <span className="font-bold" style={{ color: profit >= 0 ? "#0F6E56" : "#DC2626" }}>{formatBDT(profit)}</span></p>
          </div>
        )}
      </div>

      {/* Status action buttons */}
      {booking.status !== "delivered" && booking.status !== "cancelled" && (
        <div className="rounded-2xl border p-4 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <p className="text-xs font-semibold" style={{ color: S.muted }}>পরবর্তী পদক্ষেপ</p>
          <div className="flex flex-wrap gap-2">
            {!booking.shootingDone && (
              <button onClick={handleShootDone} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5 disabled:opacity-60" style={{ backgroundColor: "#D97706" }}>
                <Camera size={14} /> শুট সম্পন্ন
              </button>
            )}
            {booking.shootingDone && !booking.status.includes("delivered") && (
              <button onClick={() => setShowDeliveryForm(true)} className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-1.5" style={{ backgroundColor: PHOTO_COLOR }}>
                <Truck size={14} /> ফাইল Deliver করুন
              </button>
            )}
            <button onClick={() => setShowPaymentForm(true)} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
              <Plus size={14} /> পেমেন্ট নিন
            </button>
          </div>
        </div>
      )}

      {/* Drive link */}
      {booking.driveLink && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: "#E1F5EE", borderColor: "#A7F3D0" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "#0F6E56" }}>ডেলিভারি লিঙ্ক</p>
          <div className="flex items-center gap-2">
            <a href={booking.driveLink} target="_blank" rel="noopener noreferrer" className="flex-1 text-sm font-medium truncate flex items-center gap-1.5" style={{ color: "#0F6E56" }}>
              <ExternalLink size={13} />
              {booking.driveLink}
            </a>
            <button onClick={() => copyLink(booking.driveLink!)} className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1" style={{ backgroundColor: "#0F6E56", color: "#fff" }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <p className="text-sm font-semibold mb-3" style={{ color: S.text }}>Pre-Shoot Checklist</p>
        <div className="space-y-2">
          {Object.entries(CHECKLIST_LABELS).map(([key, label]) => {
            const checked = booking.checklist?.[key] ?? false;
            return (
              <button key={key} onClick={() => toggleChecklist(key)} className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-gray-50 text-left">
                <div className="w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors" style={{ borderColor: checked ? PHOTO_COLOR : S.border, backgroundColor: checked ? PHOTO_COLOR : "transparent" }}>
                  {checked && <Check size={11} color="#fff" />}
                </div>
                <span className="text-sm" style={{ color: checked ? S.text : S.muted, textDecoration: checked ? "none" : "none" }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Team */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: S.text }}>Team</p>
        </div>
        {booking.team.length === 0 ? (
          <p className="text-sm" style={{ color: S.muted }}>কোনো team সদস্য নেই</p>
        ) : (
          <div className="space-y-2">
            {booking.team.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ borderColor: S.border }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: PHOTO_BG }}>
                  <Users size={14} style={{ color: PHOTO_COLOR }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: S.text }}>{member.staffName}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{TEAM_ROLE_LABELS[member.role] ?? member.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment */}
      {booking.equipment.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <p className="text-sm font-semibold mb-3" style={{ color: S.text }}>সরঞ্জাম তালিকা</p>
          <div className="space-y-2">
            {booking.equipment.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl border" style={{ borderColor: S.border }}>
                <Camera size={14} style={{ color: S.muted }} />
                <span className="text-sm flex-1" style={{ color: S.text }}>{item.equipment.name}</span>
                <span className="text-xs" style={{ color: S.muted }}>{item.equipment.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment history */}
      <div className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold" style={{ color: S.text }}>পেমেন্ট ইতিহাস</p>
          <button onClick={() => setShowPaymentForm(true)} className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ backgroundColor: PHOTO_BG, color: PHOTO_COLOR }}>+ পেমেন্ট</button>
        </div>
        {booking.payments.length === 0 ? (
          <p className="text-sm" style={{ color: S.muted }}>কোনো পেমেন্ট নেই</p>
        ) : (
          <div className="space-y-2">
            {booking.payments.map(pay => (
              <div key={pay.id} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ borderColor: S.border }}>
                <div>
                  <p className="text-sm font-bold" style={{ color: S.text }}>{formatBDT(pay.amount)}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{pay.method}{pay.note ? ` · ${pay.note}` : ""}</p>
                </div>
                <p className="text-xs" style={{ color: S.muted }}>{new Date(pay.paidAt).toLocaleDateString("bn-BD")}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Portfolio toggle */}
      <div className="rounded-2xl border p-4 flex items-center justify-between" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: S.text }}>পোর্টফোলিওতে দেখাবে</p>
          <p className="text-xs" style={{ color: S.muted }}>ক্লায়েন্টের নাম গোপন রাখা হবে</p>
        </div>
        <button onClick={() => patch({ showInPortfolio: !booking.showInPortfolio })} className="w-12 h-6 rounded-full transition-colors relative" style={{ backgroundColor: booking.showInPortfolio ? PHOTO_COLOR : S.border }}>
          <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: booking.showInPortfolio ? "26px" : "2px" }} />
        </button>
      </div>

      {/* Delivery form modal */}
      {showDeliveryForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>ফাইল Deliver করুন</h2>
              <button onClick={() => setShowDeliveryForm(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={{ color: S.muted }}>Google Drive / WeTransfer Link *</label>
                <input value={deliveryForm.driveLink} onChange={e => setDeliveryForm(f => ({ ...f, driveLink: e.target.value }))} placeholder="https://drive.google.com/..." className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              {booking.dueAmount > 0 && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>বাকি পেমেন্ট (৳) — বর্তমান বাকি: {formatBDT(booking.dueAmount)}</label>
                    <input type="number" value={deliveryForm.finalPayment} onChange={e => setDeliveryForm(f => ({ ...f, finalPayment: e.target.value }))} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold" style={{ color: S.muted }}>পেমেন্ট পদ্ধতি</label>
                    <select value={deliveryForm.method} onChange={e => setDeliveryForm(f => ({ ...f, method: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                      {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: S.border }}>
              <button onClick={() => setShowDeliveryForm(false)} className="flex-1 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={handleDeliver} disabled={saving || !deliveryForm.driveLink} className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-1.5" style={{ backgroundColor: PHOTO_COLOR }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                Deliver নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment form modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>পেমেন্ট নিন</h2>
              <button onClick={() => setShowPaymentForm(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={{ color: S.muted }}>পরিমাণ (৳)</label>
                <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} placeholder={`বাকি: ${formatBDT(booking.dueAmount)}`} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={{ color: S.muted }}>পদ্ধতি</label>
                <select value={paymentForm.method} onChange={e => setPaymentForm(f => ({ ...f, method: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold" style={{ color: S.muted }}>নোট</label>
                <input value={paymentForm.note} onChange={e => setPaymentForm(f => ({ ...f, note: e.target.value }))} placeholder="ঐচ্ছিক" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t" style={{ borderColor: S.border }}>
              <button onClick={() => setShowPaymentForm(false)} className="flex-1 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={handlePayment} disabled={saving || !paymentForm.amount} className="flex-1 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60 flex items-center justify-center gap-1.5" style={{ backgroundColor: "#0F6E56" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
