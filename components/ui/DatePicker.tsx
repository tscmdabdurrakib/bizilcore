"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, X, ChevronDown } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
}

const MONTHS = [
  "জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন",
  "জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"
];
const DAYS_SHORT = ["রবি","সোম","মঙ্গল","বুধ","বৃহ","শুক্র","শনি"];

function parseLocal(val: string): Date | null {
  if (!val) return null;
  const [y, m, d] = val.split("-").map(Number);
  if (!y || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m - 1, d);
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function DatePicker({
  value,
  onChange,
  className = "",
  style,
  placeholder = "তারিখ বেছে নিন",
  min,
  max,
  disabled = false,
  required,
  id,
  name,
}: DatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = parseLocal(value);
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setShowYearDropdown(false); setShowMonthDropdown(false); }
  }, [open]);

  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, []);

  useEffect(() => {
    if (showYearDropdown && yearRef.current) {
      yearRef.current.querySelector("[data-active]")?.scrollIntoView({ block: "center" });
    }
  }, [showYearDropdown]);

  const prevMonth = useCallback(() => {
    setViewMonth(m => { if (m === 0) { setViewYear(y => y - 1); return 11; } return m - 1; });
    setShowYearDropdown(false); setShowMonthDropdown(false);
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(m => { if (m === 11) { setViewYear(y => y + 1); return 0; } return m + 1; });
    setShowYearDropdown(false); setShowMonthDropdown(false);
  }, []);

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDayOfMonth).fill(null)];
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const handleSelect = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const ymd = toYMD(d);
    if (min && ymd < min) return;
    if (max && ymd > max) return;
    onChange(ymd);
    setOpen(false);
  };

  const isSelected = (day: number) =>
    selected?.getFullYear() === viewYear &&
    selected?.getMonth() === viewMonth &&
    selected?.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const ymd = toYMD(d);
    return (!!min && ymd < min) || (!!max && ymd > max);
  };

  const displayValue = selected
    ? `${selected.getDate()} ${MONTHS[selected.getMonth()]}, ${selected.getFullYear()}`
    : "";

  const yearMin = today.getFullYear() - 80;
  const yearMax = today.getFullYear() + 20;
  const years = Array.from({ length: yearMax - yearMin + 1 }, (_, i) => yearMin + i);

  /* ── CSS-variable-based styles (auto light/dark via html.dark) ── */
  const S = {
    surface:   "var(--c-surface)",
    border:    "var(--c-border)",
    text:      "var(--c-text)",
    sub:       "var(--c-text-sub)",
    muted:     "var(--c-text-muted)",
    bg:        "var(--c-bg)",
    primary:   "var(--c-primary)",
    primaryLt: "var(--c-primary-light)",
    primaryTx: "var(--c-primary-text)",
  };

  const triggerStyle: React.CSSProperties = {
    backgroundColor: S.surface,
    borderColor: open ? S.primary : S.border,
    boxShadow: open ? `0 0 0 3px ${S.primaryLt}` : "none",
    opacity: disabled ? 0.6 : 1,
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const popupStyle: React.CSSProperties = {
    backgroundColor: S.surface,
    borderColor: S.border,
    color: S.text,
  };

  const dropdownStyle: React.CSSProperties = {
    backgroundColor: S.surface,
    borderColor: S.border,
  };

  return (
    <div ref={ref} className={`relative ${className}`} style={style}>
      {name && <input type="hidden" name={name} value={value} required={required} id={id} />}

      {/* ——— Trigger ——— */}
      <div
        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border cursor-pointer group"
        style={triggerStyle}
        onClick={() => !disabled && setOpen(o => !o)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); !disabled && setOpen(o => !o); }}}
      >
        <Calendar size={14} style={{ color: open ? S.primary : S.muted, flexShrink: 0, transition: "color 0.15s" }} />
        <span className="flex-1 truncate text-sm" style={{ color: displayValue ? S.text : S.muted }}>
          {displayValue || placeholder}
        </span>
        {value && !disabled ? (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }}
            className="flex-shrink-0 p-0.5 rounded transition-colors outline-none"
            style={{ color: S.muted }}
            onMouseEnter={e => (e.currentTarget.style.color = "#E24B4A")}
            onMouseLeave={e => (e.currentTarget.style.color = S.muted)}
            tabIndex={-1}
          >
            <X size={12} />
          </button>
        ) : (
          <ChevronDown
            size={13}
            className="flex-shrink-0 pointer-events-none transition-transform"
            style={{ color: S.muted, transform: open ? "rotate(180deg)" : "rotate(0)" }}
          />
        )}
      </div>

      {/* ——— Calendar popup ——— */}
      {open && (
        <div
          className="absolute z-[9999] mt-1.5 rounded-2xl shadow-2xl border p-4 w-[17rem] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 left-0"
          style={popupStyle}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-1 mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg transition-colors outline-none"
              style={{ color: S.muted }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.bg)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex-1 flex items-center justify-center gap-1">
              {/* Month selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}
                  className="text-sm font-bold px-2 py-0.5 rounded-lg transition-colors outline-none"
                  style={{ color: S.text }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = S.primary; (e.currentTarget as HTMLButtonElement).style.backgroundColor = S.primaryLt; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = S.text; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                >
                  {MONTHS[viewMonth]}
                </button>
                {showMonthDropdown && (
                  <div
                    className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-1 rounded-xl shadow-xl w-32 max-h-48 overflow-y-auto border"
                    style={dropdownStyle}
                  >
                    {MONTHS.map((m, i) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setViewMonth(i); setShowMonthDropdown(false); }}
                        className="w-full text-xs px-3 py-1.5 text-left transition-colors outline-none"
                        style={{
                          color: i === viewMonth ? S.primary : S.text,
                          fontWeight: i === viewMonth ? 700 : 400,
                          backgroundColor: i === viewMonth ? S.primaryLt : "transparent",
                        }}
                        onMouseEnter={e => { if (i !== viewMonth) (e.currentTarget as HTMLButtonElement).style.backgroundColor = S.bg; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = i === viewMonth ? S.primaryLt : "transparent"; }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year selector */}
              <div className="relative" ref={yearRef}>
                <button
                  type="button"
                  onClick={() => { setShowYearDropdown(v => !v); setShowMonthDropdown(false); }}
                  className="text-sm font-bold px-2 py-0.5 rounded-lg transition-colors outline-none"
                  style={{ color: S.text }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = S.primary; (e.currentTarget as HTMLButtonElement).style.backgroundColor = S.primaryLt; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = S.text; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                >
                  {viewYear}
                </button>
                {showYearDropdown && (
                  <div
                    className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-1 rounded-xl shadow-xl w-20 max-h-48 overflow-y-auto border"
                    style={dropdownStyle}
                  >
                    {years.map(y => (
                      <button
                        key={y}
                        type="button"
                        data-active={y === viewYear ? "" : undefined}
                        onClick={() => { setViewYear(y); setShowYearDropdown(false); }}
                        className="w-full text-xs px-3 py-1.5 text-left transition-colors outline-none"
                        style={{
                          color: y === viewYear ? S.primary : S.text,
                          fontWeight: y === viewYear ? 700 : 400,
                          backgroundColor: y === viewYear ? S.primaryLt : "transparent",
                        }}
                        onMouseEnter={e => { if (y !== viewYear) (e.currentTarget as HTMLButtonElement).style.backgroundColor = S.bg; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = y === viewYear ? S.primaryLt : "transparent"; }}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg transition-colors outline-none"
              style={{ color: S.muted }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.bg)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* ── Day names ── */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map((d, i) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold py-1"
                style={{ color: i === 0 || i === 6 ? "#E24B4A" : S.muted }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* ── Date grid ── */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="h-8" />;
              const sel = isSelected(day);
              const tod = isToday(day);
              const dis = isDisabled(day);
              const isWeekend = (firstDayOfMonth + day - 1) % 7 === 0 || (firstDayOfMonth + day - 1) % 7 === 6;

              let bgColor = "transparent";
              let textColor = isWeekend ? "#E24B4A" : S.text;
              let boxShadow = "none";

              if (sel) {
                bgColor = S.primary;
                textColor = "#FFFFFF";
                boxShadow = "0 2px 8px rgba(15,110,86,0.3)";
              } else if (tod) {
                bgColor = S.primaryLt;
                textColor = S.primary;
                boxShadow = `0 0 0 2px ${S.primary}`;
              } else if (dis) {
                textColor = S.muted;
              }

              return (
                <button
                  key={i}
                  type="button"
                  disabled={dis}
                  onClick={() => handleSelect(day)}
                  className="relative flex items-center justify-center h-8 w-full text-xs font-medium rounded-lg transition-all duration-100 outline-none"
                  style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    boxShadow,
                    cursor: dis ? "not-allowed" : "pointer",
                    transform: sel ? "scale(1.05)" : "scale(1)",
                  }}
                  onMouseEnter={e => {
                    if (!sel && !dis) (e.currentTarget as HTMLButtonElement).style.backgroundColor = S.bg;
                  }}
                  onMouseLeave={e => {
                    if (!sel && !tod) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                    else if (tod) (e.currentTarget as HTMLButtonElement).style.backgroundColor = S.primaryLt;
                  }}
                >
                  {day}
                  {tod && !sel && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ backgroundColor: S.primary }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Footer ── */}
          <div
            className="mt-3 pt-2.5 flex items-center justify-between border-t"
            style={{ borderColor: S.border }}
          >
            <button
              type="button"
              onClick={() => { onChange(toYMD(today)); setOpen(false); }}
              className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors outline-none"
              style={{ color: S.primary }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = S.primaryLt)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              আজকের তারিখ
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-xs px-2 py-1 rounded-lg transition-colors outline-none"
                style={{ color: S.muted }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#E24B4A"; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFE8E8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = S.muted; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                মুছে দিন
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
