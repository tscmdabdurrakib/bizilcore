"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Lightbulb, X, Loader2, Pencil } from "lucide-react";

const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };

interface Tip {
  id: string;
  title: string;
  body: string;
  category: string | null;
  week: string | null;
  helpful: number;
  notHelpful: number;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = ["সাধারণ", "বিক্রয়", "ডেলিভারি", "কাস্টমার", "অ্যাকাউন্টিং", "মার্কেটিং"];
const CATEGORY_COLORS: Record<string, string> = {
  "বিক্রয়": "#3B82F6", "ডেলিভারি": "#8B5CF6", "কাস্টমার": "#F59E0B",
  "অ্যাকাউন্টিং": "#10B981", "মার্কেটিং": "#EC4899", "সাধারণ": "#6B7280",
};

type ModalMode = "create" | "edit";

export default function AdminCommunityTipsPage() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [form, setForm] = useState({ id: "", title: "", body: "", category: "সাধারণ", week: "" });

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function load() {
    setLoading(true);
    fetch("/api/admin/community-tips")
      .then(r => r.json())
      .then(d => setTips(Array.isArray(d) ? d : []))
      .catch(() => showToast("error", "লোড করতে সমস্যা হয়েছে"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setForm({ id: "", title: "", body: "", category: "সাধারণ", week: "" });
    setModalMode("create");
    setShowForm(true);
  }

  function openEdit(tip: Tip) {
    setForm({ id: tip.id, title: tip.title, body: tip.body, category: tip.category ?? "সাধারণ", week: tip.week ?? "" });
    setModalMode("edit");
    setShowForm(true);
  }

  async function saveTip() {
    if (!form.title.trim() || !form.body.trim()) { showToast("error", "শিরোনাম ও বিস্তারিত লিখুন"); return; }
    setSaving(true);

    if (modalMode === "create") {
      const res = await fetch("/api/admin/community-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, body: form.body, category: form.category, week: form.week }),
      });
      const d = await res.json();
      setSaving(false);
      if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
      showToast("success", "টিপস যোগ হয়েছে!");
    } else {
      const res = await fetch("/api/admin/community-tips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.id, title: form.title, body: form.body, category: form.category, week: form.week }),
      });
      const d = await res.json();
      setSaving(false);
      if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
      showToast("success", "টিপস আপডেট হয়েছে!");
      setTips(prev => prev.map(t => t.id === form.id ? { ...t, ...d } : t));
    }

    setShowForm(false);
    setForm({ id: "", title: "", body: "", category: "সাধারণ", week: "" });
    if (modalMode === "create") load();
  }

