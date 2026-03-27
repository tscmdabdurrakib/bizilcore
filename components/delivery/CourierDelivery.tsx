"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PlanGate from "@/components/PlanGate";
import { Search, Truck, RefreshCw, Package, ChevronLeft, ChevronRight, ExternalLink, DollarSign, Clock } from "lucide-react";
import { formatBDT, formatBanglaDate } from "@/lib/utils";
import { S } from "@/lib/theme";

interface DeliveryOrder {
  id: string;
  status: string;
  courierName: string | null;
  courierTrackId: string | null;
  courierStatus: string | null;
  codStatus: string | null;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  deliveryCharge: number;
  createdAt: string;
  customer: { id: string; name: string; phone: string | null; address: string | null } | null;
}

const COURIER_TRACK_URLS: Record<string, string> = {
  pathao: "https://pathao.com/bd/track/",
  ecourier: "https://ecourier.com.bd/tracking/",
  redx: "https://redx.com.bd/track-shipment/?trackingId=",
  steadfast: "https://steadfast.com.bd/t/",
  sundarban: "https://www.sundarbanexpress.com/",
  paperfly: "https://paperfly.com.bd/track/",
  carrybee: "https://carrybee.com/tracking/",
  delivery_tiger: "https://deliverytiger.com.bd/",
};

const COURIER_LABELS: Record<string, string> = {
  all: "সব Courier",
  pathao: "Pathao",
  ecourier: "eCourier",
  steadfast: "Steadfast",
  redx: "RedX",
  sundarban: "Sundarban (SCS)",
  paperfly: "Paperfly",
  carrybee: "CarryBee",
  delivery_tiger: "Delivery Tiger",
  karatoa: "Karatoa (KCS)",
  janani: "Janani Express",
  sheba: "Sheba Delivery",
  sa_paribahan: "SA Paribahan",
  other: "Manual",
};

const COD_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  with_courier: { bg: "#FFF3DC", text: "#EF9F27", label: "Courier-এ আছে" },
  collected:    { bg: "#E8F5F0", text: "#0F6E56",  label: "Cash পেয়েছি" },
  returned:     { bg: "#FFE8E8", text: "#E24B4A",  label: "Return হয়েছে" },
};

