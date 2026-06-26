"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PlanGate from "@/components/PlanGate";
import { RefreshCw, Package, ChevronLeft, ChevronRight, ExternalLink, DollarSign, Clock, Truck } from "lucide-react";
import { formatBDT, formatBanglaDate } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FilterBar from "@/components/ui/FilterBar";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";

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
  redx: "https://redx.com.bd/track-shipment/?trackingId=",
  steadfast: "https://steadfast.com.bd/en/track?trackingId=",
  paperfly: "https://paperfly.com.bd/track/",
  delivery_tiger: "https://deliverytiger.com.bd/",
};

const COURIER_LABELS: Record<string, string> = {
  all: "সব Courier",
  pathao: "Pathao",
  redx: "RedX",
  steadfast: "Steadfast",
  paperfly: "Paperfly",
  delivery_tiger: "Delivery Tiger",
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

  const couriers = ["all", "pathao", "redx", "steadfast", "paperfly", "delivery_tiger", "other"];

  function getTrackUrl(o: DeliveryOrder) {
    if (!o.courierTrackId || !o.courierName) return null;
    const base = COURIER_TRACK_URLS[o.courierName.toLowerCase()];
    return base ? base + o.courierTrackId : null;
  }

  const pendingCod   = orders.filter(o => o.codStatus === "with_courier").length;
  const collectedCod = orders.filter(o => o.codStatus === "collected").length;
  const totalPages   = Math.ceil(total / LIMIT);

  return (
    <PlanGate feature="courier">
    <PageShell
      title="ডেলিভারি ট্র্যাকিং"
      subtitle="সব active shipment এক জায়গায়"
      actions={<Button variant="outline" icon={RefreshCw} onClick={load}>Refresh</Button>}
      stats={
        <>
          <StatCard label="মোট Shipment" value={total} icon={Package} accent="blue" />
          <StatCard label="এই পেজে" value={orders.length} icon={Truck} accent="blue" />
          <StatCard label="COD Pending" value={pendingCod} icon={Clock} accent="gold" />
          <StatCard label="Cash পেয়েছি" value={collectedCod} icon={DollarSign} accent="green" />
        </>
      }
    >
      <FilterBar
        tabs={STATUS_TABS.map(t => ({ key: t.key, label: t.label }))}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="কাস্টমার বা Tracking ID..."
        filters={
          <Select
            value={courier}
            onChange={e => setCourier(e.target.value)}
            options={couriers.map(c => ({ value: c, label: COURIER_LABELS[c] ?? c }))}
            className="h-10 py-2"
          />
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 rounded-2xl animate-pulse card-premium" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={Truck} title="কোনো shipment পাওয়া যায়নি" description="এই ফিল্টারে কোনো ডেলিভারি নেই" />
      ) : (
        <div className="space-y-2">
          {orders.map(o => {
            const st = STATUS_TABS.find(t => t.key === o.status) ?? STATUS_TABS[0];
            const cod = o.codStatus ? COD_STYLE[o.codStatus] : null;
            const trackUrl = getTrackUrl(o);
            const days = daysSince(o.createdAt);

            return (
              <div key={o.id} style={{ borderLeft: `3px solid ${st.color}` }}>
              <Card padding="md" className="overflow-hidden rounded-l-none">
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
                        <Badge variant={st.key === "delivered" ? "success" : st.key === "returned" ? "danger" : "info"}>
                          {st.label}
                        </Badge>
                        {cod && (
                          <Badge variant="warning">COD: {cod.label}</Badge>
                        )}
                        {days > 0 && (
                          <span className="text-xs font-medium" style={{ color: days > 7 ? "#E24B4A" : "var(--c-text-muted)" }}>
                            {days} দিন আগে
                          </span>
                        )}
                      </div>

                      {o.customer && (
                        <p className="text-sm mb-1.5" style={{ color: "var(--c-text)" }}>
                          <Link href={`/customers/${o.customer.id}`} className="font-medium hover:underline">
                            {o.customer.name}
                          </Link>
                          {o.customer.phone && <span style={{ color: "var(--c-text-muted)" }}> · {o.customer.phone}</span>}
                        </p>
                      )}

                      {(o.courierName || o.courierTrackId) && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {o.courierName && (
                            <Badge variant="info">{COURIER_LABELS[o.courierName] ?? o.courierName.toUpperCase()}</Badge>
                          )}
                          {o.courierTrackId && (
                            <span className="text-xs font-mono" style={{ color: "var(--c-text-sub)" }}>{o.courierTrackId}</span>
                          )}
                          {trackUrl && (
                            <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-medium hover:underline"
                              style={{ color: "var(--c-primary)" }}>
                              <ExternalLink size={11} /> Track করুন
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: "var(--c-text)" }}>{formatBDT(o.totalAmount)}</p>
                      {o.dueAmount > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: "#E24B4A" }}>বাকি {formatBDT(o.dueAmount)}</p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>{formatBanglaDate(o.createdAt)}</p>
                    </div>
                  </div>
              </Card>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>পৃষ্ঠা {page}/{totalPages} · মোট {total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={ChevronLeft} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              পূর্ববর্তী
            </Button>
            <span className="text-xs px-3 py-2 rounded-xl font-bold" style={{ backgroundColor: "#E1F0FF", color: "#2B7CE9" }}>
              {page}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              পরবর্তী <ChevronRight size={14} className="inline ml-1" />
            </Button>
          </div>
        </div>
      )}
    </PageShell>
    </PlanGate>
  );
}
