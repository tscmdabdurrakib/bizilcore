"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw, Package, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { formatBDT, formatBanglaDate } from "@/lib/utils";
import PageShell from "@/components/ui/PageShell";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import FilterBar from "@/components/ui/FilterBar";
import EmptyState from "@/components/ui/EmptyState";

interface ReturnItem {
  id: string;
  quantity: number;
  product: { id: string; name: string };
}

interface OrderReturn {
  id: string;
  reason: string | null;
  restock: boolean;
  createdAt: string;
  order: {
    id: string;
    totalAmount: number;
    customer: { id: string; name: string; phone: string | null } | null;
  };
  items: ReturnItem[];
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<OrderReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search) params.set("search", search);
    fetch(`/api/returns?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setReturns(d.returns ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { setPage(1); }, [search]);

  const restockCount = returns.filter(r => r.restock).length;

  return (
    <PageShell
      title="রিটার্ন ম্যানেজমেন্ট"
      subtitle="সব পণ্য রিটার্নের তথ্য এখানে"
      actions={
        <Link href="/orders">
          <Button variant="outline" size="sm" icon={ArrowLeft}>অর্ডারে ফিরুন</Button>
        </Link>
      }
      stats={
        <>
          <StatCard label="মোট রিটার্ন" value={total} icon={RotateCcw} accent="red" />
          <StatCard label="স্টকে ফেরত" value={restockCount} icon={Package} accent="green" />
          <StatCard label="এই পেজে" value={returns.length} icon={Package} accent="gold" />
        </>
      }
    >
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="কাস্টমারের নাম বা কারণ দিয়ে খুঁজুন..."
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl h-28 animate-pulse card-premium" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <EmptyState icon={RotateCcw} title="কোনো রিটার্ন নেই" description="অর্ডারের বিস্তারিত থেকে রিটার্ন দেওয়া যায়" />
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => (
            <Card key={ret.id} padding="none" className="overflow-hidden">
              <div className="h-1" style={{ backgroundColor: ret.restock ? "#0F6E56" : "#EF9F27" }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <Link
                        href={`/orders/${ret.order.id}`}
                        className="text-sm font-bold hover:underline"
                        style={{ color: "var(--c-primary)" }}
                      >
                        অর্ডার #{ret.order.id.slice(-6).toUpperCase()}
                      </Link>
                      {ret.order.customer && (
                        <Link
                          href={`/customers/${ret.order.customer.id}`}
                          className="text-sm hover:underline"
                          style={{ color: "var(--c-text)" }}
                        >
                          · {ret.order.customer.name}
                        </Link>
                      )}
                      <Badge variant={ret.restock ? "success" : "warning"}>
                        {ret.restock ? "✓ স্টকে ফেরত" : "স্টকে আসেনি"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-2">
                      {ret.items.map((item) => (
                        <span
                          key={item.id}
                          className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium card-stat"
                        >
                          <Package size={11} />
                          {item.product.name} × {item.quantity}
                        </span>
                      ))}
                    </div>

                    {ret.reason && (
                      <p className="text-xs italic" style={{ color: "var(--c-text-muted)" }}>
                        কারণ: {ret.reason}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold font-display" style={{ color: "#E24B4A" }}>
                      {formatBDT(ret.order.totalAmount)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>{formatBanglaDate(ret.createdAt)}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>পৃষ্ঠা {page}/{pages} · মোট {total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={ChevronLeft} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              পূর্ববর্তী
            </Button>
            <span className="text-xs px-3 py-2 rounded-xl font-bold" style={{ backgroundColor: "#FFE8E8", color: "#E24B4A" }}>
              {page}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>
              পরবর্তী <ChevronRight size={14} className="inline ml-1" />
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
