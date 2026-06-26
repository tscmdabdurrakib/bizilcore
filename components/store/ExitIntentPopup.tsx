"use client";

import { useEffect, useState } from "react";
import { useStoreTheme } from "./ThemeProvider";

interface Props {
  slug: string;
  enabled?: boolean;
  couponCode?: string | null;
}

export function ExitIntentPopup({ slug, enabled, couponCode }: Props) {
  const { primary, defaults } = useStoreTheme();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!enabled || dismissed) return;
    const key = `exit_popup_${slug}`;
    if (sessionStorage.getItem(key)) return;

    function onLeave(e: MouseEvent) {
      if (e.clientY <= 0) {
        setOpen(true);
        sessionStorage.setItem(key, "1");
        document.removeEventListener("mouseout", onLeave);
      }
    }
    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, [enabled, dismissed, slug]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="max-w-sm w-full rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: defaults.surface }}>
        <h3 className="text-lg font-bold mb-2" style={{ color: defaults.text }}>যাচ্ছেন?</h3>
        <p className="text-sm mb-4" style={{ color: defaults.muted }}>
          {couponCode
            ? `এখনই অর্ডার করুন — কুপন ${couponCode} ব্যবহার করুন!`
            : "আজই অর্ডার করুন — স্টক সীমিত!"}
        </p>
        <div className="flex gap-2">
          <a href={`/store/${slug}/products`}
            className="flex-1 py-2.5 rounded-xl text-center text-sm font-bold text-white"
            style={{ backgroundColor: primary }}>
            কেনাকাটা চালিয়ে যান
          </a>
          <button onClick={() => { setOpen(false); setDismissed(true); }}
            className="px-4 py-2.5 rounded-xl text-sm border" style={{ borderColor: defaults.border, color: defaults.muted }}>
            বন্ধ
          </button>
        </div>
      </div>
    </div>
  );
}
