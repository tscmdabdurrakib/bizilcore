"use client";

import { AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = pct >= 100 ? "#EF4444" : pct >= 66 ? "#F59E0B" : "#10B981";
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-bg)" }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function StatPill({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ backgroundColor: `${color}14` }}>
      <span className="text-xs font-black" style={{ color }}>{value}</span>
      <span className="text-[10px] font-medium" style={{ color: `${color}aa` }}>{label}</span>
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--c-text-muted)" }}>
        {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-10 px-3 rounded-xl border text-sm outline-none transition-all"
        style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
        onFocus={e => (e.currentTarget.style.borderColor = "#0F6E56")}
        onBlur={e => (e.currentTarget.style.borderColor = "var(--c-border)")}
      />
    </div>
  );
}

export function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[] | string[];
}) {
  return (
    <div>
      <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--c-text-muted)" }}>{label}</label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className="w-full h-10 px-3 pr-8 rounded-xl border text-sm outline-none appearance-none"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
        >
          <option value="">নির্বাচন করুন</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--c-text-muted)" }} />
      </div>
    </div>
  );
}

export function Toast({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl flex items-center gap-2"
      style={{ backgroundColor: type === "success" ? "#0F6E56" : "#DC2626" }}>
      {type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {msg}
    </div>
  );
}
