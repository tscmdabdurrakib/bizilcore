"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Search, X, AlertTriangle, Phone, ChevronDown } from "lucide-react";

const S = {
  surface: "var(--c-surface)",
  border:  "var(--c-border)",
  text:    "var(--c-text)",
  muted:   "var(--c-text-muted)",
  primary: "#F59E0B",
  bg:      "var(--c-bg)",
};

const SECTIONS = ["Playgroup", "Nursery", "KG-1", "KG-2", "Pre-School"];
const GENDERS = ["ছেলে", "মেয়ে"];
const RELATIONS = ["বাবা", "মা", "অভিভাবক", "দাদা", "দাদি", "নানা", "নানি", "অন্য"];

type Child = {
  id: string;
  regNumber: string;
  name: string;
  section?: string | null;
  guardianName: string;
  guardianPhone: string;
  foodAllergies?: string | null;
  status: string;
  dateOfBirth?: string | null;
  batch?: { id: string; name: string } | null;
  attendance?: { status: string }[];
};

type Batch = { id: string; name: string; class?: string | null; monthlyFee: number };

export default function ChildrenBoard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", nameBangla: "", dateOfBirth: "", gender: "", section: "",
    bloodGroup: "", foodAllergies: "", medicalNote: "",
    guardianName: "", guardianPhone: "", guardianRelation: "বাবা",
    pickupPerson1: "", pickupPhone1: "", pickupPerson2: "", pickupPhone2: "",
    address: "", batchId: "", monthlyFee: "", notes: "",
  });

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (sectionFilter) params.set("section", sectionFilter);
    const res = await fetch(`/api/kindergarten/children?${params}`);
    const data = await res.json();
    setChildren(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search, sectionFilter]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    fetch("/api/school/batches").then(r => r.json()).then(d => setBatches(Array.isArray(d) ? d : []));
  }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.guardianName || !form.guardianPhone) {
      setError("শিশুর নাম ও অভিভাবকের তথ্য আবশ্যক");
      return;
    }
    setSaving(true); setError("");
    const res = await fetch("/api/kindergarten/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({
        name: "", nameBangla: "", dateOfBirth: "", gender: "", section: "",
        bloodGroup: "", foodAllergies: "", medicalNote: "",
        guardianName: "", guardianPhone: "", guardianRelation: "বাবা",
        pickupPerson1: "", pickupPhone1: "", pickupPerson2: "", pickupPhone2: "",
        address: "", batchId: "", monthlyFee: "", notes: "",
      });
      fetchChildren();
    } else {
      const d = await res.json();
      setError(d.error ?? "ত্রুটি হয়েছে");
    }
    setSaving(false);
  };

  // Attendance % for this month
  const getAttendancePct = (child: Child) => {
    const att = child.attendance ?? [];
    if (att.length === 0) return null;
    const present = att.filter(a => a.status === "present").length;
    return Math.round((present / att.length) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }} />
            <input
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border"
              placeholder="নাম, ফোন বা রেজিস্ট্রেশন..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ borderColor: S.border, background: S.surface, color: S.text }}
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={12} style={{ color: S.muted }} /></button>}
          </div>

          <select
            value={sectionFilter}
            onChange={e => setSectionFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: S.border, background: S.surface, color: S.text }}
          >
            <option value="">সব সেকশন</option>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: S.primary }}
        >
          <Plus size={15} />
          নতুন শিশু ভর্তি
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : children.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Users size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">কোনো শিশু পাওয়া যায়নি</p>
          <p className="text-sm mt-1">নতুন শিশু ভর্তি করুন</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {children.map(child => {
            const pct = getAttendancePct(child);
            return (
              <div key={child.id} className="rounded-xl p-4" style={{ background: S.surface, border: `1px solid ${S.border}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ background: "#FFFBEB", color: S.primary }}>
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm" style={{ color: S.text }}>{child.name}</p>
                        {child.section && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#FFFBEB", color: "#B45309" }}>{child.section}</span>
                        )}
                        {child.foodAllergies && (
                          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#FEF2F2", color: "#DC2626" }}>
                            <AlertTriangle size={10} />
                            Allergy
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                        {child.regNumber} {child.batch ? `· ${child.batch.name}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {pct !== null && (
                      <p className="text-xs font-medium" style={{ color: pct >= 75 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444" }}>
                        {pct}% উপস্থিতি
                      </p>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: child.status === "active" ? "#DCFCE7" : "#F3F4F6", color: child.status === "active" ? "#166534" : "#374151" }}>
                      {child.status === "active" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${S.border}` }}>
                  <Phone size={12} style={{ color: S.muted }} />
                  <p className="text-xs" style={{ color: S.muted }}>
                    {child.guardianName} · {child.guardianPhone}
                  </p>
                  {child.foodAllergies && (
                    <p className="text-xs ml-auto" style={{ color: "#DC2626" }}>
                      {child.foodAllergies}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ background: S.surface }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: S.border }}>
              <h2 className="font-bold text-base" style={{ color: S.text }}>নতুন শিশু ভর্তি করুন</h2>
              <button onClick={() => setShowModal(false)}><X size={18} style={{ color: S.muted }} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              {/* শিশুর তথ্য */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: S.muted }}>শিশুর তথ্য</p>
                <div className="space-y-2">
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="শিশুর নাম *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ borderColor: S.border }} />
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="বাংলা নাম" value={form.nameBangla} onChange={e => setForm(p => ({ ...p, nameBangla: e.target.value }))} style={{ borderColor: S.border }} />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} style={{ borderColor: S.border }} />
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} style={{ borderColor: S.border }}>
                      <option value="">লিঙ্গ</option>
                      {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} style={{ borderColor: S.border }}>
                      <option value="">সেকশন *</option>
                      {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ব্লাড গ্রুপ" value={form.bloodGroup} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))} style={{ borderColor: S.border }} />
                  </div>
                  {/* Food Allergy — highlighted in red */}
                  <div className="rounded-lg p-3" style={{ background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
                    <p className="text-xs font-bold mb-1" style={{ color: "#DC2626" }}>⚠️ Food Allergy (গুরুত্বপূর্ণ)</p>
                    <input
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="যেমন: Peanut allergy, Lactose intolerant"
                      value={form.foodAllergies}
                      onChange={e => setForm(p => ({ ...p, foodAllergies: e.target.value }))}
                      style={{ borderColor: "#FCA5A5", background: "#FFF5F5" }}
                    />
                  </div>
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="চিকিৎসা সংক্রান্ত তথ্য, ডাক্তারের নাম ও ফোন" value={form.medicalNote} onChange={e => setForm(p => ({ ...p, medicalNote: e.target.value }))} rows={2} style={{ borderColor: S.border }} />
                </div>
              </div>

              {/* অভিভাবকের তথ্য */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: S.muted }}>অভিভাবকের তথ্য</p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="অভিভাবকের নাম *" value={form.guardianName} onChange={e => setForm(p => ({ ...p, guardianName: e.target.value }))} style={{ borderColor: S.border }} />
                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.guardianRelation} onChange={e => setForm(p => ({ ...p, guardianRelation: e.target.value }))} style={{ borderColor: S.border }}>
                      {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ফোন নম্বর *" value={form.guardianPhone} onChange={e => setForm(p => ({ ...p, guardianPhone: e.target.value }))} style={{ borderColor: S.border }} />
                  <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="বাড়ির ঠিকানা *" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={{ borderColor: S.border }} />

                  {/* Pickup persons */}
                  <p className="text-xs font-semibold mt-2" style={{ color: S.muted }}>আনা-নেওয়ার দায়িত্বে আছেন</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ব্যক্তি ১ (যেমন: বাবা - রহিম)" value={form.pickupPerson1} onChange={e => setForm(p => ({ ...p, pickupPerson1: e.target.value }))} style={{ borderColor: S.border }} />
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ফোন" value={form.pickupPhone1} onChange={e => setForm(p => ({ ...p, pickupPhone1: e.target.value }))} style={{ borderColor: S.border }} />
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ব্যক্তি ২ (বিকল্প)" value={form.pickupPerson2} onChange={e => setForm(p => ({ ...p, pickupPerson2: e.target.value }))} style={{ borderColor: S.border }} />
                    <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ফোন" value={form.pickupPhone2} onChange={e => setForm(p => ({ ...p, pickupPhone2: e.target.value }))} style={{ borderColor: S.border }} />
                  </div>
                </div>
              </div>

              {/* ক্লাস / ব্যাচ */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: S.muted }}>ক্লাস / ব্যাচ</p>
                <div className="space-y-2">
                  <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.batchId} onChange={e => setForm(p => ({ ...p, batchId: e.target.value }))} style={{ borderColor: S.border }}>
                    <option value="">ব্যাচ নির্বাচন করুন</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name} {b.class ? `(${b.class})` : ""} — ৳{b.monthlyFee}/মাস</option>)}
                  </select>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="মাসিক ফি (ভর্তি ফি রেকর্ড করতে)"
                    value={form.monthlyFee}
                    onChange={e => setForm(p => ({ ...p, monthlyFee: e.target.value }))}
                    style={{ borderColor: S.border }}
                  />
                  <textarea className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="অতিরিক্ত নোট" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ borderColor: S.border }} />
                </div>
              </div>
            </div>

            <div className="p-4 border-t flex gap-3" style={{ borderColor: S.border }}>
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.muted }}>বাতিল</button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium"
                style={{ background: S.primary }}
              >
                {saving ? "ভর্তি হচ্ছে..." : "ভর্তি করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
