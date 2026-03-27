import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBDT(amount: number | null | undefined): string {
  const n = amount ?? 0;
  return `৳${n.toLocaleString("en-IN")}`;
}

export function formatBanglaDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const months = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (dDate.getTime() === today.getTime()) return "আজ";
  if (dDate.getTime() === yesterday.getTime()) return "গতকাল";
  return formatBanglaDate(d);
}

export const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: "Pending",   bg: "var(--status-pending-bg)",    text: "var(--status-pending-text)" },
  confirmed: { label: "নিশ্চিত",  bg: "var(--status-confirmed-bg)",  text: "var(--status-confirmed-text)" },
  shipped:   { label: "পাঠানো",   bg: "var(--status-shipped-bg)",    text: "var(--status-shipped-text)" },
  delivered: { label: "পৌঁছেছে", bg: "var(--status-delivered-bg)",  text: "var(--status-delivered-text)" },
  returned:  { label: "Return",    bg: "var(--status-returned-bg)",   text: "var(--status-returned-text)" },
  cancelled: { label: "বাতিল",    bg: "var(--status-cancelled-bg)",  text: "var(--status-cancelled-text)" },
};

export function getStatusStyle(status: string) {
  return STATUS_MAP[status] ?? STATUS_MAP.pending;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
