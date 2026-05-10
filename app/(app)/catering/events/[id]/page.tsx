"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, DollarSign, Check, X, Printer,
  ShoppingCart, ClipboardList, CreditCard, ChefHat, Users, MapPin,
} from "lucide-react";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#EA580C",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "💍 বিয়ে", birthday: "🎂 জন্মদিন", aqiqa: "🐑 আকিকা",
  corporate: "🏢 Corporate", mehndi: "💜 মেহেন্দি", other: "✨ অন্যান্য",
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  enquiry:      { label: "তদন্ত",        bg: "#F3F4F6", color: "#374151" },
  confirmed:    { label: "নিশ্চিত",      bg: "#DCFCE7", color: "#166534" },
  advance_paid: { label: "অগ্রিম পাওয়া", bg: "#DBEAFE", color: "#1E40AF" },
  preparation:  { label: "Preparation",  bg: "#FEF3C7", color: "#92400E" },
  completed:    { label: "সম্পন্ন",      bg: "#D1FAE5", color: "#065F46" },
  cancelled:    { label: "বাতিল",        bg: "#FEE2E2", color: "#991B1B" },
};

const CAT_LABELS: Record<string, string> = {
  main: "মূল খাবার", starter: "স্টার্টার", drink: "পানীয়",
  dessert: "ডেজার্ট", snack: "স্ন্যাকস", side: "সাইড",
};

type ChecklistItem = { id: string; text: string; done: boolean };
type ShoppingItem  = { item: string; qty: string; cat: string };
type EventItem     = { id: string; itemName: string; category: string; perHeadCost: number; quantity: string | null; subtotal: number };
type Payment       = { id: string; amount: number; method: string; note: string | null; paidAt: string };
type Event = {
  id: string; bookingNumber: string; clientName: string; clientPhone: string;
  clientAddress: string | null; eventType: string; eventDate: string; eventTime: string | null;
  venue: string; guestCount: number; mealTypes: string[];
  perHeadCost: number; totalCost: number; totalAmount: number;
  profit: number; advancePaid: number; dueAmount: number;
  staffNeeded: number | null; equipmentNote: string | null;
  status: string; checklist: ChecklistItem[] | null; shoppingList: ShoppingItem[] | null;
  notes: string | null;
  template: { id: string; name: string; items: EventItem[] } | null;
  customItems: EventItem[];
  payments: Payment[];
};

type Tab = "info" | "shopping" | "checklist" | "payments";

