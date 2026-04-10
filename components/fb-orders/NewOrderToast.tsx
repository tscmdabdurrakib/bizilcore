"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Toast {
  id: number;
  name: string;
}

export default function NewOrderToast({ onNew }: { onNew?: (handler: (name: string) => void) => void }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (!onNew) return;
    onNew((name: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, name }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
    });
  }, [onNew]);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium"
          style={{ backgroundColor: "#0F6E56", minWidth: 260 }}
        >
          <span className="text-base">🔔</span>
          <span className="flex-1">
            নতুন অর্ডার! <span className="font-bold">{toast.name}</span> কমেন্ট করেছেন
          </span>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="opacity-70 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
