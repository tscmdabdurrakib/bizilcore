"use client";

import { useState } from "react";
import { Plus, X, Loader2, Store, AlertTriangle, Upload } from "lucide-react";
import { Field, SelectField } from "./ui";
import { SHOP_CATEGORIES } from "@/lib/shops/types";

interface Props {
  onClose: () => void;
  onCreated: () => void;
  guided?: boolean;
}

export default function CreateBranchModal({ onClose, onCreated, guided }: Props) {
  const [form, setForm] = useState({ name: "", category: "", phone: "", address: "", note: "" });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function uploadLogo(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/branch-logo", { method: "POST", body: fd });
    const d = await res.json();
    setUploading(false);
    if (!res.ok) { setErr(d.error ?? "লোগো আপলোড ব্যর্থ"); return; }
    setLogoUrl(d.url);
  }

  async function submit() {
    if (!form.name.trim()) { setErr("শপের নাম দিন"); return; }
    setCreating(true); setErr(null);
    const res = await fetch("/api/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, logoUrl }),
    });
    const d = await res.json();
    setCreating(false);
    if (!res.ok) { setErr(d.error ?? "সমস্যা হয়েছে"); return; }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--c-surface)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F6E56, #10B981)" }}>
              <Plus size={16} color="#fff" />
            </div>
            <div>
              <h3 className="font-black" style={{ color: "var(--c-text)" }}>নতুন Branch তৈরি</h3>
              {guided && <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>ধাপ ১/৩ — শাখার তথ্য</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl" style={{ color: "var(--c-text-muted)" }}><X size={16} /></button>
        </div>

        {err && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertTriangle size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
            <p className="text-sm" style={{ color: "#DC2626" }}>{err}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border flex items-center justify-center"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}>
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Store size={20} style={{ color: "var(--c-text-muted)" }} />
              )}
            </div>
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "আপলোড..." : "লোগো (ঐচ্ছিক)"}
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
            </label>
          </div>

          <Field label="শাখার নাম" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))}
            placeholder="যেমন: রিনার বুটিক — চট্টগ্রাম" required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="ফোন" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="01XXXXXXXXX" />
            <SelectField label="ক্যাটাগরি" value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))} options={SHOP_CATEGORIES} />
          </div>
          <Field label="ঠিকানা" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="যেমন: Uttara, Dhaka" />
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--c-text-muted)" }}>নোট</label>
            <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="এই branch সম্পর্কে…" rows={2}
              className="w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
            />
          </div>
        </div>

        {form.name && (
          <div className="mt-4 p-3 rounded-xl" style={{ backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE" }}>
            <p className="text-[10px] font-bold mb-1.5" style={{ color: "#4F46E5" }}>Preview</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black overflow-hidden"
                style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
                {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : form.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--c-text)" }}>{form.name}</p>
                {form.address && <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{form.address}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>বাতিল</button>
          <button onClick={submit} disabled={creating}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #0F6E56, #10B981)" }}
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Store size={14} />}
            {creating ? "তৈরি হচ্ছে..." : "Branch তৈরি করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