export default function CateringEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router   = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const [event, setEvent]           = useState<Event | null>(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<Tab>("info");
  const [showPayment, setShowPayment] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [payAmount, setPayAmount]   = useState("");
  const [payMethod, setPayMethod]   = useState("cash");
  const [payNote, setPayNote]       = useState("");
  const [actualGuests, setActualGuests] = useState("");
  const [saving, setSaving]         = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/catering/events/${id}`);
    if (r.ok) { const d = await r.json(); setEvent(d); setActualGuests(String(d.guestCount)); }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    const r = await fetch(`/api/catering/events/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (r.ok) { const d = await r.json(); setEvent(d); }
    setSaving(false);
  }

  async function addPayment() {
    if (!payAmount || !payMethod) return;
    await patch({ action: "add_payment", amount: Number(payAmount), method: payMethod, note: payNote });
    setShowPayment(false); setPayAmount(""); setPayNote("");
  }

  async function completeEvent() {
    await patch({ action: "complete_event", actualGuestCount: Number(actualGuests) });
    setShowComplete(false);
  }

  function toggleChecklist(itemId: string) {
    if (!event) return;
    const updated = (event.checklist ?? []).map(c => c.id === itemId ? { ...c, done: !c.done } : c);
    patch({ action: "update_checklist", checklist: updated });
  }

  function printShoppingList() {
    window.print();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: S.primary }} />
    </div>
  );
  if (!event) return <div className="text-center py-20" style={{ color: S.muted }}>ইভেন্ট পাওয়া যায়নি</div>;

  const st         = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.confirmed;
  const allItems   = [...(event.template?.items ?? []), ...event.customItems];
  const evDate     = new Date(event.eventDate);
  const statusFlow = ["enquiry", "confirmed", "advance_paid", "preparation", "completed"];

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl border" style={{ borderColor: S.border }}>
          <ChevronLeft size={18} style={{ color: S.muted }} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold" style={{ color: S.text }}>{event.clientName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: st.bg, color: st.color }}>{st.label}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FFF7ED", color: S.primary }}>
              {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
            </span>
          </div>
          <p className="text-xs" style={{ color: S.muted }}>{event.bookingNumber}</p>
        </div>
        {event.status !== "completed" && event.status !== "cancelled" && (
          <button onClick={() => setShowComplete(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white shrink-0"
            style={{ backgroundColor: "#10B981" }}>
            ✅ সম্পন্ন করুন
          </button>
        )}
      </div>

      {/* Summary Card */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "মোট মূল্য",    value: `৳${event.totalAmount.toLocaleString()}`, color: S.text },
            { label: "অগ্রিম",       value: `৳${event.advancePaid.toLocaleString()}`, color: "#10B981" },
            { label: "বাকি",         value: `৳${event.dueAmount.toLocaleString()}`,   color: event.dueAmount > 0 ? "#DC2626" : "#10B981" },
            { label: "মুনাফা",       value: `৳${event.profit.toLocaleString()}`,      color: event.profit >= 0 ? "#10B981" : "#DC2626" },
          ].map((c, i) => (
            <div key={i} className="text-center p-3 rounded-xl border" style={{ borderColor: S.border }}>
              <p className="text-xs" style={{ color: S.muted }}>{c.label}</p>
              <p className="text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs" style={{ color: S.muted }}>
            <span>পরিশোধ অগ্রগতি</span>
            <span>{event.totalAmount > 0 ? Math.round((event.advancePaid / event.totalAmount) * 100) : 0}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: S.border }}>
            <div className="h-2 rounded-full transition-all" style={{
              width: `${event.totalAmount > 0 ? Math.min(100, Math.round((event.advancePaid / event.totalAmount) * 100)) : 0}%`,
              backgroundColor: event.dueAmount === 0 ? "#10B981" : S.primary,
            }} />
          </div>
        </div>

        {/* Status flow */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {statusFlow.map((s, i) => {
            const isCurrent = s === event.status;
            const isPast = statusFlow.indexOf(event.status) > i;
            return (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <button onClick={() => event.status !== "completed" && event.status !== "cancelled" && patch({ action: "status_update", status: s })}
                  className="px-2 py-1 rounded-full text-[10px] font-medium border transition-colors"
                  style={{
                    backgroundColor: isCurrent ? S.primary : isPast ? "#ECFDF5" : S.surface,
                    color:           isCurrent ? "white"   : isPast ? "#10B981" : S.muted,
                    borderColor:     isCurrent ? S.primary : isPast ? "#86EFAC" : S.border,
                  }}>
                  {STATUS_CONFIG[s]?.label ?? s}
                </button>
                {i < statusFlow.length - 1 && <div className="w-3 h-0.5" style={{ backgroundColor: isPast ? "#10B981" : S.border }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Info Quick View */}
      <div className="rounded-2xl border p-4 grid sm:grid-cols-3 gap-3 text-sm" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center gap-2">
          <MapPin size={14} style={{ color: S.primary }} />
          <span style={{ color: S.text }}>{event.venue}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} style={{ color: S.primary }} />
          <span style={{ color: S.text }}>{event.guestCount} জন অতিথি</span>
        </div>
        <div className="flex items-center gap-2">
          <ChefHat size={14} style={{ color: S.primary }} />
          <span style={{ color: S.text }}>Staff: {event.staffNeeded ?? "অনির্ধারিত"}</span>
        </div>
        <div className="flex items-center gap-2 col-span-full">
          <span style={{ color: S.muted }}>📅</span>
          <span style={{ color: S.text }}>{evDate.toLocaleDateString("bn-BD", { dateStyle: "full" })}{event.eventTime ? ` · ${event.eventTime}` : ""}</span>
        </div>
        {event.equipmentNote && (
          <div className="col-span-full text-xs p-2 rounded-lg" style={{ backgroundColor: "#FFF7ED", color: "#9A3412" }}>
            🔧 {event.equipmentNote}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: S.border }}>
        {([
          { key: "info",      label: "Menu", icon: ChefHat },
          { key: "shopping",  label: "Shopping List", icon: ShoppingCart },
          { key: "checklist", label: "Checklist", icon: ClipboardList },
          { key: "payments",  label: "পেমেন্ট", icon: CreditCard },
        ] as { key: Tab; label: string; icon: typeof ChefHat }[]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors"
            style={{
              borderColor: tab === t.key ? S.primary : "transparent",
              color:       tab === t.key ? S.primary : S.muted,
            }}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Menu Items */}
      {tab === "info" && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {event.template && (
            <div className="px-4 py-2 border-b text-xs font-semibold" style={{ borderColor: S.border, backgroundColor: "#FFF7ED", color: S.primary }}>
              Template: {event.template.name}
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: S.border }}>
                <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: S.muted }}>আইটেম</th>
                <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: S.muted }}>ক্যাটাগরি</th>
                <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: S.muted }}>৳/জন</th>
                <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: S.muted }}>মোট</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item, i) => (
                <tr key={i} className="border-b last:border-0" style={{ borderColor: S.border }}>
                  <td className="px-4 py-2 font-medium" style={{ color: S.text }}>
                    {item.itemName}
                    {item.quantity && <span className="ml-1 text-xs" style={{ color: S.muted }}>({item.quantity})</span>}
                  </td>
                  <td className="px-4 py-2 text-xs" style={{ color: S.muted }}>{CAT_LABELS[item.category] ?? item.category}</td>
                  <td className="px-4 py-2 text-right" style={{ color: S.text }}>৳{item.perHeadCost}</td>
                  <td className="px-4 py-2 text-right font-semibold" style={{ color: S.primary }}>৳{(item.perHeadCost * event.guestCount).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "#FFF7ED" }}>
                <td colSpan={2} className="px-4 py-2 text-sm font-bold" style={{ color: S.text }}>মোট</td>
                <td className="px-4 py-2 text-right font-bold" style={{ color: S.primary }}>৳{event.perHeadCost.toLocaleString()}/জন</td>
                <td className="px-4 py-2 text-right font-bold" style={{ color: S.primary }}>৳{event.totalCost.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Tab: Shopping List */}
      {tab === "shopping" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={printShoppingList}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border font-medium"
              style={{ borderColor: S.border, color: S.muted }}>
              <Printer size={15} /> Print করুন
            </button>
          </div>
          <div ref={printRef} className="rounded-2xl border p-5 space-y-4 print:border-0 print:p-0" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="print:block">
              <h2 className="text-base font-bold" style={{ color: S.text }}>
                কেনার তালিকা — {evDate.toLocaleDateString("bn-BD")} {event.clientName} এর অনুষ্ঠান
              </h2>
              <p className="text-xs mt-0.5" style={{ color: S.muted }}>{event.venue} · {event.guestCount} জন অতিথি</p>
            </div>
            {(event.shoppingList && event.shoppingList.length > 0) ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: S.border }}>
                    <th className="text-left py-2 text-xs font-semibold" style={{ color: S.muted }}>আইটেম</th>
                    <th className="text-right py-2 text-xs font-semibold" style={{ color: S.muted }}>মোট পরিমাণ</th>
                  </tr>
                </thead>
                <tbody>
                  {event.shoppingList.map((sl, i) => (
                    <tr key={i} className="border-b last:border-0" style={{ borderColor: S.border }}>
                      <td className="py-2 font-medium" style={{ color: S.text }}>{sl.item}
                        <span className="ml-1 text-xs" style={{ color: S.muted }}>({CAT_LABELS[sl.cat] ?? sl.cat})</span>
                      </td>
                      <td className="py-2 text-right" style={{ color: S.muted }}>{sl.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart size={32} className="mx-auto mb-2" style={{ color: S.muted }} />
                <p className="text-sm" style={{ color: S.muted }}>Shopping list এখনো তৈরি হয়নি</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Checklist */}
      {tab === "checklist" && (
        <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <p className="text-sm font-semibold" style={{ color: S.text }}>প্রস্তুতি Checklist</p>
          {(event.checklist ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: S.muted }}>কোনো চেকলিস্ট নেই</p>
          ) : (
            <div className="space-y-2">
              {(event.checklist ?? []).map(item => (
                <button key={item.id} onClick={() => toggleChecklist(item.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors"
                  style={{ borderColor: item.done ? "#86EFAC" : S.border, backgroundColor: item.done ? "#ECFDF5" : S.surface }}>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                    style={{ borderColor: item.done ? "#10B981" : S.border, backgroundColor: item.done ? "#10B981" : "transparent" }}>
                    {item.done && <Check size={11} className="text-white" />}
                  </div>
                  <span className="text-sm" style={{ color: item.done ? "#065F46" : S.text, textDecoration: item.done ? "line-through" : "none" }}>
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="pt-2 text-xs" style={{ color: S.muted }}>
            {(event.checklist ?? []).filter(c => c.done).length}/{(event.checklist ?? []).length} সম্পন্ন
          </div>
        </div>
      )}

      {/* Tab: Payments */}
      {tab === "payments" && (
        <div className="space-y-3">
          {event.status !== "completed" && event.status !== "cancelled" && event.dueAmount > 0 && (
            <button onClick={() => setShowPayment(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white"
              style={{ backgroundColor: S.primary }}>
              <DollarSign size={16} /> পেমেন্ট নিন
            </button>
          )}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            {event.payments.length === 0 ? (
              <div className="text-center py-10 text-sm" style={{ color: S.muted }}>কোনো পেমেন্ট নেই</div>
            ) : event.payments.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b last:border-0" style={{ borderColor: S.border }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: S.text }}>৳{p.amount.toLocaleString()}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{p.method} · {new Date(p.paidAt).toLocaleDateString("bn-BD")}</p>
                  {p.note && <p className="text-xs" style={{ color: S.muted }}>{p.note}</p>}
                </div>
                <Check size={16} style={{ color: "#10B981" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: S.text }}>পেমেন্ট নিন</h3>
              <button onClick={() => setShowPayment(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <p className="text-sm" style={{ color: S.muted }}>বাকি: <strong style={{ color: "#DC2626" }}>৳{event.dueAmount.toLocaleString()}</strong></p>
            <div className="space-y-3">
              <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                placeholder="পরিমাণ" />
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                <option value="cash">নগদ</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="bank">Bank Transfer</option>
              </select>
              <input value={payNote} onChange={e => setPayNote(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                placeholder="নোট (ঐচ্ছিক)" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowPayment(false)} className="flex-1 py-2 rounded-xl text-sm border" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={addPayment} disabled={saving || !payAmount}
                className="flex-1 py-2 rounded-xl text-sm text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: S.primary }}>
                {saving ? "সেভ..." : "নিশ্চিত করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {showComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: S.text }}>ইভেন্ট সম্পন্ন করুন</h3>
              <button onClick={() => setShowComplete(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>
            <p className="text-sm" style={{ color: S.muted }}>প্রকৃত অতিথি সংখ্যা লিখুন (estimate ছিল {event.guestCount} জন)</p>
            <input type="number" value={actualGuests} onChange={e => setActualGuests(e.target.value)}
              className="w-full border rounded-xl px-3 py-2 text-sm" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
            <div className="flex gap-3">
              <button onClick={() => setShowComplete(false)} className="flex-1 py-2 rounded-xl text-sm border" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button onClick={completeEvent} disabled={saving}
                className="flex-1 py-2 rounded-xl text-sm text-white font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#10B981" }}>
                {saving ? "..." : "✅ সম্পন্ন করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
