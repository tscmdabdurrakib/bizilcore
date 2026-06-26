import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.replace(/\s/g, "-").toLowerCase();

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--c-text-sub)" }}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "w-full appearance-none px-3.5 py-2.5 pr-9 text-sm rounded-xl border outline-none transition-all",
            "focus:ring-2 focus:ring-[var(--c-primary)]/20 focus:border-[var(--c-primary)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className,
          )}
          style={{
            backgroundColor: "var(--c-surface)",
            borderColor: error ? "var(--bg-danger-text)" : "var(--c-border)",
            color: "var(--c-text)",
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--c-text-muted)" }} />
      </div>
      {error && <p className="text-xs" style={{ color: "var(--bg-danger-text)" }}>{error}</p>}
    </div>
  );
}
