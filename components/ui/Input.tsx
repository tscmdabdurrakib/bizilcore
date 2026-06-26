import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.replace(/\s/g, "-").toLowerCase();

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--c-text-sub)" }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all",
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
      />
      {error && <p className="text-xs" style={{ color: "var(--bg-danger-text)" }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{hint}</p>}
    </div>
  );
}
