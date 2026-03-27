"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, Check, X, Package } from "lucide-react";

interface StoreReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { id: string; name: string; imageUrl: string | null } | null;
}

export default function StoreReviewsPage() {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"pending" | "approved" | "all">("pending");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const S = {
    surface: "var(--c-surface)",
    border: "var(--c-border)",
    text: "var(--c-text)",
    muted: "var(--c-text-muted)",
    secondary: "var(--c-text-sub)",
    primary: "var(--c-primary)",
  };

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchReviews() {
    const r = await fetch("/api/store/reviews");
    if (r.ok) {
      const d = await r.json();
      setReviews(Array.isArray(d) ? d : d.reviews ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchReviews(); }, []);

  async function updateReview(id: string, isApproved: boolean) {
    setUpdating(id);
    const r = await fetch(`/api/store/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved }),
    });
    setUpdating(null);
    if (r.ok) {
      setReviews(rs => rs.map(r => r.id === id ? { ...r, isApproved } : r));
      showToast("success", isApproved ? "অনুমোদিত হয়েছে ✓" : "প্রত্যাখ্যান করা হয়েছে");
    } else {
      showToast("error", "আপডেট করা যায়নি");
    }
  }

  const filtered = reviews.filter(r => {
    if (filterTab === "pending") return !r.isApproved;
    if (filterTab === "approved") return r.isApproved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.isApproved).length;
  const approvedCount = reviews.filter(r => r.isApproved).length;

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={12} style={{ color: i < rating ? "#F59E0B" : S.border }} fill={i < rating ? "#F59E0B" : "none"} />
    ));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin" style={{ color: S.muted }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
          <Star size={18} color="#fff" />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: S.text }}>রিভিউ পর্যালোচনা</h1>
          <p className="text-xs" style={{ color: S.muted }}>
            {pendingCount}টি অপেক্ষমান · {approvedCount}টি অনুমোদিত
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["pending", "approved", "all"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className="px-3 h-8 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: filterTab === tab ? S.primary : "var(--c-surface-raised)",
              color: filterTab === tab ? "#fff" : S.secondary,
            }}>
            {tab === "pending" ? `অপেক্ষমান (${pendingCount})` : tab === "approved" ? `অনুমোদিত (${approvedCount})` : "সব"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: S.muted }}>
          <Star size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">কোনো রিভিউ নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div key={review.id} className="rounded-2xl border p-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold" style={{ color: S.text }}>{review.reviewerName}</p>
                    <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
                      style={review.isApproved
                        ? { backgroundColor: "#E1F5EE", color: "#0F6E56" }
                        : { backgroundColor: "var(--status-pending-bg)", color: "var(--status-pending-text)" }}>
                      {review.isApproved ? "অনুমোদিত" : "অপেক্ষমান"}
                    </span>
                  </div>

                  {review.product && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-lg" style={{ backgroundColor: "var(--c-surface-raised)" }}>
                      <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0" style={{ backgroundColor: S.border }}>
                        {review.product.imageUrl
                          ? <img src={review.product.imageUrl} alt={review.product.name} className="w-full h-full object-cover" />
                          : <Package size={12} className="m-auto mt-1" style={{ color: S.muted }} />
                        }
                      </div>
                      <p className="text-xs font-medium truncate" style={{ color: S.secondary }}>{review.product.name}</p>
                    </div>
                  )}

                  {review.comment && (
                    <p className="text-sm" style={{ color: S.secondary }}>{review.comment}</p>
                  )}

                  <p className="text-xs mt-2" style={{ color: S.muted }}>
                    {new Date(review.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {!review.isApproved && (
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
                  <button
                    onClick={() => updateReview(review.id, true)}
                    disabled={updating === review.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}>
                    <Check size={14} /> অনুমোদন
                  </button>
                  <button
                    onClick={() => updateReview(review.id, false)}
                    disabled={updating === review.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
                    <X size={14} /> প্রত্যাখ্যান
                  </button>
                </div>
              )}

              {review.isApproved && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: S.border }}>
                  <button
                    onClick={() => updateReview(review.id, false)}
                    disabled={updating === review.id}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium disabled:opacity-50"
                    style={{ backgroundColor: "#FEF2F2", color: "#EF4444" }}>
                    <X size={12} className="inline mr-1" />প্রত্যাখ্যান করুন
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
