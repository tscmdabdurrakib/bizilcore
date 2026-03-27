"use client";

import { useEffect, useState } from "react";
import {
  Tag, Plus, Trash2, Edit2, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, RefreshCw, X, Check, Users,
  Percent, DollarSign, Calendar, AlertCircle, Eye,
  TrendingUp, Gift, Clock, Shield,
} from "lucide-react";

const S = {
  primary: "#0F6E56", primaryLight: "#E1F5EE",
  bg: "#F7F6F2", surface: "#FFFFFF", border: "#E8E6DF",
  text: "#1A1A18", textSub: "#5A5A56", textMuted: "#A8A69E",
  danger: "#DC2626", dangerLight: "#FEE2E2",
  warning: "#D97706", warningLight: "#FEF3C7",
  success: "#059669", successLight: "#D1FAE5",
};

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  maxUsesPerUser: number;
  usedCount: number;
  validFrom: string | null;
  validTo: string | null;
  minAmount: number | null;
  applicablePlans: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { usages: number; payments: number };
}

interface UsageDetail {
  id: string;
  user: { id: string; name: string; email: string };
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  usedAt: string;
}

const emptyForm = {
  code: "", description: "", discountType: "PERCENT", discountValue: "",
  maxUses: "", maxUsesPerUser: "1", validFrom: "", validTo: "",
  minAmount: "", applicablePlans: "", isActive: true,
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("bn-BD");
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("bn-BD") + " " + d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ code }: { code: PromoCode }) {
  const now = new Date();
  const expired = code.validTo && new Date(code.validTo) < now;
  const notStarted = code.validFrom && new Date(code.validFrom) > now;
  const maxed = code.maxUses !== null && code.usedCount >= code.maxUses;

  if (!code.isActive) return <span style={{ backgroundColor: S.dangerLight, color: S.danger, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>বন্ধ</span>;
  if (expired) return <span style={{ backgroundColor: "#FEF3C7", color: "#92400E", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>মেয়াদ শেষ</span>;
  if (notStarted) return <span style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>শুরু হয়নি</span>;
  if (maxed) return <span style={{ backgroundColor: S.warningLight, color: S.warning, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>সীমা পূর্ণ</span>;
  return <span style={{ backgroundColor: S.successLight, color: S.success, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>সক্রিয়</span>;
}

export default function PromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usageDetails, setUsageDetails] = useState<Record<string, UsageDetail[]>>({});
  const [loadingUsage, setLoadingUsage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-codes");
      const data = await res.json();
      if (res.ok) setCodes(data.codes ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function showMsg(msg: string, isError = false) {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  }

  async function handleSave() {
    setError("");
    if (!form.code || !form.discountValue) { setError("Code ও discount value দিন"); return; }
    setSaving(true);
    try {
      const url = editId ? `/api/admin/promo-codes/${editId}` : "/api/admin/promo-codes";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || "সমস্যা হয়েছে", true); return; }
      showMsg(editId ? "Promo code আপডেট হয়েছে" : "Promo code তৈরি হয়েছে");
      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      load();
    } finally {
      setSaving(false);
    }
  }

  function startEdit(c: PromoCode) {
    setForm({
      code: c.code,
      description: c.description ?? "",
      discountType: c.discountType,
      discountValue: String(c.discountValue),
      maxUses: c.maxUses !== null ? String(c.maxUses) : "",
      maxUsesPerUser: String(c.maxUsesPerUser),
      validFrom: c.validFrom ? c.validFrom.slice(0, 10) : "",
      validTo: c.validTo ? c.validTo.slice(0, 10) : "",
      minAmount: c.minAmount !== null ? String(c.minAmount) : "",
      applicablePlans: c.applicablePlans ?? "",
      isActive: c.isActive,
    });
    setEditId(c.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleActive(c: PromoCode) {
    const res = await fetch(`/api/admin/promo-codes/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (res.ok) {
      showMsg(c.isActive ? "বন্ধ করা হয়েছে" : "চালু করা হয়েছে");
      load();
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showMsg(data.error || "সমস্যা হয়েছে", true); return; }
      showMsg("Promo code মুছে ফেলা হয়েছে");
      load();
      if (expandedId === id) setExpandedId(null);
    } finally {
      setDeleting(null);
    }
  }

  async function loadUsage(id: string) {
    if (usageDetails[id]) return;
    setLoadingUsage(id);
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`);
      const data = await res.json();
      if (res.ok) {
        setUsageDetails((prev) => ({ ...prev, [id]: data.promo.usages ?? [] }));
      }
    } finally {
      setLoadingUsage(null);
    }
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadUsage(id);
    }
  }

  const filtered = codes.filter((c) => {
    if (filter === "active") return c.isActive;
    if (filter === "inactive") return !c.isActive;
    return true;
  });

  const totalDiscount = codes.reduce((sum, c) => sum + c._count.usages, 0);

  const inp: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8, fontSize: 14,
    border: `1px solid ${S.border}`, backgroundColor: S.surface, color: S.text,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: S.bg, padding: "24px 16px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: S.text, display: "flex", alignItems: "center", gap: 8 }}>
              <Gift size={22} color={S.primary} /> Promo Code Manager
            </h1>
            <p style={{ color: S.textMuted, fontSize: 13, marginTop: 4 }}>সব discount code পরিচালনা করুন</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${S.border}`, backgroundColor: S.surface, color: S.textSub, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyForm); }} style={{ padding: "8px 16px", borderRadius: 8, backgroundColor: S.primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={15} /> নতুন Code
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "মোট Codes", value: codes.length, icon: <Tag size={16} />, color: S.primary, bg: S.primaryLight },
            { label: "সক্রিয় Codes", value: codes.filter((c) => c.isActive).length, icon: <Check size={16} />, color: S.success, bg: S.successLight },
            { label: "মোট ব্যবহার", value: totalDiscount, icon: <Users size={16} />, color: "#7C3AED", bg: "#EDE9FE" },
            { label: "বন্ধ Codes", value: codes.filter((c) => !c.isActive).length, icon: <Shield size={16} />, color: S.warning, bg: S.warningLight },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>{s.icon}</div>
                <span style={{ fontSize: 12, color: S.textMuted }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: S.text }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ backgroundColor: S.dangerLight, border: `1px solid #FCA5A5`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: S.danger, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div style={{ backgroundColor: S.successLight, border: `1px solid #6EE7B7`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: S.success, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Check size={16} /> {success}
          </div>
        )}

        {/* Create / Edit Form */}
        {showForm && (
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 16, fontWeight: 700, color: S.text }}>{editId ? "Promo Code এডিট" : "নতুন Promo Code তৈরি"}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={{ background: "none", border: "none", cursor: "pointer", color: S.textMuted }}><X size={18} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>CODE *</label>
                <input style={inp} placeholder="SUMMER20" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} disabled={!!editId} />
                {!editId && <p style={{ fontSize: 11, color: S.textMuted, marginTop: 4 }}>A-Z, 0-9, _ এবং - ব্যবহার করুন</p>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>বিবরণ</label>
                <input style={inp} placeholder="গ্রীষ্মকালীন ছাড়" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>Discount ধরন *</label>
                <div className="flex gap-2">
                  {[{ v: "PERCENT", label: "% Percentage", icon: <Percent size={14} /> }, { v: "FIXED", label: "৳ Fixed Amount", icon: <DollarSign size={14} /> }].map((opt) => (
                    <button key={opt.v} onClick={() => setForm((f) => ({ ...f, discountType: opt.v }))} style={{ flex: 1, padding: "9px 10px", borderRadius: 8, border: `2px solid ${form.discountType === opt.v ? S.primary : S.border}`, backgroundColor: form.discountType === opt.v ? S.primaryLight : S.surface, color: form.discountType === opt.v ? S.primary : S.textSub, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  {form.discountType === "PERCENT" ? "Percentage (%) *" : "Fixed Amount (৳) *"}
                </label>
                <input style={inp} type="number" placeholder={form.discountType === "PERCENT" ? "20" : "100"} value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} min="1" max={form.discountType === "PERCENT" ? "100" : undefined} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>সর্বোচ্চ মোট ব্যবহার (ফাঁকা = সীমাহীন)</label>
                <input style={inp} type="number" placeholder="100" value={form.maxUses} onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))} min="1" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>প্রতি User সর্বোচ্চ ব্যবহার</label>
                <input style={inp} type="number" placeholder="1" value={form.maxUsesPerUser} onChange={(e) => setForm((f) => ({ ...f, maxUsesPerUser: e.target.value }))} min="1" />
              </div>

              <div>
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>শুরুর তারিখ (ঐচ্ছিক)</label>
                <input style={inp} type="date" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>শেষ তারিখ (ঐচ্ছিক)</label>
                <input style={inp} type="date" value={form.validTo} onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>সর্বনিম্ন Amount (৳) (ঐচ্ছিক)</label>
                <input style={inp} type="number" placeholder="199" value={form.minAmount} onChange={(e) => setForm((f) => ({ ...f, minAmount: e.target.value }))} min="0" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>প্রযোজ্য Plan (ঐচ্ছিক)</label>
                <select style={inp} value={form.applicablePlans} onChange={(e) => setForm((f) => ({ ...f, applicablePlans: e.target.value }))}>
                  <option value="">সব Plan</option>
                  <option value="pro">শুধু Pro</option>
                  <option value="business">শুধু Business</option>
                  <option value="pro,business">Pro ও Business</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label style={{ fontSize: 12, color: S.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>স্ট্যাটাস</label>
                <button onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, border: `1px solid ${form.isActive ? S.success : S.border}`, backgroundColor: form.isActive ? S.successLight : S.surface, color: form.isActive ? S.success : S.textSub, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  {form.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                  {form.isActive ? "সক্রিয়" : "বন্ধ"}
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, backgroundColor: S.primary, color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 14, opacity: saving ? 0.7 : 1 }}>
                {saving ? "সংরক্ষণ হচ্ছে..." : editId ? "আপডেট করুন" : "তৈরি করুন"}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }} style={{ padding: "10px 20px", borderRadius: 10, border: `1px solid ${S.border}`, backgroundColor: S.surface, color: S.textSub, cursor: "pointer", fontSize: 14 }}>
                বাতিল
              </button>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {[{ v: "all", label: "সব" }, { v: "active", label: "সক্রিয়" }, { v: "inactive", label: "বন্ধ" }].map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v as typeof filter)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${filter === f.v ? S.primary : S.border}`, backgroundColor: filter === f.v ? S.primaryLight : S.surface, color: filter === f.v ? S.primary : S.textSub, cursor: "pointer", fontSize: 12, fontWeight: filter === f.v ? 700 : 400 }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Codes List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: S.primary }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: 14, padding: 40, textAlign: "center" }}>
            <Gift size={40} color={S.textMuted} style={{ margin: "0 auto 12px" }} />
            <p style={{ color: S.textMuted, fontSize: 14 }}>কোনো promo code নেই</p>
            <button onClick={() => setShowForm(true)} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 10, backgroundColor: S.primary, color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              প্রথম Code তৈরি করুন
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div key={c.id} style={{ backgroundColor: S.surface, border: `1px solid ${expandedId === c.id ? S.primary : S.border}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>
                <div style={{ padding: "16px 20px" }}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div style={{ backgroundColor: S.primaryLight, borderRadius: 8, padding: "6px 12px", fontFamily: "monospace", fontWeight: 800, fontSize: 15, color: S.primary, letterSpacing: 1 }}>
                        {c.code}
                      </div>
                      <StatusBadge code={c} />
                      <div style={{ display: "flex", alignItems: "center", gap: 4, backgroundColor: c.discountType === "PERCENT" ? "#EDE9FE" : "#FEF3C7", borderRadius: 6, padding: "3px 9px", fontSize: 12, fontWeight: 700, color: c.discountType === "PERCENT" ? "#7C3AED" : "#92400E" }}>
                        {c.discountType === "PERCENT" ? <Percent size={12} /> : <span>৳</span>}
                        {c.discountType === "PERCENT" ? `${c.discountValue}% ছাড়` : `৳${c.discountValue} ছাড়`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive(c)} title={c.isActive ? "বন্ধ করুন" : "চালু করুন"} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${S.border}`, backgroundColor: S.surface, color: c.isActive ? S.success : S.textMuted, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                        {c.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                      <button onClick={() => startEdit(c)} title="এডিট" style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${S.border}`, backgroundColor: S.surface, color: S.textSub, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => toggleExpand(c.id)} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${S.border}`, backgroundColor: expandedId === c.id ? S.primaryLight : S.surface, color: expandedId === c.id ? S.primary : S.textSub, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                        <Eye size={13} /> {expandedId === c.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      <button onClick={() => {
                        if (confirm(`"${c.code}" delete করবেন?`)) handleDelete(c.id);
                      }} disabled={deleting === c.id} title="মুছুন" style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${S.dangerLight}`, backgroundColor: S.dangerLight, color: S.danger, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, opacity: deleting === c.id ? 0.6 : 1 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {c.description && <p style={{ color: S.textSub, fontSize: 13, marginTop: 8 }}>{c.description}</p>}

                  <div className="flex flex-wrap gap-x-6 gap-y-2 mt-10" style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: S.textMuted }}>
                      <Users size={12} />
                      <span>{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""} ব্যবহার</span>
                    </div>
                    {c.maxUsesPerUser > 1 && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: S.textMuted }}>
                        <TrendingUp size={12} />
                        <span>প্রতিজন সর্বোচ্চ {c.maxUsesPerUser}বার</span>
                      </div>
                    )}
                    {c.minAmount && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: S.textMuted }}>
                        <DollarSign size={12} />
                        <span>সর্বনিম্ন ৳{c.minAmount}</span>
                      </div>
                    )}
                    {(c.validFrom || c.validTo) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: S.textMuted }}>
                        <Calendar size={12} />
                        <span>{fmtDate(c.validFrom)} → {fmtDate(c.validTo)}</span>
                      </div>
                    )}
                    {c.applicablePlans && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: S.textMuted }}>
                        <Shield size={12} />
                        <span>{c.applicablePlans.split(",").map((p) => p.trim().charAt(0).toUpperCase() + p.trim().slice(1)).join(", ")} Plan</span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: S.textMuted }}>
                      <Clock size={12} />
                      <span>তৈরি: {fmtDate(c.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Usage details */}
                {expandedId === c.id && (
                  <div style={{ borderTop: `1px solid ${S.border}`, padding: "16px 20px", backgroundColor: S.bg }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: S.text, marginBottom: 12 }}>ব্যবহারকারীদের তালিকা ({c._count.usages} জন)</h3>
                    {loadingUsage === c.id ? (
                      <div className="text-center py-4">
                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: S.primary }} />
                      </div>
                    ) : (usageDetails[c.id] ?? []).length === 0 ? (
                      <p style={{ color: S.textMuted, fontSize: 13, textAlign: "center", padding: "12px 0" }}>এখনো কেউ ব্যবহার করেননি</p>
                    ) : (
                      <div className="space-y-2">
                        {(usageDetails[c.id] ?? []).map((u) => (
                          <div key={u.id} style={{ backgroundColor: S.surface, border: `1px solid ${S.border}`, borderRadius: 10, padding: "10px 14px" }} className="flex justify-between items-center flex-wrap gap-2">
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: S.text }}>{u.user.name}</div>
                              <div style={{ fontSize: 12, color: S.textMuted }}>{u.user.email}</div>
                            </div>
                            <div className="text-right">
                              <div style={{ fontSize: 12, color: S.textMuted }}>৳{u.originalAmount} → <span style={{ color: S.success, fontWeight: 700 }}>৳{u.finalAmount}</span></div>
                              <div style={{ fontSize: 11, color: S.danger }}>-৳{u.discountAmount} সাশ্রয়</div>
                              <div style={{ fontSize: 11, color: S.textMuted }}>{fmtDateTime(u.usedAt)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
