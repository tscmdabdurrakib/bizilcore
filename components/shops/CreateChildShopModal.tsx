"use client";

import { useState } from "react";
import { X, Loader2, Store, Plus } from "lucide-react";
import { Field } from "./ui";
import type { ToastType } from "@/lib/shops/types";

interface Props {
  onClose: () => void;
  onCreated: () => void;
  showToast: (type: ToastType, msg: string) => void;
}

export default function CreateChildShopModal({ onClose, onCreated, showToast }: Props) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", category: "" });
  const [creating, setCreating] = useState(false);

  async function submit() {
    if (!form.name.trim()) { showToast("error", "শপের নাম দিন"); return; }
    setCreating(true);
    const res = await fetch("/api/shops/child", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    setCreating(false);
    if (!res.ok) { showToast("error", d.error ?? "সমস্যা হয়েছে"); return; }
    showToast("success", "নতুন শপ তৈরি হয়েছে — topbar থেকে switch করুন ✓");
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl p-6 max-w-md w-full" style={{ backgroundColor: "var(--c-surface)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
              <Store size={16} color="#fff" />
            </div>
            <div>
              <h3 className="font-black" style={{ color: "var(--c-text)" }}>Full Shop তৈরি</h3>
              <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>আলাদা inventory, settings, switcher</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl" style={{ color: "var(--c-text-muted)" }}><X size={16} /></button>
        </div>
        <div className="space-y-3">
          <Field label="শপের নাম" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} required placeholder="যেমন: Rina Fashion — Online" />
          <Field label="ফোন" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="01XXXXXXXXX" />
          <Field label="ঠিকানা" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} />
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>বাতিল</button>
          <button onClick={submit} disabled={creating}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)" }}>
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            {creating ? "তৈরি..." : "শপ তৈরি"}
          </button>
        </div>
      </div>
    </div>
  );
}
