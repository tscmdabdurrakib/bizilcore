"use client";

import { useState } from "react";
import { X, UserPlus, Check, Copy, Loader2 } from "lucide-react";
import type { StaffMember } from "@/lib/hr/types";

interface Props {
  onClose: () => void;
  onInvited: (member: StaffMember) => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function InviteModal({ onClose, onInvited, showToast }: Props) {
  const [form, setForm] = useState({ email: "", role: "staff", name: "", phone: "", jobTitle: "", salary: "" });
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    const r = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setInviting(false);
    if (r.ok) {
      setInviteLink(d.inviteUrl);
      onInvited(d);
    } else {
      showToast("error", d.error ?? "Invite পাঠানো যায়নি।");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
              <UserPlus size={16} color="#fff" />
            </div>
            <h3 className="font-bold text-gray-900">Email Invite</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={16} className="text-gray-400" /></button>
        </div>

        {inviteLink ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><Check size={12} className="text-emerald-600" /></div>
              <p className="text-sm font-semibold text-gray-900">Invite link তৈরি হয়েছে!</p>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-gray-50 border border-gray-200">
              <p className="text-xs font-mono flex-1 break-all text-gray-700">{inviteLink}</p>
              <button onClick={() => { navigator.clipboard.writeText(inviteLink); showToast("success", "Copy হয়েছে ✓"); }} className="p-1.5 rounded-lg hover:bg-gray-200">
                <Copy size={14} className="text-gray-500" />
              </button>
            </div>
            <button onClick={() => { setInviteLink(null); onClose(); }} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
              সম্পন্ন
            </button>
          </div>
        ) : (
          <form onSubmit={sendInvite} className="space-y-3">
            <Field label="Email *" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} placeholder="staff@example.com" required />
            <Field label="নাম" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="কর্মীর নাম" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="ফোন" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="01XXXXXXXXX" />
              <Field label="পদবি" value={form.jobTitle} onChange={v => setForm(p => ({ ...p, jobTitle: v }))} placeholder="Sales Executive" />
            </div>
            <Field label="বেতন (৳)" type="number" value={form.salary} onChange={v => setForm(p => ({ ...p, salary: v }))} placeholder="15000" />
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">ভূমিকা</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: "manager", label: "ম্যানেজার" }, { value: "staff", label: "স্টাফ" }].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, role: opt.value }))}
                    className={`p-2.5 rounded-xl border text-sm font-semibold ${form.role === opt.value ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-600"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">বাতিল</button>
              <button type="submit" disabled={inviting} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
                {inviting ? <Loader2 size={15} className="animate-spin mx-auto" /> : "Invite করুন"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 text-gray-900" />
    </div>
  );
}
