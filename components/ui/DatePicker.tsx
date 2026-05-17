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
  }, [value]);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, []);

  useEffect(() => {
    if (showYearDropdown && yearRef.current) {
      const active = yearRef.current.querySelector("[data-active]");
      active?.scrollIntoView({ block: "center" });
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

  return (
    <div ref={ref} className={`relative ${className}`} style={style}>
      {name && <input type="hidden" name={name} value={value} required={required} id={id} />}

      {/* ——— Trigger wrapper ——— */}
      <div
        className={[
          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all duration-150 outline-none group",
          "bg-white dark:bg-gray-800 relative",
          disabled
            ? "border-gray-200 dark:border-gray-700 opacity-60"
            : open
              ? "border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900"
              : "border-gray-200 dark:border-gray-600 hover:border-emerald-400",
        ].join(" ")}
      >
        {/* Clickable area to open calendar */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen(o => !o)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left outline-none bg-transparent"
          tabIndex={0}
        >
          <Calendar
            size={14}
            className={`flex-shrink-0 transition-colors ${open ? "text-emerald-500" : "text-gray-400 group-hover:text-emerald-400"}`}
          />
          <span className={`flex-1 truncate text-sm ${displayValue ? "text-gray-800 dark:text-gray-100" : "text-gray-400"}`}>
            {displayValue || placeholder}
          </span>
        </button>
        {/* Clear / chevron — outside the trigger button */}
        {value && !disabled ? (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onChange(""); setOpen(false); }}
            className="flex-shrink-0 text-gray-300 hover:text-red-400 rounded transition-colors p-0.5 outline-none"
            tabIndex={-1}
          >
            <X size={12} />
          </button>
        ) : (
          <ChevronDown
            size={13}
            className={`flex-shrink-0 pointer-events-none transition-transform text-gray-300 ${open ? "rotate-180" : ""}`}
          />
        )}
      </div>

      {/* ——— Calendar popup ——— */}
      {open && (
        <div className={[
          "absolute z-[9999] mt-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl",
          "border border-gray-100 dark:border-gray-700 p-4 w-[17rem]",
          "animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150",
          "left-0",
        ].join(" ")}>

          {/* ── Header ── */}
          <div className="flex items-center gap-1 mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="flex-1 flex items-center justify-center gap-1">
              {/* Month selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setShowMonthDropdown(v => !v); setShowYearDropdown(false); }}
                  className="text-sm font-bold text-gray-800 dark:text-gray-100 hover:text-emerald-600 px-2 py-0.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  {MONTHS[viewMonth]}
                </button>
                {showMonthDropdown && (
                  <div className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl w-32 max-h-48 overflow-y-auto">
                    {MONTHS.map((m, i) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setViewMonth(i); setShowMonthDropdown(false); }}
                        className={`w-full text-xs px-3 py-1.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors ${i === viewMonth ? "text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20" : "text-gray-700 dark:text-gray-300"}`}
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
                  className="text-sm font-bold text-gray-800 dark:text-gray-100 hover:text-emerald-600 px-2 py-0.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  {viewYear}
                </button>
                {showYearDropdown && (
                  <div className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl w-20 max-h-48 overflow-y-auto">
                    {years.map(y => (
                      <button
                        key={y}
                        type="button"
                        data-active={y === viewYear ? "" : undefined}
                        onClick={() => { setViewYear(y); setShowYearDropdown(false); }}
                        className={`w-full text-xs px-3 py-1.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors ${y === viewYear ? "text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20" : "text-gray-700 dark:text-gray-300"}`}
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
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* ── Day names ── */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_SHORT.map((d, i) => (
              <div
                key={d}
                className={`text-center text-[10px] font-semibold py-1 ${i === 0 || i === 6 ? "text-red-400" : "text-gray-400"}`}
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
              return (
                <button
                  key={i}
                  type="button"
                  disabled={dis}
                  onClick={() => handleSelect(day)}
                  className={[
                    "relative flex items-center justify-center h-8 w-full text-xs font-medium rounded-lg transition-all duration-100",
                    dis ? "text-gray-200 dark:text-gray-600 cursor-not-allowed" : "cursor-pointer",
                    sel
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900 scale-105"
                      : tod
                        ? "text-emerald-600 dark:text-emerald-400 font-extrabold ring-2 ring-emerald-400 ring-offset-1 bg-emerald-50 dark:bg-emerald-900/30"
                        : dis
                          ? ""
                          : isWeekend
                            ? "text-red-400 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                  ].join(" ")}
                >
                  {day}
                  {tod && !sel && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Footer ── */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <button
              type="button"
              onClick={() => { onChange(toYMD(today)); setOpen(false); }}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              আজকের তারিখ
            </button>
            {value && (
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
