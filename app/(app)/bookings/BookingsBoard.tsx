"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, CalendarRange, Loader2, X, Save, Search, RefreshCw, Phone, ChevronRight, ChevronLeft } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import DatePicker from "@/components/ui/DatePicker";

interface Room {
  id: string;
  number: string;
  type: string;
  ratePerNight: number;
  status: string;
  capacity: number;
}

interface Booking {
  id: string;
  bookingNumber: string;
  guestName: string;
  guestPhone: string;
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  advancePaid: number;
  dueAmount: number;
  status: string;
  room: { id: string; number: string; type: string };
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  confirmed:   { label: "Confirmed",   bg: "#E6F1FB", color: "#0C447C" },
  checked_in:  { label: "Checked In",  bg: "#E1F5EE", color: "#085041" },
  checked_out: { label: "Checked Out", bg: "#F1EFE8", color: "#444441" },
  cancelled:   { label: "Cancelled",   bg: "#FCEBEB", color: "#791F1F" },
};

const STATUS_TABS = [
  { key: "all", label: "সব" },
  { key: "confirmed", label: "Confirmed" },
  { key: "checked_in", label: "Checked In" },
  { key: "checked_out", label: "Checked Out" },
  { key: "cancelled", label: "Cancelled" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
};

interface BookingForm {
  roomId: string;
  guestName: string;
  guestPhone: string;
  guestNID: string;
  guestAddress: string;
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  ratePerNight: number;
  extraCharges: number;
  extraNote: string;
  advancePaid: number;
  paymentMethod: string;
  source: string;
  note: string;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function BookingsBoard() {
  const sp = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRoomIds, setAvailableRoomIds] = useState<Set<string>>(new Set());
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [form, setForm] = useState<BookingForm>({
    roomId: "", guestName: "", guestPhone: "", guestNID: "", guestAddress: "",
    adults: 1, children: 0,
    checkIn: todayStr(), checkOut: tomorrowStr(),
    ratePerNight: 0, extraCharges: 0, extraNote: "",
    advancePaid: 0, paymentMethod: "cash", source: "walk_in", note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const url = new URL("/api/bookings", window.location.origin);
      if (filter !== "all") url.searchParams.set("status", filter);
      if (search) url.searchParams.set("search", search);
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (res.ok) setBookings(await res.json());
    } catch {}
    if (silent) setRefreshing(false);
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // Auto-open modal if ?new=1
  useEffect(() => {
    if (sp.get("new") === "1") openNew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNew = async () => {
    setStep(1);
    setError(null);
    setForm({
      roomId: "", guestName: "", guestPhone: "", guestNID: "", guestAddress: "",
      adults: 1, children: 0,
      checkIn: todayStr(), checkOut: tomorrowStr(),
      ratePerNight: 0, extraCharges: 0, extraNote: "",
      advancePaid: 0, paymentMethod: "cash", source: "walk_in", note: "",
    });
    setShowModal(true);
    setCheckingAvail(true);
    try {
      const res = await fetch("/api/rooms", { cache: "no-store" });
      if (res.ok) setRooms(await res.json());
    } catch {}
    setCheckingAvail(false);
  };

  // Check availability when dates change in step 1
  useEffect(() => {
    if (!showModal || step !== 1) return;
    let cancelled = false;
    (async () => {
      setCheckingAvail(true);
      try {
        const url = new URL("/api/hotel/availability", window.location.origin);
        url.searchParams.set("from", form.checkIn);
        url.searchParams.set("to", form.checkOut);
        const res = await fetch(url.toString(), { cache: "no-store" });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setAvailableRoomIds(new Set((data.available as Room[]).map(r => r.id)));
        }
      } catch {}
      if (!cancelled) setCheckingAvail(false);
    })();
    return () => { cancelled = true; };
  }, [form.checkIn, form.checkOut, showModal, step]);

  const selectedRoom = rooms.find(r => r.id === form.roomId);
  const nights = Math.max(1, Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86400000));
  const total = (form.ratePerNight || selectedRoom?.ratePerNight || 0) * nights + Number(form.extraCharges || 0);
  const due = Math.max(0, total - Number(form.advancePaid || 0));

  const next = () => {
    setError(null);
    if (step === 1) {
      if (!form.roomId) { setError("রুম সিলেক্ট করুন"); return; }
      if (new Date(form.checkOut) <= new Date(form.checkIn)) { setError("চেক-আউট চেক-ইন এর পরে হতে হবে"); return; }
      setForm(f => ({ ...f, ratePerNight: f.ratePerNight || (selectedRoom?.ratePerNight ?? 0) }));
      setStep(2);
    } else if (step === 2) {
      if (!form.guestName.trim() || !form.guestPhone.trim()) { setError("নাম ও ফোন দরকার"); return; }
      setStep(3);
    }
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          checkIn: new Date(form.checkIn).toISOString(),
          checkOut: new Date(form.checkOut).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "সমস্যা হয়েছে");
      } else {
        setShowModal(false);
        await fetchBookings();
        window.location.href = `/bookings/${data.id}`;
      }
    } catch {
      setError("সার্ভার সমস্যা");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#E6F1FB" }}>
            <CalendarRange size={20} style={{ color: "#0C447C" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>বুকিং ম্যানেজমেন্ট</h1>
            <p className="text-xs" style={{ color: S.muted }}>মোট {bookings.length}টি বুকিং</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchBookings(true)}
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
            <Plus size={16} /> নতুন বুকিং
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
            placeholder="বুকিং নম্বর / নাম / ফোন..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border"
            style={{ borderColor: S.border, backgroundColor: "var(--c-bg-alt, #F8F8F4)" }}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
              style={{
                backgroundColor: filter === t.key ? "#0F6E56" : "var(--c-bg-alt, #F8F8F4)",
                color: filter === t.key ? "#fff" : S.text,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={28} className="animate-spin" style={{ color: "#0F6E56" }} /></div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <CalendarRange size={36} className="mx-auto mb-3" style={{ color: S.muted }} />
          <p className="text-sm font-semibold mb-1" style={{ color: S.text }}>কোনো বুকিং নেই</p>
          <p className="text-xs mb-4" style={{ color: S.muted }}>প্রথম বুকিং তৈরি করে শুরু করুন</p>
          <button onClick={openNew} className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: "#0F6E56" }}>নতুন বুকিং</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {bookings.map(b => {
            const s = STATUS_META[b.status] ?? STATUS_META.confirmed;
            return (
              <Link key={b.id} href={`/bookings/${b.id}`} className="block rounded-2xl p-4 border hover:shadow-md transition-shadow" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                      <span className="text-xs font-mono" style={{ color: S.muted }}>{b.bookingNumber}</span>
                    </div>
                    <p className="text-sm font-bold" style={{ color: S.text }}>{b.guestName}</p>
                    <p className="text-[11px] flex items-center gap-1" style={{ color: S.muted }}>
                      <Phone size={10} /> {b.guestPhone} · রুম {b.room.number} · {b.adults}+{b.children} জন
                    </p>
                    <p className="text-[11px]" style={{ color: S.muted }}>
                      {new Date(b.checkIn).toLocaleDateString("bn-BD")} → {new Date(b.checkOut).toLocaleDateString("bn-BD")} · {b.nights} রাত
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold" style={{ color: "#0F6E56" }}>{formatBDT(b.totalAmount)}</p>
                    {b.dueAmount > 0 ? (
                      <p className="text-[11px] font-semibold" style={{ color: "#791F1F" }}>বাকি {formatBDT(b.dueAmount)}</p>
                    ) : (
                      <p className="text-[11px] font-semibold" style={{ color: "#0F6E56" }}>পরিশোধিত</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* New booking modal — 3 steps */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
              <h2 className="font-bold" style={{ color: S.text }}>নতুন বুকিং — ধাপ {step}/3</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
            </div>

            {/* Step indicators */}
            <div className="flex gap-2 p-3 border-b" style={{ borderColor: S.border }}>
              {[1, 2, 3].map(n => (
                <div key={n} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: n <= step ? "#0F6E56" : "var(--c-border)" }} />
              ))}
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {step === 1 && (
                <>
                  <p className="text-xs font-bold" style={{ color: S.text }}>১. তারিখ ও রুম সিলেক্ট করুন</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>চেক-ইন *</label>
                      <DatePicker
  value={form.checkIn}
  onChange={v => setForm({ ...form, checkIn: v })}
  className="w-full px-3 py-2 rounded-lg border text-sm"
  style={{ borderColor: S.border }}
/>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>চেক-আউট *</label>
                      <DatePicker
  value={form.checkOut}
  onChange={v => setForm({ ...form, checkOut: v })}
  className="w-full px-3 py-2 rounded-lg border text-sm"
  style={{ borderColor: S.border }}
/>
                    </div>
                  </div>
                  <div className="text-[11px]" style={{ color: S.muted }}>{nights} রাত</div>

                  <div>
                    <label className="text-xs font-semibold block mb-2" style={{ color: S.text }}>উপলব্ধ রুম *</label>
                    {checkingAvail ? (
                      <div className="text-center py-4"><Loader2 size={20} className="animate-spin mx-auto" style={{ color: "#0F6E56" }} /></div>
                    ) : rooms.length === 0 ? (
                      <p className="text-xs text-center py-3" style={{ color: S.muted }}>আগে রুম যোগ করুন</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {rooms.map(r => {
                          const available = availableRoomIds.has(r.id);
                          const selected = form.roomId === r.id;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              disabled={!available}
                              onClick={() => setForm({ ...form, roomId: r.id, ratePerNight: r.ratePerNight })}
                              className="text-left p-3 rounded-xl border-2 transition-all"
                              style={{
                                borderColor: selected ? "#0F6E56" : "var(--c-border)",
                                backgroundColor: selected ? "#E1F5EE" : (available ? "var(--c-surface)" : "var(--c-bg-alt, #F8F8F4)"),
                                opacity: available ? 1 : 0.5,
                                cursor: available ? "pointer" : "not-allowed",
                              }}
                            >
                              <p className="text-sm font-bold" style={{ color: S.text }}>রুম {r.number}</p>
                              <p className="text-[10px]" style={{ color: S.muted }}>{r.type} · ৳{r.ratePerNight}/রাত</p>
                              {!available && <p className="text-[10px] mt-0.5" style={{ color: "#791F1F" }}>বুক করা</p>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-xs font-bold" style={{ color: S.text }}>২. গেস্ট তথ্য</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>গেস্টের নাম *</label>
                      <input value={form.guestName} onChange={e => setForm({ ...form, guestName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>ফোন *</label>
                      <input value={form.guestPhone} onChange={e => setForm({ ...form, guestPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>NID</label>
                      <input value={form.guestNID} onChange={e => setForm({ ...form, guestNID: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>ঠিকানা</label>
                      <input value={form.guestAddress} onChange={e => setForm({ ...form, guestAddress: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>বড় (Adults)</label>
                      <input type="number" min={1} value={form.adults} onChange={e => setForm({ ...form, adults: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>ছোট (Children)</label>
                      <input type="number" min={0} value={form.children} onChange={e => setForm({ ...form, children: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>সোর্স</label>
                      <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }}>
                        <option value="walk_in">Walk-in</option>
                        <option value="phone">Phone</option>
                        <option value="online">Online</option>
                        <option value="other">অন্যান্য</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="text-xs font-bold" style={{ color: S.text }}>৩. বিল ও পেমেন্ট</p>
                  <div className="rounded-xl p-4" style={{ backgroundColor: "#E1F5EE" }}>
                    <div className="flex justify-between text-sm mb-1"><span style={{ color: S.muted }}>রুম ভাড়া × {nights} রাত</span><span className="font-semibold">৳{(form.ratePerNight || 0) * nights}</span></div>
                    <div className="flex justify-between text-sm mb-1"><span style={{ color: S.muted }}>অতিরিক্ত চার্জ</span><span className="font-semibold">৳{form.extraCharges || 0}</span></div>
                    <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t" style={{ borderColor: "#0F6E5640", color: "#0F6E56" }}>
                      <span>মোট</span><span>{formatBDT(total)}</span>
                    </div>
                    {due > 0 ? (
                      <div className="flex justify-between text-xs mt-1" style={{ color: "#791F1F" }}>
                        <span>বাকি</span><span className="font-bold">{formatBDT(due)}</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-xs mt-1 font-bold" style={{ color: "#0F6E56" }}>
                        <span>পরিশোধিত</span><span>✓</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>রেট/রাত (৳)</label>
                      <input type="number" value={form.ratePerNight} onChange={e => setForm({ ...form, ratePerNight: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>অতিরিক্ত চার্জ (৳)</label>
                      <input type="number" value={form.extraCharges} onChange={e => setForm({ ...form, extraCharges: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>অগ্রিম পেমেন্ট (৳)</label>
                      <input type="number" min={0} value={form.advancePaid} onChange={e => setForm({ ...form, advancePaid: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>পেমেন্ট মেথড</label>
                      <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }}>
                        <option value="cash">Cash</option>
                        <option value="bkash">bKash</option>
                        <option value="nagad">Nagad</option>
                        <option value="rocket">Rocket</option>
                        <option value="card">Card</option>
                        <option value="bank">Bank</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold block mb-1" style={{ color: S.text }}>নোট</label>
                      <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                        rows={2} className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: S.border }} />
                    </div>
                  </div>
                </>
              )}

              {error && <p className="text-xs" style={{ color: "#791F1F" }}>{error}</p>}
            </div>

            <div className="p-5 border-t flex gap-2" style={{ borderColor: S.border }}>
              {step > 1 && (
                <button onClick={() => setStep((step - 1) as 1 | 2)} className="flex items-center gap-1 px-4 py-2.5 rounded-xl font-semibold text-sm" style={{ backgroundColor: "var(--c-bg-alt, #F8F8F4)", color: S.text }}>
                  <ChevronLeft size={14} /> পূর্ববর্তী
                </button>
              )}
              <div className="flex-1" />
              {step < 3 ? (
                <button onClick={next} className="flex items-center gap-1 px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: "#0F6E56" }}>
                  পরবর্তী <ChevronRight size={14} />
                </button>
              ) : (
                <button onClick={submit} disabled={saving} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-60" style={{ backgroundColor: "#0F6E56" }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  বুকিং নিশ্চিত করুন
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
