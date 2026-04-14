"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, AlertCircle, CheckCircle, Phone, Clock, ArrowLeft, FileDown, TrendingDown, Users } from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface DueOrder { id: string; dueAmount: number; createdAt: string; status: string }

interface DueCustomer {
  id: string; name: string; phone: string | null; dueAmount: number;
  group: string; _count: { orders: number };
  orders: DueOrder[];
}

const AVATAR_COLORS: [string, string][] = [
  ["#EFF6FF", "#1D4ED8"], ["#F0FDF4", "#15803D"], ["#FFF7ED", "#C2410C"],
  ["#FDF4FF", "#7E22CE"], ["#FFF1F2", "#BE123C"],
];
function avatarColor(name: string): [string, string] {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function daysSince(date: string) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyConfig(days: number) {
  if (days > 30) return { label: `${days} দিন`, bg: "#FFF1F2", color: "#DC2626", dot: "#EF4444" };
  if (days > 14) return { label: `${days} দিন`, bg: "#FFFBEB", color: "#92400E", dot: "#F59E0B" };
  return { label: `${days} দিন`, bg: "#F0FDF4", color: "#15803D", dot: "#22C55E" };
}

export default function DueLedgerPage() {
  const [customers, setCustomers] = useState<DueCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"amount" | "days">("amount");

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
        const list: DueCustomer[] = Array.isArray(data) ? data : [];
        setCustomers(list);
      })
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  const totalDue = customers.reduce((s, c) => s + c.dueAmount, 0);

  const sorted = [...customers].sort((a, b) => {
    if (sortBy === "amount") return b.dueAmount - a.dueAmount;
    const daysA = Math.max(...(a.orders?.filter(o => o.dueAmount > 0).map(o => daysSince(o.createdAt)) ?? [0]));
    const daysB = Math.max(...(b.orders?.filter(o => o.dueAmount > 0).map(o => daysSince(o.createdAt)) ?? [0]));
    return daysB - daysA;
  });

  function exportCSV() {
    const rows = [["কাস্টমার", "ফোন", "মোট বাকি", "অর্ডার", "অপেক্ষার দিন"]];
    for (const c of customers) {
      const oldestDue = Math.max(...(c.orders?.filter(o => o.dueAmount > 0).map(o => daysSince(o.createdAt)) ?? [0]));
      rows.push([c.name, c.phone ?? "", String(c.dueAmount), String(c._count.orders), String(oldestDue)]);
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "due-ledger.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/hisab" className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowLeft size={16} className="text-gray-500" />
          </Link>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#EF4444,#DC2626)" }}>
            <TrendingDown size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">বাকি খাতা</h1>
            <p className="text-xs text-gray-500">কাস্টমারদের বকেয়া পাওনার তালিকা</p>
          </div>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <FileDown size={15} /> CSV Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-24" />)
        ) : [
          { label: "মোট বাকি", value: formatBDT(totalDue), icon: TrendingDown, bg: "#FFF1F2", fg: "#DC2626" },
          { label: "বাকি আছে", value: `${customers.length} জন`, icon: Users, bg: "#FFF7ED", fg: "#C2410C" },
          { label: ">৩০ দিন", value: `${customers.filter(c => Math.max(...(c.orders?.filter(o => o.dueAmount > 0).map(o => daysSince(o.createdAt)) ?? [0])) > 30).length} জন`, icon: Clock, bg: "#FEF3C7", fg: "#92400E" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: s.bg }}>
              <s.icon size={16} style={{ color: s.fg }} />
            </div>
            <p className="text-xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Summary Banner */}
      {!loading && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${totalDue > 0 ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
          {totalDue > 0
            ? <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
            : <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />}
          <p className="text-sm font-semibold" style={{ color: totalDue > 0 ? "#92400E" : "#15803D" }}>
            {totalDue > 0
              ? `মোট বাকি: ${formatBDT(totalDue)} — ${customers.length} জন কাস্টমারের কাছে পাবেন`
              : "কোনো বাকি নেই! সব কাস্টমার পেমেন্ট করেছে ✓"}
          </p>
        </div>
      )}

      {/* List Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="কাস্টমার খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-800 outline-none focus:border-gray-400 transition-colors" />
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {([["amount", "পরিমাণ"], ["days", "পুরনো"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setSortBy(k)}
                className="px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ backgroundColor: sortBy === k ? "#EF4444" : "#F3F4F6", color: sortBy === k ? "#fff" : "#6B7280" }}>
                {l} অনুযায়ী
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-gray-100 rounded w-36" /><div className="h-3 bg-gray-100 rounded w-24" /></div>
                <div className="h-6 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <p className="font-bold text-gray-900 text-base mb-1">কোনো বাকি নেই!</p>
            <p className="text-sm text-gray-400">সব কাস্টমার সময়মতো পেমেন্ট করেছে।</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["কাস্টমার", "ফোন", "মোট বাকি", "অর্ডার", "অপেক্ষার সময়"].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sorted.map(c => {
                    const [bg, fg] = avatarColor(c.name);
                    const oldestDue = Math.max(...(c.orders?.filter(o => o.dueAmount > 0).map(o => daysSince(o.createdAt)) ?? [0]));
                    const urg = urgencyConfig(oldestDue);
                    return (
                      <Link key={c.id} href={`/customers/${c.id}`} className="contents">
                        <tr className="hover:bg-red-50/20 transition-colors cursor-pointer">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div style={{ width: 38, height: 38, borderRadius: "50%", backgroundColor: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                                {c.name[0].toUpperCase()}
                              </div>
                              <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {c.phone ? <div className="flex items-center gap-1.5"><Phone size={12} className="text-gray-400" />{c.phone}</div> : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-black text-red-600 text-base">{formatBDT(c.dueAmount)}</span>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-gray-700">{c._count.orders}টি</td>
                          <td className="px-5 py-4">
                            {oldestDue > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: urg.dot, flexShrink: 0 }} />
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: urg.bg, color: urg.color }}>{urg.label}</span>
                              </div>
                            ) : <span className="text-gray-300 text-sm">—</span>}
                          </td>
                        </tr>
                      </Link>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-50">
              {sorted.map(c => {
                const [bg, fg] = avatarColor(c.name);
                const oldestDue = Math.max(...(c.orders?.filter(o => o.dueAmount > 0).map(o => daysSince(o.createdAt)) ?? [0]));
                const urg = urgencyConfig(oldestDue);
                return (
                  <Link key={c.id} href={`/customers/${c.id}`} className="flex items-start gap-3 px-4 py-4 hover:bg-red-50/20 transition-colors">
                    <div style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.phone ?? "ফোন নেই"} · {c._count.orders}টি অর্ডার</p>
                        </div>
                        <p className="text-base font-black text-red-600 flex-shrink-0">{formatBDT(c.dueAmount)}</p>
                      </div>
                      {oldestDue > 0 && (
                        <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: urg.bg, color: urg.color }}>
                          <Clock size={10} /> {urg.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Footer total */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-500">{sorted.length} জন কাস্টমার</span>
              <span className="font-black text-red-600 text-base">{formatBDT(totalDue)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
