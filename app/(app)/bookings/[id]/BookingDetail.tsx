"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, LogIn, LogOut, Plus, Phone, MapPin, Clock, Coffee, X, BadgeDollarSign, Trash2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface RoomService {
  id: string;
  item: string;
  quantity: number;
  price: number;
  status: string;
  orderedAt: string;
}

interface Booking {
  id: string;
  bookingNumber: string;
  guestName: string;
  guestPhone: string;
  guestNID: string | null;
  guestAddress: string | null;
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  ratePerNight: number;
  extraCharges: number;
  extraNote: string | null;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  paymentMethod: string | null;
  status: string;
  source: string;
  note: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelledAt: string | null;
  room: { id: string; number: string; type: string };
  roomServices: RoomService[];
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  confirmed:   { label: "Confirmed",   bg: "#E6F1FB", color: "#0C447C" },
  checked_in:  { label: "Checked In",  bg: "#E1F5EE", color: "#085041" },
  checked_out: { label: "Checked Out", bg: "#F1EFE8", color: "#444441" },
  cancelled:   { label: "Cancelled",   bg: "#FCEBEB", color: "#791F1F" },
};

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

export default function BookingDetail({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [serviceForm, setServiceForm] = useState({ item: "", quantity: 1, price: 0 });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, paymentMethod: "cash" });
  const [checkOutForm, setCheckOutForm] = useState({ payNow: 0, additionalCharges: 0, paymentMethod: "cash" });

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { cache: "no-store" });
      if (res.ok) setBooking(await res.json());
    } catch {}
    setLoading(false);
  }, [bookingId]);

  useEffect(() => { fetchBooking(); }, [fetchBooking]);

  const callAction = async (path: string, body?: unknown, method: "POST" | "PATCH" = "POST") => {
    setBusy(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "সমস্যা হয়েছে");
      } else {
        await fetchBooking();
      }
    } catch {
      alert("সার্ভার সমস্যা");
    }
    setBusy(false);
  };

  const checkIn = () => callAction("/check-in");

  const cancel = async () => {
    const reason = prompt("বাতিলের কারণ (ঐচ্ছিক):") ?? "";
    if (!confirm("এই বুকিং বাতিল করবেন?")) return;
    await callAction("", { action: "cancel", reason }, "PATCH");
  };

  const submitCheckOut = async () => {
    setShowCheckOutModal(false);
    await callAction("/check-out", checkOutForm);
  };

  const submitService = async () => {
    if (!serviceForm.item.trim() || !serviceForm.price) return;
    setShowServiceModal(false);
    await callAction("/services", serviceForm);
    setServiceForm({ item: "", quantity: 1, price: 0 });
  };

  const submitPayment = async () => {
    if (!paymentForm.amount) return;
    setShowPaymentModal(false);
    await callAction("/payment", paymentForm);
    setPaymentForm({ amount: 0, paymentMethod: "cash" });
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#0F6E56" }} /></div>;
  }
  if (!booking) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: S.muted }}>বুকিং পাওয়া যায়নি</p>
        <Link href="/bookings" className="text-xs font-bold mt-3 inline-block" style={{ color: "#0F6E56" }}>← সব বুকিং</Link>
      </div>
    );
  }

  const status = STATUS_META[booking.status] ?? STATUS_META.confirmed;
  const servicesTotal = booking.roomServices.reduce((s, r) => s + r.price * r.quantity, 0);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-xs font-medium" style={{ color: S.muted }}>
        <ChevronLeft size={14} /> ফিরে যান
      </button>

      {/* Header card */}
      <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: status.bg, color: status.color }}>{status.label}</span>
              <span className="text-xs font-mono" style={{ color: S.muted }}>{booking.bookingNumber}</span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: S.text }}>{booking.guestName}</h1>
            <div className="flex flex-wrap gap-3 mt-1 text-xs" style={{ color: S.muted }}>
              <span className="flex items-center gap-1"><Phone size={11} /> {booking.guestPhone}</span>
              {booking.guestAddress && <span className="flex items-center gap-1"><MapPin size={11} /> {booking.guestAddress}</span>}
              {booking.guestNID && <span>NID: {booking.guestNID}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold" style={{ color: "#0F6E56" }}>{formatBDT(booking.totalAmount)}</p>
            {booking.dueAmount > 0 ? (
              <p className="text-xs font-semibold" style={{ color: "#791F1F" }}>বাকি {formatBDT(booking.dueAmount)}</p>
            ) : (
              <p className="text-xs font-semibold" style={{ color: "#0F6E56" }}>পরিশোধিত ✓</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t" style={{ borderColor: S.border }}>
          {booking.status === "confirmed" && (
            <>
              <button onClick={checkIn} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs text-white disabled:opacity-60" style={{ backgroundColor: "#0F6E56" }}>
                <LogIn size={14} /> চেক-ইন
              </button>
              <button onClick={cancel} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-60" style={{ backgroundColor: "#FCEBEB", color: "#791F1F" }}>
                <X size={14} /> বুকিং বাতিল
              </button>
            </>
          )}
          {booking.status === "checked_in" && (
            <>
              <button onClick={() => { setCheckOutForm({ payNow: booking.dueAmount, additionalCharges: 0, paymentMethod: booking.paymentMethod || "cash" }); setShowCheckOutModal(true); }} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs text-white disabled:opacity-60" style={{ backgroundColor: "#0C447C" }}>
                <LogOut size={14} /> চেক-আউট
              </button>
              <button onClick={() => setShowServiceModal(true)} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-60" style={{ backgroundColor: "#FFF3DC", color: "#B45309" }}>
                <Coffee size={14} /> রুম-সার্ভিস
              </button>
            </>
          )}
          {booking.dueAmount > 0 && booking.status !== "cancelled" && (
            <button onClick={() => { setPaymentForm({ amount: booking.dueAmount, paymentMethod: booking.paymentMethod || "cash" }); setShowPaymentModal(true); }} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs disabled:opacity-60" style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
              <BadgeDollarSign size={14} /> পেমেন্ট নিন
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stay info */}
        <div className="lg:col-span-2 rounded-2xl p-5 border space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm" style={{ color: S.text }}>বুকিং বিবরণ</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs" style={{ color: S.muted }}>রুম</p>
              <p className="font-semibold" style={{ color: S.text }}>রুম {booking.room.number} · {booking.room.type}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: S.muted }}>গেস্ট সংখ্যা</p>
              <p className="font-semibold" style={{ color: S.text }}>{booking.adults} বড় + {booking.children} ছোট</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: S.muted }}>চেক-ইন</p>
              <p className="font-semibold" style={{ color: S.text }}>{new Date(booking.checkIn).toLocaleDateString("bn-BD")}</p>
              {booking.checkedInAt && <p className="text-[10px]" style={{ color: S.muted }}>সম্পন্ন: {new Date(booking.checkedInAt).toLocaleString("bn-BD")}</p>}
            </div>
            <div>
              <p className="text-xs" style={{ color: S.muted }}>চেক-আউট</p>
              <p className="font-semibold" style={{ color: S.text }}>{new Date(booking.checkOut).toLocaleDateString("bn-BD")}</p>
              {booking.checkedOutAt && <p className="text-[10px]" style={{ color: S.muted }}>সম্পন্ন: {new Date(booking.checkedOutAt).toLocaleString("bn-BD")}</p>}
            </div>
            <div>
              <p className="text-xs" style={{ color: S.muted }}>মোট রাত</p>
              <p className="font-semibold" style={{ color: S.text }}>{booking.nights} রাত</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: S.muted }}>সোর্স</p>
              <p className="font-semibold" style={{ color: S.text }}>{booking.source}</p>
            </div>
          </div>

          {booking.note && (
            <div className="pt-3 border-t" style={{ borderColor: S.border }}>
              <p className="text-xs font-bold mb-1" style={{ color: S.text }}>নোট</p>
              <p className="text-xs whitespace-pre-line" style={{ color: S.muted }}>{booking.note}</p>
            </div>
          )}

          {/* Room services */}
          <div className="pt-3 border-t" style={{ borderColor: S.border }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold" style={{ color: S.text }}>রুম-সার্ভিস</p>
              {booking.status === "checked_in" && (
                <button onClick={() => setShowServiceModal(true)} className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded" style={{ backgroundColor: "#FFF3DC", color: "#B45309" }}>
                  <Plus size={11} /> যোগ করুন
                </button>
              )}
            </div>
            {booking.roomServices.length === 0 ? (
              <p className="text-xs text-center py-2" style={{ color: S.muted }}>কোনো রুম-সার্ভিস নেই</p>
            ) : (
              <div className="space-y-1.5">
                {booking.roomServices.map(rs => (
                  <div key={rs.id} className="flex items-center justify-between py-1.5 px-2 rounded" style={{ backgroundColor: "var(--c-bg-alt, #F8F8F4)" }}>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: S.text }}>{rs.item}</p>
                      <p className="text-[10px]" style={{ color: S.muted }}>{rs.quantity} × ৳{rs.price}</p>
                    </div>
                    <p className="text-xs font-bold" style={{ color: "#0F6E56" }}>৳{rs.price * rs.quantity}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bill summary */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>বিল</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span style={{ color: S.muted }}>রুম × {booking.nights} রাত</span><span>৳{booking.ratePerNight * booking.nights}</span></div>
            {booking.extraCharges > 0 && <div className="flex justify-between"><span style={{ color: S.muted }}>অতিরিক্ত</span><span>৳{booking.extraCharges}</span></div>}
            {servicesTotal > 0 && <div className="flex justify-between"><span style={{ color: S.muted }}>রুম-সার্ভিস</span><span>৳{servicesTotal}</span></div>}
            <div className="flex justify-between text-base font-bold pt-2 border-t" style={{ color: "#0F6E56", borderColor: S.border }}>
              <span>মোট</span><span>{formatBDT(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between"><span style={{ color: S.muted }}>পরিশোধিত</span><span>৳{booking.advancePaid}</span></div>
            <div className="flex justify-between text-sm font-bold" style={{ color: booking.dueAmount > 0 ? "#791F1F" : "#0F6E56" }}>
              <span>{booking.dueAmount > 0 ? "বাকি" : "অবস্থা"}</span>
              <span>{booking.dueAmount > 0 ? formatBDT(booking.dueAmount) : "পরিশোধিত ✓"}</span>
            </div>
            {booking.paymentMethod && (
              <p className="text-[11px] pt-1" style={{ color: S.muted }}>মেথড: {booking.paymentMethod}</p>
            )}
          </div>
        </div>
      </div>

      {/* Service modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowServiceModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold" style={{ color: S.text }}>রুম-সার্ভিস যোগ করুন</h2>
            <div>
              <label className="text-xs font-semibold block mb-1">আইটেম *</label>
              <input value={serviceForm.item} onChange={e => setServiceForm({ ...serviceForm, item: e.target.value })}
                placeholder="যেমন: চা, পানি, খাবার" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">পরিমাণ</label>
                <input type="number" min={1} value={serviceForm.quantity} onChange={e => setServiceForm({ ...serviceForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">দাম প্রতি ইউনিট (৳) *</label>
                <input type="number" value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
              </div>
            </div>
            <p className="text-xs" style={{ color: S.muted }}>মোট: ৳{serviceForm.price * serviceForm.quantity}</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowServiceModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "var(--c-bg-alt, #F8F8F4)" }}>বাতিল</button>
              <button onClick={submitService} className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#0F6E56" }}>যোগ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold" style={{ color: S.text }}>পেমেন্ট নিন</h2>
            <p className="text-xs" style={{ color: S.muted }}>বাকি: ৳{booking.dueAmount}</p>
            <div>
              <label className="text-xs font-semibold block mb-1">টাকার পরিমাণ (৳) *</label>
              <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">মেথড</label>
              <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }}>
                <option value="cash">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option><option value="card">Card</option><option value="bank">Bank</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "var(--c-bg-alt, #F8F8F4)" }}>বাতিল</button>
              <button onClick={submitPayment} className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#0F6E56" }}>রিসিভ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Check-out modal */}
      {showCheckOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowCheckOutModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold" style={{ color: S.text }}>চেক-আউট</h2>
            <p className="text-xs" style={{ color: S.muted }}>চেক-আউটের সময় অতিরিক্ত চার্জ ও পেমেন্ট রিসিভ করুন</p>
            <div>
              <label className="text-xs font-semibold block mb-1">অতিরিক্ত চার্জ (৳)</label>
              <input type="number" value={checkOutForm.additionalCharges} onChange={e => setCheckOutForm({ ...checkOutForm, additionalCharges: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">এখন রিসিভ (৳)</label>
              <input type="number" value={checkOutForm.payNow} onChange={e => setCheckOutForm({ ...checkOutForm, payNow: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">মেথড</label>
              <select value={checkOutForm.paymentMethod} onChange={e => setCheckOutForm({ ...checkOutForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }}>
                <option value="cash">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option><option value="card">Card</option><option value="bank">Bank</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowCheckOutModal(false)} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: "var(--c-bg-alt, #F8F8F4)" }}>বাতিল</button>
              <button onClick={submitCheckOut} className="flex-1 py-2 rounded-lg text-sm font-bold text-white" style={{ backgroundColor: "#0C447C" }}>চেক-আউট করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
