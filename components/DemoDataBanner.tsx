"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

export default function DemoDataBanner() {
  const [hasDemo, setHasDemo] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checked, setChecked] = useState(false);

  const check = useCallback(async () => {
    const d = await fetch("/api/demo-data").then(r => r.json()).catch(() => ({ hasDemo: false }));
    setHasDemo(d.hasDemo);
    setChecked(true);
  }, []);

  useEffect(() => { check(); }, [check]);

  async function deleteAll() {
    setDeleting(true);
    await fetch("/api/demo-data", { method: "DELETE" }).catch(() => {});
    setHasDemo(false);
    setDeleting(false);
    window.dispatchEvent(new CustomEvent("demo-data-deleted"));
  }

  if (!checked || !hasDemo) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
      style={{ backgroundColor: "#FFFBEB", borderColor: "#FCD34D" }}>
      <AlertTriangle size={16} style={{ color: "#D97706", flexShrink: 0 }} />
      <p className="text-sm font-medium flex-1" style={{ color: "#92400E" }}>
        ⚠️ এগুলো demo data — শুরু করার আগে মুছে ফেলুন।
      </p>
      <button onClick={deleteAll} disabled={deleting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: "#D97706", color: "#fff" }}>
        {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        সব Demo Data মুছুন
      </button>
    </div>
  );
}