const STATUS_TABS = [
  { key: "shipped",   label: "পাঠানো",   color: "#2B7CE9", bg: "#E1F0FF" },
  { key: "delivered", label: "পৌঁছেছে",  color: "#0F6E56", bg: "#E8F5F0" },
  { key: "returned",  label: "Return",   color: "#E24B4A", bg: "#FFE8E8" },
];

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function CourierDelivery() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [courier, setCourier] = useState("all");
  const [statusFilter, setStatusFilter] = useState("shipped");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 30;

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), status: statusFilter });
    if (search) params.set("search", search);
    if (courier !== "all") params.set("courier", courier);
    const r = await fetch(`/api/orders?${params}`);
    const d = await r.json();
    const all: DeliveryOrder[] = (d.orders ?? []).filter((o: DeliveryOrder) =>
      o.courierTrackId || o.courierName
    );
    setOrders(all);
    setTotal(d.total ?? 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, [page, search, courier, statusFilter]);
  useEffect(() => { setPage(1); }, [search, courier, statusFilter]);

  const couriers = ["all", "pathao", "ecourier", "steadfast", "redx", "sundarban", "paperfly", "carrybee", "delivery_tiger", "karatoa", "janani", "sheba", "sa_paribahan", "other"];

  function getTrackUrl(o: DeliveryOrder) {
    if (!o.courierTrackId || !o.courierName) return null;
    const base = COURIER_TRACK_URLS[o.courierName.toLowerCase()];
    return base ? base + o.courierTrackId : null;
  }

  const pendingCod   = orders.filter(o => o.codStatus === "with_courier").length;
  const collectedCod = orders.filter(o => o.codStatus === "collected").length;
  const totalPages   = Math.ceil(total / LIMIT);

  const activeTab = STATUS_TABS.find(t => t.key === statusFilter) ?? STATUS_TABS[0];

  return (
    <PlanGate feature="courier">
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B7CE9 0%, #1A5FBF 100%)" }}>
            <Truck size={18} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: S.text }}>ডেলিভারি ট্র্যাকিং</h1>
            <p className="text-xs" style={{ color: S.muted }}>সব active shipment এক জায়গায়</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: S.border, color: S.secondary, backgroundColor: S.surface }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "মোট Shipment", value: total,        color: S.text,      bg: S.surface,   icon: Package },
          { label: "এই পেজে",     value: orders.length, color: "#2B7CE9",   bg: "#E1F0FF",   icon: Truck },
          { label: "COD Pending", value: pendingCod,    color: "#EF9F27",   bg: "#FFF3DC",   icon: Clock },
          { label: "Cash পেয়েছি", value: collectedCod, color: "#0F6E56",   bg: "#E8F5F0",   icon: DollarSign },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl p-4 border" style={{ backgroundColor: s.bg, borderColor: S.border }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs" style={{ color: S.muted }}>{s.label}</p>
                <Icon size={14} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 p-1 rounded-xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={statusFilter === tab.key
                ? { backgroundColor: tab.color, color: "#fff" }
                : { color: S.secondary }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={courier}
          onChange={e => setCourier(e.target.value)}
          className="h-9 px-3 rounded-xl border text-sm outline-none"
          style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
        >
          {couriers.map(c => (
            <option key={c} value={c}>{COURIER_LABELS[c] ?? c}</option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="কাস্টমার বা Tracking ID..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: S.border, backgroundColor: S.surface, color: S.text }}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: S.surface }} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: activeTab.bg }}>
            <Truck size={28} style={{ color: activeTab.color }} />
          </div>
          <p className="font-semibold text-sm" style={{ color: S.secondary }}>কোনো shipment পাওয়া যায়নি</p>
          <p className="text-xs mt-1" style={{ color: S.muted }}>এই ফিল্টারে কোনো ডেলিভারি নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(o => {
            const st = STATUS_TABS.find(t => t.key === o.status) ?? STATUS_TABS[0];
            const cod = o.codStatus ? COD_STYLE[o.codStatus] : null;
            const trackUrl = getTrackUrl(o);
            const days = daysSince(o.createdAt);

            return (
              <div
                key={o.id}
                className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: S.surface, borderColor: S.border, borderLeft: `3px solid ${st.color}` }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <Link
                          href={`/orders/${o.id}`}
                          className="text-sm font-bold hover:underline"
                          style={{ color: st.color }}
                        >
                          #{o.id.slice(-6).toUpperCase()}
                        </Link>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                        {cod && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: cod.bg, color: cod.text }}>
                            COD: {cod.label}
                          </span>
                        )}
                        {days > 0 && (
                          <span className="text-xs font-medium" style={{ color: days > 7 ? "#E24B4A" : S.muted }}>
                            {days} দিন আগে
                          </span>
                        )}
                      </div>

                      {o.customer && (
                        <p className="text-sm mb-1.5" style={{ color: S.text }}>
                          <Link href={`/customers/${o.customer.id}`} className="font-medium hover:underline">
                            {o.customer.name}
                          </Link>
                          {o.customer.phone && <span style={{ color: S.muted }}> · {o.customer.phone}</span>}
                        </p>
                      )}

                      {(o.courierName || o.courierTrackId) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {o.courierName && (
                            <span className="text-xs px-2.5 py-0.5 rounded-lg font-bold" style={{ backgroundColor: "#E1F0FF", color: "#2B7CE9" }}>
                              {COURIER_LABELS[o.courierName] ?? o.courierName.toUpperCase()}
                            </span>
                          )}
                          {o.courierTrackId && (
                            <span className="text-xs font-mono" style={{ color: S.secondary }}>{o.courierTrackId}</span>
                          )}
                          {trackUrl && (
                            <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-medium hover:underline"
                              style={{ color: S.primary }}>
                              <ExternalLink size={11} /> Track করুন
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: S.text }}>{formatBDT(o.totalAmount)}</p>
                      {o.dueAmount > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: "#E24B4A" }}>বাকি {formatBDT(o.dueAmount)}</p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>{formatBanglaDate(o.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{ color: S.muted }}>পৃষ্ঠা {page}/{totalPages} · মোট {total}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium disabled:opacity-40"
              style={{ borderColor: S.border, backgroundColor: S.surface, color: S.secondary }}
            >
              <ChevronLeft size={14} /> পূর্ববর্তী
            </button>
            <span className="text-xs px-3 py-2 rounded-xl font-bold" style={{ backgroundColor: "#E1F0FF", color: "#2B7CE9" }}>
              {page}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium disabled:opacity-40"
              style={{ borderColor: S.border, backgroundColor: S.surface, color: S.secondary }}
            >
              পরবর্তী <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
    </PlanGate>
  );
}
