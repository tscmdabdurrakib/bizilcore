import type { ActivityLogRow } from "@/lib/activity/types";

export function actionBadgeClass(actionType: string): string {
  if (actionType === "order_created" || actionType === "order_status_changed") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (actionType === "error") return "bg-red-100 text-red-800";
  if (actionType === "page_view" || actionType === "page_leave") return "bg-gray-100 text-gray-600";
  if (actionType === "sms_sent") return "bg-blue-100 text-blue-800";
  if (actionType === "facebook_connected" || actionType === "facebook_reply_sent") {
    return "bg-indigo-100 text-indigo-800";
  }
  return "bg-amber-100 text-amber-800";
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "এইমাত্র";
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
  return `${Math.floor(hrs / 24)} দিন আগে`;
}

export function userInitial(name?: string | null, email?: string | null): string {
  const src = name || email || "?";
  return src.charAt(0).toUpperCase();
}

export type { ActivityLogRow };
