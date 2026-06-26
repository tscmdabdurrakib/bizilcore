"use client";

import { useState } from "react";
import { Edit3, X, Loader2, Save, Upload, Store } from "lucide-react";
import { Field, SelectField } from "./ui";
import type { Branch, ToastType } from "@/lib/shops/types";
import { SHOP_CATEGORIES } from "@/lib/shops/types";

interface Props {
  branch: Branch;
  onClose: () => void;
  onSaved: () => void;
  showToast: (type: ToastType, msg: string) => void;
}

export default function EditBranchModal({ branch, onClose, onSaved, showToast }: Props) {
  const [form, setForm] = useState({
    name: branch.name,
    category: branch.category ?? "",
    phone: branch.phone ?? "",
    address: branch.address ?? "",
    note: branch.note ?? "",
    logoUrl: branch.logoUrl ?? "",
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function uploadLogo(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("branchId", branch.id);
    const res = await fetch("/api/upload/branch-logo", { method: "POST", body: fd });
    const d = await res.json();
    setUploading(false);
    if (!res.ok) { showToast("error", d.error ?? "লোগো আপলোড ব্যর্থ"); return; }
    setForm(p => ({ ...p, logoUrl: d.url }));
  }

  async function save() {
    if (!form.name.trim()) { showToast("error", "শপের নাম দিন"); return; }
    setSaving(true);
    const res = await fetch(`/api/shops?branchId=${branch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) { showToast("success", "Branch আপডেট হয়েছে ✓"); onSaved(); }
    else { const d = await res.json(); showToast("error", d.error ?? "সমস্যা হয়েছে"); }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl p-6 max-w-md w-full" style={{ backgroundColor: "var(--c-surface)" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#EDE9FE" }}>
              <Edit3 size={15} style={{ color: "#7C3AED" }} />
            </div>
            <h3 className="font-black" style={{ color: "var(--c-text)" }}>Branch সম্পাদনা</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl" style={{ color: "var(--c-text-muted)" }}><X size={16} /></button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border flex items-center justify-center"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}>
              {form.logoUrl ? <img src={form.logoUrl} alt="" className="w-full h-full object-cover" /> : <Store size={18} style={{ color: "var(--c-text-muted)" }} />}
            </div>
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
              style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              লোগো পরিবর্তন
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
            </label>
          </div>
          <Field label="শপের নাম" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Field label="ফোন" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="01XXXXXXXXX" />
            <SelectField label="ক্যাটাগরি" value={form.category} onChange={v => setForm(p => ({ ...p, category: v }))} options={SHOP_CATEGORIES} />
          </div>
          <Field label="ঠিকানা" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} />
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--c-text-muted)" }}>নোট</label>
            <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              rows={2} className="w-full px-3 py-2 rounded-xl border text-sm resize-none outline-none"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>বাতিল</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#7C3AED" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
