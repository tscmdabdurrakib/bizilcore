"use client";

import { useEffect, useState } from "react";
import { Loader2, ShoppingCart, Phone, RefreshCw, CheckCircle2, Clock, Send } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { PageShell, StatCard, Card, Badge, Button, EmptyState } from "@/components/ui";

interface CartItem {
  productName?: string | null;
  variantName?: string | null;
  quantity?: number;
  unitPrice?: number;
}

interface AbandonedCart {
  id: string;
  customerName: string | null;
  phone: string;
  items: CartItem[];
  subtotal: number;
  status: string;
  remindedAt: string | null;
  recoveredOrderId: string | null;
  storeSlug: string | null;
  createdAt: string;
}

interface Metrics {
  total: number;
  open: number;
  reminded: number;
  recovered: number;
  recoveredRevenue: number;
}

const STATUS_LABELS: Record<string, string> = {
  open: "খোলা",
  reminded: "রিমাইন্ড করা",
  recovered: "রিকভার্ড",
  lost: "হারানো",
};

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/store/abandoned-cart");
    if (r.ok) {
      const d = await r.json();
      setCarts(d.carts ?? []);
      setMetrics(d.metrics ?? null);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <PageShell
      title="পরিত্যক্ত কার্ট"
      subtitle="চেকআউট শুরু করেও অর্ডার করেনি এমন কাস্টমার — অটো রিমাইন্ডার পাঠানো হয়।"
      className="max-w-5xl"
      actions={
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={load}>রিফ্রেশ</Button>
      }
      stats={metrics ? (
        <>
          <StatCard label="মোট কার্ট" value={metrics.total} icon={ShoppingCart} accent="blue" />
          <StatCard label="অপেক্ষমাণ" value={metrics.open} icon={Clock} accent="gold" />
          <StatCard label="রিমাইন্ড" value={metrics.reminded} icon={Send} accent="blue" iconBg="var(--icon-purple-bg)" iconColor="var(--icon-purple-text)" />
          <StatCard label="রিকভার্ড আয়" value={formatBDT(metrics.recoveredRevenue)} icon={CheckCircle2} accent="green" />
        </>
      ) : undefined}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>
      ) : carts.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="এখনো কোনো পরিত্যক্ত কার্ট নেই।" />
      ) : (
        <div className="space-y-2.5">
          {carts.map((c) => {
            const itemCount = c.items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0) ?? 0;
            return (
              <Card key={c.id} padding="md">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>
                      {c.customerName || "নাম নেই"}
                    </p>
                    <a href={`tel:${c.phone}`} className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                      <Phone size={11} /> {c.phone}
                    </a>
                    <p className="text-xs mt-1.5" style={{ color: "var(--c-text-muted)" }}>
                      {itemCount}টি পণ্য · {new Date(c.createdAt).toLocaleString("bn-BD")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: "var(--c-text)" }}>{formatBDT(c.subtotal)}</p>
                    <Badge status={c.status} className="mt-1.5">{STATUS_LABELS[c.status] ?? c.status}</Badge>
                  </div>
                </div>
                {c.items && c.items.length > 0 && (
                  <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
                    {c.items.slice(0, 4).map((i, idx) => (
                      <span key={idx}>
                        {i.productName ?? "পণ্য"}{i.variantName ? ` (${i.variantName})` : ""} ×{i.quantity}
                        {idx < Math.min(c.items.length, 4) - 1 ? " · " : ""}
                      </span>
                    ))}
                    {c.items.length > 4 && <span> · +{c.items.length - 4} আরও</span>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
