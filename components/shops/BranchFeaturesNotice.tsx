"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

const DISMISS_KEY = "bizilcore_branch_features_notice_v2";

export default function BranchFeaturesNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(DISMISS_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="rounded-2xl border p-4 relative"
      style={{ borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" }}>
      <button onClick={dismiss} className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/60"
        style={{ color: "#047857" }} aria-label="বন্ধ করুন">
        <X size={14} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <div>
          <p className="text-sm font-black mb-1" style={{ color: "#065F46" }}>নতুন: শাখা ব্যবস্থাপনা v2</p>
          <ul className="text-xs space-y-0.5" style={{ color: "#047857" }}>
            <li>• Branch-wise অর্ডার ও স্টক কাটা</li>
            <li>• Reports-এ branch filter</li>
            <li>• Auto reorder + barcode transfer</li>
            <li>• Staff-কে branch-এ assign</li>
          </ul>
          <button onClick={dismiss}
            className="mt-2 text-[10px] font-bold px-3 py-1 rounded-lg text-white"
            style={{ backgroundColor: "#059669" }}>
            বুঝেছি ✓
          </button>
        </div>
      </div>
    </div>
  );
}
