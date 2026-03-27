"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, AlertCircle, CheckCircle } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface DueCustomer {
  id: string; name: string; phone: string | null; dueAmount: number;
  group: string; _count: { orders: number };
  orders: { id: string; dueAmount: number; createdAt: string; status: string }[];
}

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)" };

export default function DueLedgerPage() {
  const [customers, setCustomers] = useState<DueCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ dueOnly: "1", all: "1" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    fetch(`/api/customers?${params}`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a: DueCustomer, b: DueCustomer) => b.dueAmount - a.dueAmount);
        setCustomers(list);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  const totalDue = customers.reduce((s, c) => s + c.dueAmount, 0);

  const daysSince = (date: string) => {
    const d = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    return d;
  };

  return (
    <div>
      {/* Summary */}
      <div className="rounded-2xl border p-5 mb-5" style={{ backgroundColor: totalDue > 0 ? "#FFF8EE" : "#F0FBF7", borderColor: totalDue > 0 ? "#F5D9A0" : "#A3E4CC" }}>
        <div className="flex items-center gap-3">
          {totalDue > 0 ? <AlertCircle size={24} style={{ color: "#E24B4A" }} /> : <CheckCircle size={24} style={{ color: "var(--c-primary)" }} />}
          <div>
            <p className="text-sm font-semibold" style={{ color: totalDue > 0 ? "#92600A" : "var(--c-primary)" }}>
              {totalDue > 0 ? `মোট বাকি: ${formatBDT(totalDue)}` : "কোনো বাকি নেই! সব clear ✓"}
            </p>
            {totalDue > 0 && <p className="text-xs mt-0.5" style={{ color: S.muted }}>{customers.length}জন কাস্টমারের কাছে পাবেন</p>}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
        <input type="text" placeholder="কাস্টমার খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 h-10 rounded-xl border text-sm outline-none"
          style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <CheckCircle size={36} className="mx-auto mb-3" style={{ color: "var(--c-primary)" }} />
          <p className="text-base font-semibold mb-1" style={{ color: S.text }}>কোনো বাকি নেই!</p>
          <p className="text-sm" style={{ color: S.muted }}>সব কাস্টমার সময়মতো পেমেন্ট করেছে।</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
          <div className="px-5 py-3 border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold" style={{ color: S.muted }}>
              <span>কাস্টমার</span>
              <span className="text-right">মোট বাকি</span>
              <span className="text-right">অর্ডার সংখ্যা</span>
              <span className="text-right">অপেক্ষার দিন</span>
            </div>
          </div>
          {customers.map((c, i) => {
            const oldestDue = c.orders
              ?.filter(o => o.dueAmount > 0)
              .map(o => daysSince(o.createdAt))
              .sort((a, b) => b - a)[0] ?? 0;
            const urgency = oldestDue > 30 ? "#E24B4A" : oldestDue > 14 ? "#EF9F27" : S.secondary;

            return (
              <Link key={c.id} href={`/customers/${c.id}`}
                className="block border-b last:border-0 hover:bg-gray-50 transition-colors"
                style={{ borderColor: S.border }}>
                <div className="px-5 py-4 grid grid-cols-4 gap-2 items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: S.primary }}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{c.name}</p>
                      {c.phone && <p className="text-xs" style={{ color: S.muted }}>{c.phone}</p>}
                    </div>
                  </div>
                  <p className="text-right font-bold text-sm" style={{ color: "#E24B4A" }}>{formatBDT(c.dueAmount)}</p>
                  <p className="text-right text-sm" style={{ color: S.secondary }}>{c._count.orders}টি</p>
                  <p className="text-right text-sm font-medium" style={{ color: urgency }}>
                    {oldestDue > 0 ? `${oldestDue} দিন` : "—"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
