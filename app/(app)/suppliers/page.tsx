"use client";

import { useEffect, useState } from "react";
import {
  Search, Plus, Phone, MapPin, Trash2, X, Truck,
  AlertTriangle, ShoppingBag, Mail, FileText, Save,
  Loader2, Pencil, FileDown, BadgeDollarSign,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";

interface Supplier {
  id: string; name: string; phone: string | null; address: string | null;
  email: string | null; note: string | null; dueAmount: number;
  _count: { purchases: number };
}

const AVATAR_COLORS: [string, string][] = [
  ["#EFF6FF", "#1D4ED8"], ["#F0FDF4", "#15803D"], ["#FFF7ED", "#C2410C"],
  ["#FDF4FF", "#7E22CE"], ["#FFF1F2", "#BE123C"], ["#F0FDFA", "#0F766E"],
  ["#FFFBEB", "#92400E"], ["#F0F9FF", "#0369A1"],
];
function avatarColor(name: string): [string, string] {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

const fieldCls = "w-full h-11 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 bg-white outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400";

const EMPTY_FORM = { name: "", phone: "", address: "", email: "", note: "" };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", h); return () => mq.removeEventListener("change", h);
  }, []);

  async function fetchSuppliers() {
    setLoading(true);
    const r = await fetch(`/api/suppliers${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    const data = await r.json();
    setSuppliers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchSuppliers(); }, [search]);

  function openPanel(sup?: Supplier) {
    setEditSupplier(sup ?? null);
    setForm(sup ? { name: sup.name, phone: sup.phone ?? "", address: sup.address ?? "", email: sup.email ?? "", note: sup.note ?? "" } : { ...EMPTY_FORM });
    setPanelOpen(true);
    setTimeout(() => setPanelVisible(true), 10);
  }

  function closePanel() {
    setPanelVisible(false);
    setTimeout(() => { setPanelOpen(false); setEditSupplier(null); }, 320);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const method = editSupplier ? "PATCH" : "POST";
    const url = editSupplier ? `/api/suppliers/${editSupplier.id}` : "/api/suppliers";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (r.ok) {
      showToast("success", editSupplier ? "Supplier আপডেট হয়েছে ✓" : "নতুন Supplier যোগ হয়েছে ✓");
      closePanel(); fetchSuppliers();
    } else {
      showToast("error", "সেভ করা যায়নি।");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const r = await fetch(`/api/suppliers/${deleteId}`, { method: "DELETE" });
    setDeleting(false); setDeleteId(null);
    if (r.ok) { showToast("success", "Supplier মুছে দেওয়া হয়েছে ✓"); fetchSuppliers(); }
    else showToast("error", "মুছতে পারেনি।");
  }

  function exportCSV() {
    const rows = [
      ["নাম", "ফোন", "ঠিকানা", "Email", "বাকি (৳)", "Purchase সংখ্যা", "নোট"],
      ...suppliers.map(s => [s.name, s.phone ?? "", s.address ?? "", s.email ?? "", s.dueAmount, s._count.purchases, s.note ?? ""]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "suppliers.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  const totalDue = suppliers.reduce((s, x) => s + x.dueAmount, 0);
  const totalPurchases = suppliers.reduce((s, x) => s + x._count.purchases, 0);
  const withDue = suppliers.filter(s => s.dueAmount > 0).length;

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone ?? "").includes(search)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-8">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-xl"
          style={{ backgroundColor: toast.type === "success" ? "#10B981" : "#EF4444" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Supplier মুছবেন?</h3>
            <p className="text-sm text-gray-500 mb-6">এই Supplier-এর সব purchase history মুছে যাবে। এটি undo করা যাবে না।</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-60">
                {deleting ? "মুছছে..." : "মুছে দিন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Panel Backdrop ── */}
      {panelOpen && (
        <div onClick={closePanel} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: panelVisible ? 1 : 0 }} />
      )}

      {/* ── Add/Edit Panel ── */}
      {panelOpen && (
        <div className="fixed z-50 bg-white flex flex-col"
          style={isDesktop ? {
            top: 0, right: 0, bottom: 0, width: 460,
            borderLeft: "1px solid #F3F4F6",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
            transform: panelVisible ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          } : {
            left: 0, right: 0, bottom: 0, height: "90svh",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
            transform: panelVisible ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          }}>

          {!isDesktop && <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-200 rounded-full" />}

          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                <Truck size={18} color="#fff" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{editSupplier ? "Supplier সম্পাদনা" : "নতুন Supplier"}</p>
                <p className="text-xs text-gray-400">সরবরাহকারীর তথ্য লিখুন</p>
              </div>
            </div>
            <button onClick={closePanel} className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Panel Body */}
          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">নাম *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Supplier-এর নাম" required className={fieldCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ফোন নম্বর</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01XXXXXXXXX" className={fieldCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">ঠিকানা</label>
                <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="সরবরাহকারীর ঠিকানা..." rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className={fieldCls} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">নোট</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="অতিরিক্ত মন্তব্য..." rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors placeholder:text-gray-400 resize-none" />
              </div>
              {editSupplier && editSupplier.dueAmount > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">বাকি: {formatBDT(editSupplier.dueAmount)}</p>
                    <p className="text-xs text-amber-600">Purchase-এ গিয়ে বাকি পরিবর্তন করুন</p>
                  </div>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 flex gap-3 bg-white">
              <button type="button" onClick={closePanel} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">বাতিল</button>
              <button type="submit" disabled={saving || !form.name.trim()}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
                {saving ? <><Loader2 size={15} className="animate-spin" /> সেভ হচ্ছে...</> : <><Save size={15} /> সেভ করুন</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
            <Truck size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Supplier ম্যানেজমেন্ট</h1>
            <p className="text-xs text-gray-500">সরবরাহকারীদের তথ্য ও পেমেন্ট পরিচালনা</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <FileDown size={15} /> CSV
          </button>
          <button onClick={() => openPanel()}
            className="flex items-center gap-2 px-4 h-10 rounded-xl text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
            <Plus size={16} /> নতুন Supplier
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
              <div className="w-9 h-9 bg-gray-100 rounded-xl mb-3" />
              <div className="h-7 bg-gray-100 rounded-lg w-16 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          ))
        ) : [
          { label: "মোট Supplier", value: suppliers.length, sub: "নিবন্ধিত", icon: Truck, bg: "#F5F3FF", fg: "#7C3AED" },
          { label: "মোট Purchase", value: totalPurchases, sub: "সব মিলিয়ে", icon: ShoppingBag, bg: "#EFF6FF", fg: "#1D4ED8" },
          { label: "বাকি Supplier", value: withDue, sub: "জনের কাছে বাকি", icon: AlertTriangle, bg: "#FFFBEB", fg: "#92400E" },
          { label: "মোট বাকি", value: formatBDT(totalDue), sub: "পরিশোধযোগ্য", icon: BadgeDollarSign, bg: "#FFF1F2", fg: "#BE123C" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
              <s.icon size={17} style={{ color: s.fg }} />
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label} · {s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Due Alert ── */}
      {!loading && totalDue > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            মোট Supplier বাকি: <strong className="font-black">{formatBDT(totalDue)}</strong> — দ্রুত পরিশোধ করুন
          </p>
        </div>
      )}

      {/* ── Main Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="নাম বা ফোন দিয়ে খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-800 outline-none focus:border-gray-400 transition-colors" />
          </div>
          <p className="text-xs text-gray-400 font-medium flex-shrink-0">{filtered.length}টি</p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-11 h-11 bg-gray-100 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-64" />
                </div>
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)" }}>
              <Truck size={28} className="text-purple-500" />
            </div>
            <p className="font-semibold text-gray-600 text-sm">কোনো Supplier নেই।</p>
            <p className="text-xs text-gray-400 mt-1 mb-5">সরবরাহকারী যোগ করুন</p>
            <button onClick={() => openPanel()}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#8B5CF6,#6D28D9)" }}>
              + নতুন Supplier যোগ করুন
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Supplier", "ফোন / Email", "ঠিকানা", "Purchase", "বাকি", "নোট", ""].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(sup => {
                    const [bg, fg] = avatarColor(sup.name);
                    return (
                      <tr key={sup.id} className="hover:bg-purple-50/20 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                              {sup.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{sup.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            {sup.phone ? <div className="flex items-center gap-1.5 text-sm text-gray-600"><Phone size={12} className="text-gray-400" />{sup.phone}</div> : <span className="text-gray-300 text-xs">—</span>}
                            {sup.email && <div className="flex items-center gap-1.5 text-xs text-gray-400"><Mail size={11} />{sup.email}</div>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {sup.address ? (
                            <div className="flex items-center gap-1.5 max-w-[160px]"><MapPin size={12} className="text-gray-400 flex-shrink-0" /><span className="truncate">{sup.address}</span></div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                            <ShoppingBag size={13} className="text-gray-400" />{sup._count.purchases}টি
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {sup.dueAmount > 0
                            ? <span className="font-bold text-red-600 text-sm">{formatBDT(sup.dueAmount)}</span>
                            : <span className="text-xs font-semibold text-emerald-500">পরিশোধিত</span>}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-400 max-w-[140px]">
                          {sup.note ? <div className="flex items-start gap-1"><FileText size={11} className="text-gray-300 flex-shrink-0 mt-0.5" /><span className="truncate">{sup.note}</span></div> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openPanel(sup)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="সম্পাদনা"><Pencil size={14} className="text-gray-500" /></button>
                            <button onClick={() => setDeleteId(sup.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" title="মুছুন"><Trash2 size={14} className="text-red-400" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-50">
              {filtered.map(sup => {
                const [bg, fg] = avatarColor(sup.name);
                return (
                  <div key={sup.id} className="flex items-start gap-3 px-4 py-4">
                    <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                      {sup.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-sm">{sup.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {sup.phone ?? "ফোন নেই"} · {sup._count.purchases}টি Purchase
                          </p>
                          {sup.address && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{sup.address}</p>}
                        </div>
                        {sup.dueAmount > 0 && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] text-gray-400">বাকি</p>
                            <p className="text-sm font-black text-red-600">{formatBDT(sup.dueAmount)}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => openPanel(sup)} className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:underline"><Pencil size={11} /> সম্পাদনা</button>
                        <button onClick={() => setDeleteId(sup.id)} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"><Trash2 size={11} /> মুছুন</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
