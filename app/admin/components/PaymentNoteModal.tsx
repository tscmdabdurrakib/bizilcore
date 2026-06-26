"use client";

import { useState } from "react";

interface PaymentNoteModalProps {
  paymentId: string;
  action: "approve" | "reject";
  onClose: () => void;
  onConfirm: (paymentId: string, action: "approve" | "reject", note?: string) => Promise<void>;
}

export default function PaymentNoteModal({ paymentId, action, onClose, onConfirm }: PaymentNoteModalProps) {
  const [noteText, setNoteText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm(paymentId, action, noteText);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-6 shadow-xl">
        <h3 className="mb-3 text-base font-bold text-gray-900">
          {action === "approve" ? "Payment Approve করুন" : "Payment Reject করুন"}
        </h3>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Admin note (ঐচ্ছিক) — user-কে দেখানো হবে"
          rows={3}
          className="mb-4 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 transition active:scale-95"
          >
            বাতিল
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60 ${
              action === "approve" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {loading ? "..." : action === "approve" ? "Approve করুন" : "Reject করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
