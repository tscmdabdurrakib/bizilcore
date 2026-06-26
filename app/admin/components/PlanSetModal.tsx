"use client";

import { useState } from "react";

interface PlanSetModalProps {
  userId: string;
  name: string;
  currentPlan: string;
  initialPlan?: string;
  initialMonths?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PlanSetModal({
  userId,
  name,
  currentPlan,
  initialPlan,
  initialMonths = 1,
  onClose,
  onSuccess,
}: PlanSetModalProps) {
  const [newPlan, setNewPlan] = useState(initialPlan ?? currentPlan ?? "pro");
  const [newMonths, setNewMonths] = useState(initialMonths);
  const [saving, setSaving] = useState(false);

  async function handleSetPlan() {
    setSaving(true);
    const r = await fetch(`/api/admin/users/${userId}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan, months: newMonths }),
    });
    setSaving(false);
    if (r.ok) {
      onSuccess?.();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-gray-900">Plan Set করুন</h3>
        <p className="mb-4 mt-1 text-xs text-gray-500">
          {name} — বর্তমান: {currentPlan}
        </p>
        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Plan</label>
            <select
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>
          {newPlan !== "free" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">মেয়াদ (মাস)</label>
              <select
                value={newMonths}
                onChange={(e) => setNewMonths(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                {[1, 3, 6, 12].map((m) => (
                  <option key={m} value={m}>{m} মাস</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition active:scale-95"
          >
            বাতিল
          </button>
          <button
            onClick={handleSetPlan}
            disabled={saving}
            className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
          >
            {saving ? "সেভ..." : "Set করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