  async function toggleActive(tip: Tip) {
    const newState = !tip.isActive;
    setTips(prev => prev.map(t => t.id === tip.id ? { ...t, isActive: newState } : t));
    const res = await fetch("/api/admin/community-tips", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tip.id, isActive: newState }),
    });
    if (!res.ok) {
      setTips(prev => prev.map(t => t.id === tip.id ? { ...t, isActive: tip.isActive } : t));
      showToast("error", "আপডেট করতে সমস্যা হয়েছে");
    } else {
      showToast("success", newState ? "টিপস চালু করা হয়েছে" : "টিপস লুকানো হয়েছে");
    }
  }

  async function deleteTip(tip: Tip) {
    if (!confirm(`"${tip.title}" — এই টিপস মুছে ফেলতে চান?`)) return;
    setDeletingId(tip.id);
    const res = await fetch(`/api/admin/community-tips?id=${tip.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      showToast("error", d.error ?? "মুছতে সমস্যা হয়েছে");
      return;
    }
    setTips(prev => prev.filter(t => t.id !== tip.id));
    showToast("success", "মুছে ফেলা হয়েছে");
  }

  const activeTips = tips.filter(t => t.isActive).length;

  return (
    <div className="p-6 max-w-3xl">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#FFFBEB" }}>
            <Lightbulb size={20} style={{ color: "#D97706" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: S.text }}>Community টিপস পরিচালনা</h1>
            <p className="text-sm" style={{ color: S.muted }}>{activeTips}টি active · {tips.length}টি মোট</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: S.primary }}>
          <Plus size={15} /> নতুন টিপস
        </button>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 max-w-lg w-full" style={{ backgroundColor: S.surface }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg" style={{ color: S.text }}>
                {modalMode === "create" ? "নতুন টিপস যোগ করুন" : "টিপস এডিট করুন"}
              </h3>
              <button onClick={() => setShowForm(false)}><X size={20} style={{ color: S.muted }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>শিরোনাম *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="যেমন: Eid এর আগে ৪ সপ্তাহ আগে stock বাড়িয়ে রাখুন"
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>বিস্তারিত *</label>
                <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                  placeholder="টিপসটি বিস্তারিত লিখুন..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>ক্যাটাগরি</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: S.text }}>সপ্তাহ (ঐচ্ছিক)</label>
                  <input type="text" value={form.week} onChange={e => setForm(p => ({ ...p, week: e.target.value }))}
                    placeholder="যেমন: 2025-W15"
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.bg }} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.secondary }}>বাতিল</button>
              <button onClick={saveTip} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: S.primary }}>
                {saving ? <><Loader2 size={14} className="animate-spin" /> সংরক্ষণ হচ্ছে...</> : modalMode === "create" ? "টিপস যোগ করুন" : "আপডেট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: S.surface }} />)}
        </div>
      ) : tips.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <Lightbulb size={36} className="mx-auto mb-3 opacity-30" style={{ color: S.muted }} />
          <p className="font-medium" style={{ color: S.text }}>এখনো কোনো টিপস নেই</p>
          <p className="text-sm mt-1" style={{ color: S.muted }}>উপরে "নতুন টিপস" বাটন দিয়ে প্রথম টিপস যোগ করুন</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tips.map(tip => {
            const catColor = CATEGORY_COLORS[tip.category ?? ""] ?? "#6B7280";
            const isDeleting = deletingId === tip.id;
            return (
              <div key={tip.id} className="rounded-2xl p-5 transition-opacity" style={{ backgroundColor: S.surface, border: `1px solid ${tip.isActive ? S.border : "#FCA5A5"}`, opacity: isDeleting ? 0.5 : tip.isActive ? 1 : 0.7 }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {tip.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${catColor}15`, color: catColor }}>
                          {tip.category}
                        </span>
                      )}
                      {!tip.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#FEE2E2", color: "#991B1B" }}>Hidden</span>}
                      {tip.week && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: S.bg, color: S.muted }}>{tip.week}</span>}
                    </div>
                    <p className="font-semibold text-sm" style={{ color: S.text }}>{tip.title}</p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: S.secondary }}>{tip.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs" style={{ color: "#10B981" }}>👍 {tip.helpful} কাজে লেগেছে</span>
                      <span className="text-xs" style={{ color: "#EF4444" }}>👎 {tip.notHelpful}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => openEdit(tip)}
                      className="p-2 rounded-xl hover:bg-blue-50 transition-colors"
                      title="এডিট করুন">
                      <Pencil size={15} style={{ color: "#3B82F6" }} />
                    </button>
                    <button onClick={() => toggleActive(tip)}
                      className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      title={tip.isActive ? "লুকান" : "দেখান"}>
                      {tip.isActive ? <Eye size={15} style={{ color: "#10B981" }} /> : <EyeOff size={15} style={{ color: S.muted }} />}
                    </button>
                    <button onClick={() => deleteTip(tip)} disabled={isDeleting}
                      className="p-2 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50">
                      {isDeleting ? <Loader2 size={15} className="animate-spin" style={{ color: "#EF4444" }} /> : <Trash2 size={15} style={{ color: "#EF4444" }} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
