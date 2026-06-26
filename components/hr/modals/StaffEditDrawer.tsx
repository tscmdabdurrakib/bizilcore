"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { StaffMember } from "@/lib/hr/types";
import { ROLE_LABEL } from "@/lib/hr/types";

interface BranchOption { id: string; name: string }

interface Props {
  member: StaffMember;
  onClose: () => void;
  onSaved: (member: StaffMember) => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function StaffEditDrawer({ member, onClose, onSaved, showToast }: Props) {
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [form, setForm] = useState({
    name: member.user.name,
    phone: member.phone ?? "",
    jobTitle: member.jobTitle ?? "",
    salary: member.salary?.toString() ?? "",
    role: member.role,
    isActive: member.isActive,
    branchId: member.branchId ?? "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/shops")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.branches) setBranches(d.branches);
      })
      .catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch(`/api/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        jobTitle: form.jobTitle,
        salary: form.salary ? Number(form.salary) : null,
        role: form.role,
        isActive: form.isActive,
        branchId: form.branchId || null,
      }),
    });
    const d = await r.json();
    setLoading(false);
    if (r.ok) {
      showToast("success", "আপডেট হয়েছে ✓");
      onSaved(d);
      onClose();
    } else {
      showToast("error", d.error ?? "আপডেট যায়নি");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">{member.user.name}</h3>
            <p className="text-xs text-gray-400">{member.user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} className="text-gray-400" /></button>
        </div>
        <form id="staff-edit-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="নাম" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
          <Field label="ফোন" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
          <Field label="পদবি" value={form.jobTitle} onChange={v => setForm(p => ({ ...p, jobTitle: v }))} />
          <Field label="মাসিক বেতন (৳)" type="number" value={form.salary} onChange={v => setForm(p => ({ ...p, salary: v }))} />
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">ভূমিকা</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900">
              <option value="staff">{ROLE_LABEL.staff}</option>
              <option value="manager">{ROLE_LABEL.manager}</option>
            </select>
          </div>
          {branches.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">শাখা (Branch)</label>
              <select value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900">
                <option value="">মূল শপ / সব লোকেশন</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
            <span className="text-sm text-gray-700">সক্রিয় কর্মী</span>
          </label>
          {member.salary ? (
            <p className="text-xs text-gray-400">বর্তমান বেতন: {formatBDT(member.salary)}</p>
          ) : null}
        </form>
        <div className="p-5 border-t border-gray-100">
          <button type="submit" form="staff-edit-form" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            সেভ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-emerald-500 text-gray-900" />
    </div>
  );
}
