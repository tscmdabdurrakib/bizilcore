"use client";
import { useEffect } from "react";
import {
  X, Phone, MapPin, Facebook, Copy, ExternalLink,
  CheckCircle, XCircle, PackageCheck, ShoppingCart, MessageCircle, Hash,
} from "lucide-react";
import Link from "next/link";
import { extractContactInfo } from "@/lib/extract-contact";

interface Order {
  id: string;
  commenterName: string;
  commentText: string;
  pageName?: string | null;
  status: string;
  createdAt: string;
  fbProfile?: string | null;
  commenterFbId?: string | null;
  postId?: string | null;
  commentId?: string | null;
}

interface Props {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}

export default function OrderDetailDrawer({ order, onClose, onStatusChange }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!order) return null;

  const { phones, address } = extractContactInfo(order.commentText);
  const created = new Date(order.createdAt);

  const copy = (text: string) => navigator.clipboard.writeText(text);

  const fbProfileUrl = order.fbProfile
    ?? (order.commenterFbId ? `https://facebook.com/${order.commenterFbId}` : null);
  const fbPostUrl = order.postId ? `https://facebook.com/${order.postId}` : null;

  return (
    <div className="fixed inset-0 z-[100] flex" onClick={onClose}>
      <div className="flex-1 bg-black/40 backdrop-blur-sm" />
      <aside
        className="w-full max-w-md h-full overflow-y-auto shadow-2xl animate-slide-in-right"
        style={{ backgroundColor: "var(--c-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b sticky top-0 z-10 backdrop-blur"
          style={{
            borderColor: "var(--c-border)",
            background: "linear-gradient(135deg, rgba(24,119,242,0.08), rgba(15,110,86,0.04))",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #1877F2 0%, #0B5FD9 100%)" }}
              >
                {order.commenterName[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="font-bold text-base" style={{ color: "var(--c-text)" }}>
                  {order.commenterName}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                  {order.pageName ?? "Facebook Page"} · {created.toLocaleString("bn-BD")}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors"
              style={{ color: "var(--c-text-muted)" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Comment text */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-muted)" }}>
              মূল কমেন্ট
            </h3>
            <div
              className="rounded-xl p-3.5 border text-sm leading-relaxed"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}
            >
              {order.commentText}
            </div>
          </section>

          {/* Auto-extracted contact */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-muted)" }}>
              অটো-শনাক্ত তথ্য
            </h3>
            <div className="space-y-2">
              {phones.length === 0 && !address && (
                <div className="rounded-xl border-dashed border p-3 text-xs text-center" style={{ borderColor: "var(--c-border)", color: "var(--c-text-muted)" }}>
                  ফোন নম্বর বা ঠিকানা পাওয়া যায়নি
                </div>
              )}

              {phones.map((p) => (
                <div
                  key={p}
                  className="flex items-center justify-between rounded-xl border p-3"
                  style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#E1F5EE" }}>
                      <Phone size={14} style={{ color: "#0F6E56" }} />
                    </div>
                    <span className="font-mono text-sm font-semibold" style={{ color: "var(--c-text)" }}>{p}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copy(p)}
                      title="কপি করুন"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
                      style={{ color: "var(--c-text-muted)" }}
                    >
                      <Copy size={13} />
                    </button>
                    <a
                      href={`tel:${p}`}
                      title="কল করুন"
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
                      style={{ color: "#0F6E56" }}
                    >
                      <Phone size={13} />
                    </a>
                  </div>
                </div>
              ))}

              {address && (
                <div className="flex items-start gap-2 rounded-xl border p-3" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FFF3DC" }}>
                    <MapPin size={14} style={{ color: "#EF9F27" }} />
                  </div>
                  <p className="text-sm flex-1 leading-relaxed" style={{ color: "var(--c-text)" }}>{address}</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick links */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-muted)" }}>
              দ্রুত অ্যাক্সেস
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {fbProfileUrl && (
                <a
                  href={fbProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm"
                  style={{ borderColor: "var(--c-border)", color: "#1877F2" }}
                >
                  <Facebook size={14} />
                  FB Profile
                  <ExternalLink size={11} className="ml-auto opacity-50" />
                </a>
              )}
              {fbPostUrl && (
                <a
                  href={fbPostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm"
                  style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
                >
                  <Hash size={14} />
                  মূল পোস্ট
                  <ExternalLink size={11} className="ml-auto opacity-50" />
                </a>
              )}
              {order.commenterFbId && (
                <Link
                  href={`/fb-orders?view=messenger&sender=${order.commenterFbId}`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm"
                  style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}
                >
                  <MessageCircle size={14} />
                  Messenger
                </Link>
              )}
            </div>
          </section>

          {/* Convert to order */}
          <section>
            <Link
              href={`/orders/new?customerName=${encodeURIComponent(order.commenterName)}&suggestId=${order.id}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold text-sm text-white shadow-sm transition-all hover:opacity-95"
              style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}
            >
              <ShoppingCart size={16} />
              পূর্ণ অর্ডার তৈরি করুন
            </Link>
            <p className="text-[11px] mt-2 text-center" style={{ color: "var(--c-text-muted)" }}>
              কাস্টমার নাম প্রি-ফিল হবে, পণ্য যোগ করে অর্ডার সম্পন্ন করুন
            </p>
          </section>

          {/* Status actions */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-muted)" }}>
              স্ট্যাটাস পরিবর্তন
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onStatusChange(order.id, "confirmed")}
                disabled={order.status === "confirmed"}
                className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50"
                style={{ borderColor: "var(--c-border)", color: "#2B7CE9" }}
              >
                <CheckCircle size={16} />
                কনফার্ম
              </button>
              <button
                onClick={() => onStatusChange(order.id, "delivered")}
                disabled={order.status === "delivered"}
                className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50"
                style={{ borderColor: "var(--c-border)", color: "#0F6E56" }}
              >
                <PackageCheck size={16} />
                ডেলিভারি
              </button>
              <button
                onClick={() => onStatusChange(order.id, "cancelled")}
                disabled={order.status === "cancelled"}
                className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-50"
                style={{ borderColor: "var(--c-border)", color: "#E24B4A" }}
              >
                <XCircle size={16} />
                বাতিল
              </button>
            </div>
          </section>
        </div>
      </aside>

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.22s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
