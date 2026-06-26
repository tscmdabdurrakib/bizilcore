"use client";

import { useState } from "react";
import { X, UserPlus, Loader2 } from "lucide-react";
import type { StaffMember } from "@/lib/hr/types";

interface Props {
  onClose: () => void;
  onAdded: (member: StaffMember) => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function QuickAddModal({ onClose, onAdded, showToast }: Props) {
  const [form, setForm] = useState({ name: "", phone: "", role: "staff", jobTitle: "", salary: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quickAdd: true }),
    });
    const d = await r.json();
    setLoading(false);
    if (r.ok) {
      showToast("success", "কর্মী যোগ হয়েছে ✓");
      onAdded(d);
      onClose();
    } else {
      showToast("error", d.error ?? "যোগ করা যায়নি");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600">
              <UserPlus size={16} color="#fff" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">দ্রুত যোগ করুন</h3>
              <p className="text-[10px] text-gray-400">লগইন ছাড়াই রেকর্ড রাখুন</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="নাম *" required
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" />
          <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="ফোন *" required
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" />
          <input value={form.jobTitle} onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))} placeholder="পদবি"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" />
          <input type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} placeholder="মাসিক বেতন (৳)"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-blue-500" />
          <div className="grid grid-cols-2 gap-2">
            {[{ v: "staff", l: "স্টাফ" }, { v: "manager", l: "ম্যানেজার" }].map(o => (
              <button key={o.v} type="button" onClick={() => setForm(p => ({ ...p, role: o.v }))}
                className={`py-2 rounded-xl border text-sm font-semibold ${form.role === o.v ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`}>
                {o.l}
              </button>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">বাতিল</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60">
              {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : "যোগ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
